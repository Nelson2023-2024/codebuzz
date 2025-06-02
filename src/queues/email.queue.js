// Updated sendSingleEmail function in queues/email.queue.js
import Bull from 'bull';
import emailProcess from '../processes/email.process.js';
import { setQueues, BullAdapter } from 'bull-board';

// Correct static imports for models
import { Guest } from '../models/Guest.model.js';
import { Event } from '../models/Event.model.js';
import { RSVP } from '../models/RSVP.model.js';

const emailQueue = new Bull('email', {
    redis: {
        host: process.env.REDIS_HOST || 'tutorial_redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    },
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        }
    }
});

// Configure different processors for different email types
emailQueue.process('bulk-invitation', 10, emailProcess.processBulkInvitation);
emailQueue.process('single-email', 5, emailProcess.processSingleEmail);
emailQueue.process('reminder-email', 8, emailProcess.processReminderEmail);

setQueues([new BullAdapter(emailQueue)]);

// Enhanced bulk email sender (unchanged)
const sendBulkInvitations = async (eventId, batchSize = 100) => {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    // Get all active guests in batches
    const totalGuests = await Guest.countDocuments({ isActive: true });
    const totalBatches = Math.ceil(totalGuests / batchSize);

    console.log(`Starting bulk invitation for ${totalGuests} guests in ${totalBatches} batches`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const skip = batchIndex * batchSize;
        const guests = await Guest.find({ isActive: true })
            .select('_id email firstName lastName invitationToken')
            .skip(skip)
            .limit(batchSize)
            .lean();

        if (guests.length > 0) {
            await emailQueue.add('bulk-invitation', {
                guests,
                event: {
                    id: event._id,
                    name: event.name,
                    description: event.description,
                    eventDate: event.eventDate,
                    venue: event.venue
                },
                batchNumber: batchIndex + 1,
                totalBatches
            }, {
                delay: batchIndex * 500,
                priority: 10 - Math.floor(batchIndex / 100)
            });
        }
    }

    return {
        totalGuests,
        totalBatches,
        message: 'Bulk invitation process started'
    };
};

// UPDATED: Send single email - now accepts email instead of guestId
const sendSingleEmail = async (email, eventId, emailType = 'invitation') => {
    // Find the guest by email first
    const guest = await Guest.findOne({ email: email.toLowerCase(), isActive: true });
    
    if (!guest) {
        throw new Error(`Guest with email ${email} not found or inactive`);
    }

    // Verify the event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    await emailQueue.add('single-email', {
        guestId: guest._id, // Still pass guestId to the processor
        email: guest.email, // Also pass email for reference
        eventId,
        emailType
    });

    return {
        message: 'Email queued successfully',
        guestEmail: guest.email,
        guestId: guest._id
    };
};

// Send reminder emails to non-responders (unchanged)
const sendReminderEmails = async (eventId) => {
    // Find guests who haven't responded
    const respondedGuestIds = await RSVP.find({ event: eventId })
        .distinct('guest');

    const nonResponders = await Guest.find({
        _id: { $nin: respondedGuestIds },
        isActive: true
    }).select('_id').lean();

    for (const guest of nonResponders) {
        await emailQueue.add('reminder-email', {
            guestId: guest._id,
            eventId
        });
    }

    return { remindersSent: nonResponders.length };
};

export {
    emailQueue,
    sendBulkInvitations,
    sendSingleEmail,
    sendReminderEmails
};