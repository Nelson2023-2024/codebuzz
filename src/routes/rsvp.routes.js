import { Router } from 'express';
import { Guest } from '../models/Guest.model.js';
import { Event } from '../models/Event.model.js';
import { RSVP } from '../models/RSVP.model.js';

const router = Router();

// RSVP endpoint - Refactored to remove transactions
router.post('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { eventId, status, specialRequests, dietaryRestrictions } = req.body;

        // Validate input
        if (!eventId || !status) {
            return res.status(400).json({ error: 'Event ID and status are required' });
        }

        if (!['confirmed', 'declined', 'waitlisted'].includes(status)) {
            return res.status(400).json({ error: 'Invalid RSVP status' });
        }

        // Find guest by invitation token
        const guest = await Guest.findOne({ invitationToken: token, isActive: true });
        if (!guest) {
            return res.status(404).json({ error: 'Invalid invitation token' });
        }

        // Find event
        const event = await Event.findById(eventId);
        if (!event || !event.isActive) {
            return res.status(404).json({ error: 'Event not found or inactive' });
        }

        // Check registration deadline
        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Check if already responded
        let existingRsvp = await RSVP.findOne({ guest: guest._id, event: eventId });
        if (existingRsvp) {
            return res.status(400).json({
                error: 'You have already responded to this invitation',
                existingResponse: {
                    status: existingRsvp.status,
                    seatNumber: existingRsvp.seatNumber,
                    rsvpDate: existingRsvp.rsvpDate
                }
            });
        }

        let finalStatus = status;
        let assignedSeatNumber = null;
        let responseMessage = '';

        // Handle different RSVP statuses without explicit transactions
        if (status === 'confirmed') {
            // Re-fetch event to get the most up-to-date capacity before checking
            const currentEvent = await Event.findById(eventId); // No session needed
            
            if (currentEvent.currentReservations >= currentEvent.maxCapacity) {
                // Event is full, add to waitlist
                finalStatus = 'waitlisted';
                await Event.findByIdAndUpdate(
                    eventId,
                    { $inc: { waitlistCount: 1 } } // Atomic increment
                );
                responseMessage = 'Event is at capacity. You have been added to the waitlist.';
            } else {
                // Reserve a spot and assign seat number
                const updatedEvent = await Event.findByIdAndUpdate(
                    eventId,
                    { $inc: { currentReservations: 1 } }, // Atomic increment
                    { new: true } // Return the updated document
                );
                
                // Assign seat number
                assignedSeatNumber = await getNextAvailableSeat(eventId, updatedEvent); // No session needed
                responseMessage = `Your RSVP has been confirmed! Your seat number is ${assignedSeatNumber}.`;
            }
            
        } else if (status === 'waitlisted') {
            // Direct waitlist request
            await Event.findByIdAndUpdate(eventId, {
                $inc: { waitlistCount: 1 } // Atomic increment
            });
            responseMessage = 'You have been added to the waitlist.';
            
        } else if (status === 'declined') {
            await Event.findByIdAndUpdate(eventId, {
                $inc: { totalDeclined: 1 } // Atomic increment
            });
            responseMessage = 'Your RSVP has been recorded as declined.';
        }

        // Create RSVP record
        const rsvpData = {
            guest: guest._id,
            event: eventId,
            status: finalStatus,
            specialRequests: specialRequests || '',
            dietaryRestrictions: dietaryRestrictions || ''
        };

        // Add seat number only for confirmed reservations
        if (finalStatus === 'confirmed' && assignedSeatNumber) {
            rsvpData.seatNumber = assignedSeatNumber;
        }

        const rsvp = new RSVP(rsvpData);
        await rsvp.save();

        // Update guest stats
        await Guest.findByIdAndUpdate(guest._id, {
            lastRsvpDate: new Date(),
            $inc: { totalRsvps: 1 }
        });

        res.json({
            status: 'success',
            rsvpStatus: finalStatus,
            seatNumber: assignedSeatNumber,
            message: responseMessage,
            rsvpDetails: {
                eventName: event.name,
                eventDate: event.eventDate,
                venue: event.venue,
                specialRequests: rsvpData.specialRequests,
                dietaryRestrictions: rsvpData.dietaryRestrictions
            }
        });

    } catch (error) {
        console.error('RSVP error:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'Duplicate RSVP detected. You may have already responded to this invitation.' 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Invalid data provided', 
                details: error.message 
            });
        }
        
        res.status(500).json({ 
            error: error.message || 'Internal server error during RSVP processing.',
            requestId: req.id // If you have request ID middleware
        });
    }
});

// Get RSVP page data - Enhanced version
router.get('/rsvp/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const guest = await Guest.findOne({ invitationToken: token, isActive: true });
        if (!guest) {
            return res.status(404).json({ error: 'Invalid invitation token' });
        }

        // Get the most recent active event
        const event = await Event.findOne({ isActive: true }).sort({ eventDate: 1 });
        if (!event) {
            return res.status(404).json({ error: 'No active events found' });
        }

        // Check if already responded
        const existingRSVP = await RSVP.findOne({ guest: guest._id, event: event._id });

        // Calculate availability
        const spotsRemaining = Math.max(0, event.maxCapacity - event.currentReservations);
        const isRegistrationOpen = !event.registrationDeadline || new Date() <= event.registrationDeadline;

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
                spotsRemaining,
                waitlistCount: event.waitlistCount,
                registrationDeadline: event.registrationDeadline,
                isRegistrationOpen,
                isFull: spotsRemaining === 0
            },
            hasResponded: !!existingRSVP,
            existingResponse: existingRSVP ? {
                status: existingRSVP.status,
                seatNumber: existingRSVP.seatNumber,
                specialRequests: existingRSVP.specialRequests,
                dietaryRestrictions: existingRSVP.dietaryRestrictions,
                rsvpDate: existingRSVP.rsvpDate,
                checkInStatus: existingRSVP.checkInStatus
            } : null
        });

    } catch (error) {
        console.error('Get RSVP data error:', error);
        res.status(500).json({ 
            error: 'Unable to fetch RSVP information',
            requestId: req.id
        });
    }
});

// Update RSVP endpoint (for changing responses before deadline)
router.put('/rsvp/:token', async (req, res) => {
    let session = null;
    
    try {
        const { token } = req.params;
        const { eventId, status, specialRequests, dietaryRestrictions } = req.body;

        const guest = await Guest.findOne({ invitationToken: token, isActive: true });
        if (!guest) {
            return res.status(404).json({ error: 'Invalid invitation token' });
        }

        const event = await Event.findById(eventId);
        if (!event || !event.isActive) {
            return res.status(404).json({ error: 'Event not found or inactive' });
        }

        // Check if updates are allowed (before deadline)
        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            return res.status(400).json({ error: 'Registration deadline has passed. Updates not allowed.' });
        }

        const existingRSVP = await RSVP.findOne({ guest: guest._id, event: eventId });
        if (!existingRSVP) {
            return res.status(404).json({ error: 'No existing RSVP found to update' });
        }

        // Handle status changes that affect capacity
        const oldStatus = existingRSVP.status;
        const newStatus = status;

        if (oldStatus !== newStatus) {
            session = await RSVP.startSession();
            
            try {
                await session.withTransaction(async () => {
                    // Adjust event counts based on status change
                    const eventUpdates = {};
                    
                    if (oldStatus === 'confirmed' && newStatus !== 'confirmed') {
                        eventUpdates.$inc = { currentReservations: -1 };
                    } else if (oldStatus !== 'confirmed' && newStatus === 'confirmed') {
                        const currentEvent = await Event.findById(eventId).session(session);
                        if (currentEvent.currentReservations >= currentEvent.maxCapacity) {
                            throw new Error('Event is now at capacity. Cannot confirm reservation.');
                        }
                        eventUpdates.$inc = { currentReservations: 1 };
                    }
                    
                    if (oldStatus === 'waitlisted' && newStatus !== 'waitlisted') {
                        eventUpdates.$inc = { ...eventUpdates.$inc, waitlistCount: -1 };
                    } else if (oldStatus !== 'waitlisted' && newStatus === 'waitlisted') {
                        eventUpdates.$inc = { ...eventUpdates.$inc, waitlistCount: 1 };
                    }

                    if (Object.keys(eventUpdates).length > 0) {
                        await Event.findByIdAndUpdate(eventId, eventUpdates, { session });
                    }

                    // Update RSVP
                    const rsvpUpdates = {
                        status: newStatus,
                        specialRequests: specialRequests || existingRSVP.specialRequests,
                        dietaryRestrictions: dietaryRestrictions || existingRSVP.dietaryRestrictions
                    };

                    // Handle seat number assignment/removal
                    if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
                        const updatedEvent = await Event.findById(eventId).session(session);
                        rsvpUpdates.seatNumber = await getNextAvailableSeat(eventId, updatedEvent, session);
                    } else if (newStatus !== 'confirmed' && oldStatus === 'confirmed') {
                        rsvpUpdates.$unset = { seatNumber: 1 };
                    }

                    await RSVP.findByIdAndUpdate(existingRSVP._id, rsvpUpdates, { session });
                });
            } catch (transactionError) {
                console.error('Update transaction failed:', transactionError);
                throw transactionError;
            } finally {
                await session.endSession();
                session = null;
            }
        } else {
            // Just update the requests without status change
            await RSVP.findByIdAndUpdate(existingRSVP._id, {
                specialRequests: specialRequests || existingRSVP.specialRequests,
                dietaryRestrictions: dietaryRestrictions || existingRSVP.dietaryRestrictions
            });
        }

        const updatedRSVP = await RSVP.findById(existingRSVP._id);

        res.json({
            status: 'success',
            message: 'RSVP updated successfully',
            rsvpDetails: {
                status: updatedRSVP.status,
                seatNumber: updatedRSVP.seatNumber,
                specialRequests: updatedRSVP.specialRequests,
                dietaryRestrictions: updatedRSVP.dietaryRestrictions
            }
        });

    } catch (error) {
        console.error('Update RSVP error:', error);
        
        // Ensure session is ended if still active
        if (session) {
            try {
                await session.endSession();
            } catch (sessionError) {
                console.error('Error ending session:', sessionError);
            }
        }
        
        res.status(500).json({ 
            error: error.message || 'Failed to update RSVP',
            requestId: req.id
        });
    }
});

// Helper function to get next available seat
async function getNextAvailableSeat(eventId, event, session = null) {
    const options = session ? { session } : {};
    
    try {
        if (event.seatLayout === 'sequential') {
            // Sequential seat assignment
            return event.currentReservations;
        } else if (event.seatLayout === 'random') {
            // Random seat assignment from available seats
            const occupiedSeats = await RSVP.find(
                { event: eventId, status: 'confirmed', seatNumber: { $exists: true } },
                { seatNumber: 1 },
                options
            ).lean();
            
            const occupiedNumbers = new Set(occupiedSeats.map(r => r.seatNumber));
            const reservedNumbers = event.reservedSeats 
                ? new Set(event.reservedSeats.filter(s => !s.isAvailable).map(s => s.seatNumber))
                : new Set();
            
            let availableSeats = [];
            for (let i = 1; i <= event.maxCapacity; i++) {
                if (!occupiedNumbers.has(i) && !reservedNumbers.has(i)) {
                    availableSeats.push(i);
                }
            }
            
            return availableSeats.length > 0 
                ? availableSeats[Math.floor(Math.random() * availableSeats.length)] 
                : event.currentReservations;
        }
        
        // Default to sequential
        return event.currentReservations;
    } catch (error) {
        console.error('Error getting next available seat:', error);
        // Fallback to current reservations count
        return event.currentReservations || 1;
    }
}

export { router as rsvpRoutes };