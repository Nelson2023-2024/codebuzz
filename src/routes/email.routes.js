import { Router } from 'express';
import { sendBulkInvitations, sendSingleEmail, sendReminderEmails } from '../queues/email.queue.js';

const router = Router();

// Bulk email sending endpoint
router.post('/send-bulk-invitations', async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const result = await sendBulkInvitations(eventId);
        res.json(result);
    } catch (error) {
        console.error('Bulk invitation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send individual email
router.post('/send-email', async (req, res) => {
    try {
        const { guestId, eventId, emailType = 'invitation' } = req.body;

        // Basic validation for required fields
        if (!guestId || !eventId) {
            return res.status(400).json({ error: 'guestId and eventId are required.' });
        }

        await sendSingleEmail(guestId, eventId, emailType);
        res.json({ status: 'Email queued successfully' });
    } catch (error) {
        console.error('Single email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send reminder emails
router.post('/send-reminders/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const result = await sendReminderEmails(eventId);
        res.json(result);
    } catch (error) {
        console.error('Reminder emails error:', error);
        res.status(500).json({ error: error.message });
    }
});

export { router as emailRoutes };