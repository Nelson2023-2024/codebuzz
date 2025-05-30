import { Router } from 'express';
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation
import { Event } from '../models/Event.model.js';
import { RSVP } from '../models/RSVP.model.js';
import { EmailLog } from '../models/EmailLog.model.js';
import { Guest } from '../models/Guest.model.js';


const router = Router();

// Get event statistics
router.get('/events/:eventId/stats', async (req, res) => {
    try {
        const { eventId } = req.params;

        // Validate eventId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: 'Invalid Event ID format' });
        }

        const [event, rsvpStats, emailStats] = await Promise.all([
            Event.findById(eventId),
            RSVP.aggregate([
                { $match: { event: new mongoose.Types.ObjectId(eventId) } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            EmailLog.aggregate([
                { $match: { event: new mongoose.Types.ObjectId(eventId) } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const stats = {
            event,
            rsvpStats: rsvpStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            emailStats: emailStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        };

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export guest data
router.get('/events/:eventId/export', async (req, res) => {
    try {
        const { eventId } = req.params;

        // Validate eventId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: 'Invalid Event ID format' });
        }

        const guests = await RSVP.find({ event: eventId })
            .populate('guest', 'firstName lastName email')
            .select('status rsvpDate specialRequests dietaryRestrictions seatNumber') // Include seatNumber
            .lean();

        // Convert to CSV format
        const csvHeaders = 'First Name,Last Name,Email,RSVP Status,Seat Number,RSVP Date,Special Requests,Dietary Restrictions\n';
        const csvData = guests.map(rsvp => {
            const guest = rsvp.guest;
            return [
                guest.firstName,
                guest.lastName,
                guest.email,
                rsvp.status,
                rsvp.seatNumber || '', // Add seat number
                rsvp.rsvpDate ? new Date(rsvp.rsvpDate).toLocaleDateString() : '',
                rsvp.specialRequests || '',
                rsvp.dietaryRestrictions || ''
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Wrap fields in quotes and escape
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=guest-list-${eventId}.csv`); // More specific filename
        res.send(csvHeaders + csvData);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk import guests
router.post('/guests/import', async (req, res) => {
    try {
        const { guests } = req.body; // Array of guest objects

        if (!Array.isArray(guests) || guests.length === 0) {
            return res.status(400).json({ error: 'Guests array is required' });
        }

        // Add invitation token to each guest before inserting
        const guestsWithTokens = guests.map(guest => ({
            ...guest,
            invitationToken: mongoose.Types.ObjectId().toHexString() // Generate a unique token
        }));

        const results = await Guest.insertMany(guestsWithTokens, { ordered: false }); // `ordered: false` allows some inserts to succeed if others fail

        res.status(201).json({
            message: `Successfully imported ${results.length} guests`,
            imported: results.length
        });

    } catch (error) {
        if (error.code === 11000) { // Handle duplicate emails
            const inserted = error.result?.nInserted || 0;
            const duplicateCount = error.writeErrors?.length || 0;
            const errorMessages = error.writeErrors?.map(err => err.errmsg || 'Duplicate key error').join('; ');

            res.status(207).json({ // 207 Multi-Status
                message: `Imported ${inserted} guests. ${duplicateCount} guests had duplicate emails and were skipped.`,
                imported: inserted,
                duplicatesSkipped: duplicateCount,
                errors: errorMessages
            });
        } else {
            console.error('Import error:', error);
            res.status(500).json({ error: error.message });
        }
    }
});

// Create event
router.post('/events', async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: error.message });
    }
});

export { router as adminRoutes};