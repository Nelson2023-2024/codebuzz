// queues/email.queue.js
import Bull from 'bull';
import emailProcess from '../processes/email.process.js';
import { setQueues, BullAdapter } from 'bull-board';

// Correct static imports for models
import { Guest } from '../models/Guest.model.js'; // This is the correct path you provided
import { Event } from '../models/Event.model.js'; // Assuming Event model is also in .model.js
import { RSVP } from '../models/RSVP.model.js'; // Assuming RSVP model is also in .model.js


const emailQueue = new Bull('email', {
    redis: {
        host: process.env.REDIS_HOST || 'tutorial_redis',
        port: parseInt(process.env.REDIS_PORT || '6379'), // Parse port to integer
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

// Enhanced bulk email sender
const sendBulkInvitations = async (eventId, batchSize = 100) => {
    // REMOVED dynamic imports here - now using the static imports from the top
    // const Guest = (await import('../models/Guest.js')).default;
    // const Event = (await import('../models/Event.js')).default;

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
                delay: batchIndex * 500, // Stagger batches by 500ms
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

// Send single email
const sendSingleEmail = async (guestId, eventId, emailType = 'invitation') => {
    await emailQueue.add('single-email', {
        guestId,
        eventId,
        emailType
    });
};

// Send reminder emails to non-responders
const sendReminderEmails = async (eventId) => {
    // REMOVED dynamic imports here - now using the static imports from the top
    // const Guest = (await import('../models/Guest.js')).default;
    // const RSVP = (await import('../models/RSVP.js')).default;

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