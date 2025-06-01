import { Router } from 'express';
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation
import { Event } from '../models/Event.model.js';
import { RSVP } from '../models/RSVP.model.js';
import { EmailLog } from '../models/EmailLog.model.js';
import { Guest } from '../models/Guest.model.js';
import { adminRoute, protectRoute } from '../middleware/protectRoute.js';


const router = Router();


router.use(protectRoute)

router.get('/events', async (req, res) => {
  try {
    // 1) Find all events (you can filter by isActive:true if you only want currently active ones)
    const events = await Event.find({}); 

    // 2) Map into the enriched structure, computing spotsRemaining/isFull for each
    const formatted = events.map(ev => {
      // Ensure numeric defaults if fields are missing
      const maxCap = ev.maxCapacity || 0;
      const current = ev.currentReservations || 0;
      const spotsRemaining = Math.max(0, maxCap - current);
      const isOpen = !ev.registrationDeadline || new Date() <= ev.registrationDeadline;
      
      return {
        id: ev._id,
        name: ev.name,
        description: ev.description,
        eventDate: ev.eventDate,
        venue: ev.venue,
        maxCapacity: maxCap,
        currentReservations: current,
        spotsRemaining,
        waitlistCount: ev.waitlistCount || 0,
        registrationDeadline: ev.registrationDeadline || null,
        isRegistrationOpen: isOpen,
        isFull: spotsRemaining === 0,
        isActive: ev.isActive
      };
    });

    return res.json({
      count: formatted.length,
      events: formatted
    });
  } catch (err) {
    console.error('Public GET /events error:', err);
    return res.status(500).json({
      error: 'Failed to fetch events',
      details: err.message
    });
  }
});


router.use(adminRoute)
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

router.post('/events', async (req, res) => {
    try {
        // Destructure all expected fields from req.body
        const {
            name,
            description,
            eventDate,
            venue,
            maxCapacity,
            isActive,
            registrationDeadline
        } = req.body;

        // --- Input Validation ---
        // Check for required fields
        if (!name || !description || !eventDate || !venue) {
            return res.status(400).json({ error: 'Missing required event fields: name, description, eventDate, and venue are mandatory.' });
        }

        // Validate eventDate format and if it's in the future
        const parsedEventDate = new Date(eventDate);
        if (isNaN(parsedEventDate.getTime()) || parsedEventDate < new Date()) {
            return res.status(400).json({ error: 'Invalid or past eventDate. Please provide a valid future date/time.' });
        }

        // Validate maxCapacity if provided
        if (maxCapacity !== undefined && (typeof maxCapacity !== 'number' || maxCapacity <= 0)) {
            return res.status(400).json({ error: 'maxCapacity must be a positive number.' });
        }

        // Validate registrationDeadline if provided and ensure it's before eventDate
        if (registrationDeadline !== undefined) {
            const parsedRegistrationDeadline = new Date(registrationDeadline);
            if (isNaN(parsedRegistrationDeadline.getTime())) {
                return res.status(400).json({ error: 'Invalid registrationDeadline format.' });
            }
            if (parsedRegistrationDeadline >= parsedEventDate) {
                return res.status(400).json({ error: 'Registration deadline must be before the event date.' });
            }
        }

        // Create new Event instance
        const event = new Event({
            name,
            description,
            eventDate: parsedEventDate, // Use parsed date
            venue,
            maxCapacity: maxCapacity || 500, // Use provided capacity or default
            isActive: isActive !== undefined ? isActive : true, // Use provided status or default
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined // Use parsed date or undefined
        });

        await event.save();

        res.status(201).json({
            message: 'Event created successfully!',
            event: event.toObject() // Return the saved event object
        });

    } catch (error) {
        console.error('Create event error:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.keys(error.errors).map(key => error.errors[key].message);
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        res.status(500).json({ error: error.message || 'Internal server error while creating event.' });
    }
});

// Delete an event
router.delete('/events/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;

        // Validate eventId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: 'Invalid Event ID format' });
        }

        // Find the event and delete it
        const result = await Event.findByIdAndDelete(eventId);

        if (!result) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Optionally, also delete associated RSVPs and EmailLogs for this event
        await RSVP.deleteMany({ event: eventId });
        await EmailLog.deleteMany({ event: eventId });

        res.status(200).json({ message: 'Event and associated data deleted successfully!' });

    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: error.message || 'Internal server error while deleting event.' });
    }
});

export { router as adminRoutes};