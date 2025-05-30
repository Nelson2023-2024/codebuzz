import { Router } from 'express';
import { Guest } from '../models/Guest.model.js';
import { Event } from '../models/Event.model.js';
import { RSVP } from '../models/RSVP.model.js';

const router = Router();

// RSVP endpoint
router.post('/rsvp/:token', async (req, res) => {
    // You should ensure this endpoint is not behind the /api/limiter if it needs to handle high traffic from unique links
    // Or, implement a different, more relaxed rate limit for RSVP to avoid blocking legitimate guests.
    try {
        const { token } = req.params;
        const { eventId, status, specialRequests, dietaryRestrictions } = req.body;

        // Find guest by invitation token
        const guest = await Guest.findOne({ invitationToken: token });
        if (!guest) {
            return res.status(404).json({ error: 'Invalid invitation token' });
        }

        // Find event
        const event = await Event.findById(eventId);
        if (!event || !event.isActive) {
            return res.status(404).json({ error: 'Event not found or inactive' });
        }

        // Check if already responded
        let rsvp = await RSVP.findOne({ guest: guest._id, event: eventId });

        if (rsvp) {
            return res.status(400).json({ error: 'You have already responded to this invitation' });
        }

        // Handle capacity limits
        let finalStatus = status;
        if (status === 'confirmed') {
            if (event.currentReservations >= event.maxCapacity) {
                finalStatus = 'waitlisted';
                // Increment waitlist count if moved to waitlist from 'confirmed' attempt
                await Event.findByIdAndUpdate(eventId, {
                    $inc: { waitlistCount: 1 }
                });
            } else {
                // Increment reservation count atomically and get the new count for seat number
                const updatedEvent = await Event.findByIdAndUpdate(
                    eventId,
                    { $inc: { currentReservations: 1 } },
                    { new: true } // Return the updated document
                );
                // Assign seat number if the schema supports it.
                // Assuming `seatNumber` is a field in RSVP schema and you want sequential.
                // NOTE: This assumes updatedEvent.currentReservations is the *next* available seat.
                // If you want seat numbers to start from 1, and be contiguous, you'd use the NEW value of currentReservations.
                // If the event is full, the guest goes to waitlist and does not get a seat number.
                const assignedSeatNumber = updatedEvent.currentReservations; // This is the next available seat
                req.body.seatNumber = assignedSeatNumber; // Pass to new RSVP
            }
        } else if (status === 'waitlisted') { // If they directly choose waitlisted
            await Event.findByIdAndUpdate(eventId, {
                $inc: { waitlistCount: 1 }
            });
        }


        // Create RSVP
        rsvp = new RSVP({
            guest: guest._id,
            event: eventId,
            status: finalStatus,
            specialRequests,
            dietaryRestrictions,
            seatNumber: req.body.seatNumber // Pass the assigned seat number (will be undefined if not confirmed)
        });

        await rsvp.save();

        res.json({
            status: 'success',
            rsvpStatus: finalStatus,
            message: finalStatus === 'waitlisted'
                ? 'You have been added to the waitlist'
                : 'Your RSVP has been confirmed' + (req.body.seatNumber ? ` Your seat number is ${req.body.seatNumber}.` : '')
        });

    } catch (error) {
        console.error('RSVP error:', error);
        // Log the specific error if possible to aid debugging
        if (error.code === 11000) { // MongoDB duplicate key error
            return res.status(400).json({ error: 'Duplicate entry detected (e.g., guest already RSVP\'d for this event).' });
        }
        res.status(500).json({ error: error.message || 'Internal server error during RSVP.' });
    }
});

// Get RSVP page data
router.get('/rsvp/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const guest = await Guest.findOne({ invitationToken: token });
        if (!guest) {
            return res.status(404).json({ error: 'Invalid invitation token' });
        }

        // Get the most recent active event (you might want to modify this logic if multiple events exist)
        const event = await Event.findOne({ isActive: true }).sort({ eventDate: 1 });
        if (!event) {
            return res.status(404).json({ error: 'No active events found' });
        }

        // Check if already responded
        const existingRSVP = await RSVP.findOne({ guest: guest._id, event: event._id });

        res.json({
            guest: {
                firstName: guest.firstName,
                lastName: guest.lastName,
                email: guest.email
            },
            event: {
                id: event._id,
                name: event.name,
                description: event.description,
                eventDate: event.eventDate,
                venue: event.venue,
                currentReservations: event.currentReservations,
                maxCapacity: event.maxCapacity,
                spotsRemaining: event.maxCapacity - event.currentReservations,
                // Add registrationDeadline if relevant for display
                registrationDeadline: event.registrationDeadline
            },
            hasResponded: !!existingRSVP,
            existingResponse: existingRSVP ? {
                status: existingRSVP.status,
                seatNumber: existingRSVP.seatNumber, // Include seat number here
                specialRequests: existingRSVP.specialRequests,
                dietaryRestrictions: existingRSVP.dietaryRestrictions
            } : null
        });

    } catch (error) {
        console.error('Get RSVP data error:', error);
        res.status(500).json({ error: error.message });
    }
});

export { router as rsvpRoutes};