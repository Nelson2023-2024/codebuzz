import { Router } from 'express';
import { Guest } from '../models/Guest.model.js';
import { Event } from '../models/Event.model.js';
import { RSVP } from '../models/RSVP.model.js';
import { adminRoute, protectRoute } from '../middleware/protectRoute.js';

const router = Router();

// RSVP endpoint - Refactored to remove transactions
router.post('/', protectRoute, async (req, res) => {
    try {
        const { token, eventId, status, specialRequests, dietaryRestrictions } = req.body;

        /// Validate input
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return res.status(400).json({ error: 'Invitation token is required' });
        }

        if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        if (!status || typeof status !== 'string') {
            return res.status(400).json({ error: 'RSVP status is required' });
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


// Helper to determine if registration is still open
function isRegistrationOpenFn(event) {
  if (!event.registrationDeadline) return true;
  return new Date() <= event.registrationDeadline;
}
router.get('/all', protectRoute, adminRoute, async (req, res) => {
  try {
    // 1) Fetch all RSVPs, populating Guest & Event sub-documents
    const allRsvps = await RSVP.find()
      .populate({
        path: 'guest',
        select: 'firstName lastName email invitationToken isActive'
      })
      .populate({
        path: 'event',
        select: 'name description eventDate venue maxCapacity currentReservations waitlistCount registrationDeadline isActive'
      })
      .sort({ rsvpDate: -1 });

    // 2) Transform into the “rich” format
    const formattedRsvps = allRsvps.map((rsvpDoc) => {
      // a) If guest or event has been deleted or deactivated, supply defaults
      const guest = rsvpDoc.guest;
      const event = rsvpDoc.event;

      const guestInfo = guest
        ? {
            id: guest._id,
            firstName: guest.firstName || 'Unknown',
            lastName: guest.lastName || 'Guest',
            email: guest.email || 'N/A',
            invitationToken: guest.invitationToken || 'N/A',
            isActive: guest.isActive
          }
        : {
            id: null,
            firstName: 'Deleted',
            lastName: 'Guest',
            email: 'N/A',
            invitationToken: 'N/A',
            isActive: false
          };

      let eventInfo = {
        id: null,
        name: 'Deleted Event',
        description: '',
        eventDate: null,
        venue: 'N/A',
        currentReservations: 0,
        maxCapacity: 0,
        spotsRemaining: 0,
        waitlistCount: 0,
        registrationDeadline: null,
        isRegistrationOpen: false,
        isFull: false,
        isActive: false
      };

      if (event) {
        const spotsRemaining = Math.max(
          0,
          event.maxCapacity - event.currentReservations
        );
        const isOpen = isRegistrationOpenFn(event);

        eventInfo = {
          id: event._id,
          name: event.name || 'Unknown Event',
          description: event.description || '',
          eventDate: event.eventDate,
          venue: event.venue || 'N/A',
          currentReservations: event.currentReservations || 0,
          maxCapacity: event.maxCapacity || 0,
          spotsRemaining,
          waitlistCount: event.waitlistCount || 0,
          registrationDeadline: event.registrationDeadline || null,
          isRegistrationOpen: isOpen,
          isFull: spotsRemaining === 0,
          isActive: event.isActive
        };
      }

      // b) Build the RSVP-specific fields exactly as the single-guest endpoint did
      const existingResponse = {
        status: rsvpDoc.status,
        seatNumber: rsvpDoc.seatNumber || null,
        specialRequests: rsvpDoc.specialRequests || '',
        dietaryRestrictions: rsvpDoc.dietaryRestrictions || '',
        rsvpDate: rsvpDoc.rsvpDate,
        checkInStatus: rsvpDoc.checkInStatus || 'not_arrived'
      };

      return {
        id: rsvpDoc._id,
        status: rsvpDoc.status,
        seatNumber: rsvpDoc.seatNumber,
        specialRequests: rsvpDoc.specialRequests,
        dietaryRestrictions: rsvpDoc.dietaryRestrictions,
        rsvpDate: rsvpDoc.rsvpDate,
        checkInStatus: rsvpDoc.checkInStatus || 'not_arrived',

        // Always true in this “/all” context—these are all existing RSVPs:
        hasResponded: true,
        existingResponse,

        guest: guestInfo,
        event: eventInfo
      };
    });

    return res.json({
      count: formattedRsvps.length,
      rsvps: formattedRsvps
    });
  } catch (error) {
    console.error('Admin GET /all RSVPs error:', error);
    return res.status(500).json({
      error: 'Failed to fetch RSVP data',
      details: error.message
    });
  }
});

// Get RSVP data for logged-in user
router.get('/', protectRoute, async (req, res) => {
    try {
        const guest = req.user;

        // Get the most recent active event
        const event = await Event.findOne({ isActive: true }).sort({ eventDate: 1 });
        if (!event) {
            return res.status(404).json({ error: 'No active events found' });
        }

        // Check if already responded
        const existingRSVP = await RSVP.findOne({ guest: guest._id, event: event._id });

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

// Delete RSVP endpoint - Refactored to remove transactions
router.delete('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { eventId } = req.body;

        // Validate input
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' });
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

        // Check if deletion is allowed (before deadline)
        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            return res.status(400).json({ error: 'Registration deadline has passed. Deletion not allowed.' });
        }

        // Find existing RSVP
        const existingRSVP = await RSVP.findOne({ guest: guest._id, event: eventId });
        if (!existingRSVP) {
            return res.status(404).json({ error: 'No RSVP found to delete' });
        }

        const rsvpStatus = existingRSVP.status;

        // Adjust event counts based on the RSVP status being deleted (atomic operations)
        const eventUpdates = {};

        if (rsvpStatus === 'confirmed') {
            eventUpdates.$inc = { currentReservations: -1 };
        } else if (rsvpStatus === 'waitlisted') {
            eventUpdates.$inc = { waitlistCount: -1 };
        } else if (rsvpStatus === 'declined') {
            eventUpdates.$inc = { totalDeclined: -1 };
        }

        // Update event counts if any changes are needed
        if (Object.keys(eventUpdates).length > 0) {
            await Event.findByIdAndUpdate(eventId, eventUpdates);
        }

        // Delete the RSVP record
        await RSVP.findByIdAndDelete(existingRSVP._id);

        // Update guest stats
        await Guest.findByIdAndUpdate(guest._id, {
            $inc: { totalRsvps: -1 }
        });

        // If a confirmed spot was freed up and there's a waitlist, promote someone
        if (rsvpStatus === 'confirmed') {
            const updatedEvent = await Event.findById(eventId); // Get fresh event state
            if (updatedEvent && updatedEvent.waitlistCount > 0) {
                // Find the oldest waitlisted RSVP for this event
                const waitlistedRSVP = await RSVP.findOne(
                    { event: eventId, status: 'waitlisted' },
                    null,
                    { sort: { rsvpDate: 1 } } // Sort by oldest RSVP date
                );

                if (waitlistedRSVP) {
                    // Promote from waitlist to confirmed
                    const seatNumber = await getNextAvailableSeat(eventId, updatedEvent);

                    await RSVP.findByIdAndUpdate(waitlistedRSVP._id, {
                        status: 'confirmed',
                        seatNumber: seatNumber,
                        promotedDate: new Date()
                    });

                    await Event.findByIdAndUpdate(eventId, {
                        $inc: {
                            currentReservations: 1, // Increment confirmed count
                            waitlistCount: -1      // Decrement waitlist count
                        }
                    });

                    // Note: In a real application, you'd want to send a notification
                    // to the promoted guest here (e.g., via email or webhook)
                }
            }
        }

        res.json({
            status: 'success',
            message: 'RSVP deleted successfully',
            deletedRSVP: {
                status: rsvpStatus,
                seatNumber: existingRSVP.seatNumber,
                eventName: event.name,
                eventDate: event.eventDate
            }
        });

    } catch (error) {
        console.error('Delete RSVP error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'Invalid event ID format'
            });
        }

        res.status(500).json({
            error: error.message || 'Failed to delete RSVP',
            requestId: req.id
        });
    }
});
export { router as rsvpRoutes };