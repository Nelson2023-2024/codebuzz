import { Router } from 'express';
import { sendBulkInvitations, sendSingleEmail, sendReminderEmails } from '../queues/email.queue.js';
import { protectRoute, adminRoute } from '../middleware/protectRoute.js';
import { EmailLog } from "../models/EmailLog.model.js";

const router = Router();

router.use(protectRoute);

// Bulk email sending endpoint
router.post('/send-bulk-invitations/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;

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

// Send individual email - NOW USES EMAIL INSTEAD OF GUEST ID
router.post('/send-email', async (req, res) => {
    try {
        const { email, eventId, emailType = 'invitation' } = req.body;

        // Basic validation for required fields
        if (!email || !eventId) {
            return res.status(400).json({ error: 'email and eventId are required.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        await sendSingleEmail(email, eventId, emailType);
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

// Get email logs for the authenticated user (their own logs only)
router.get('/logs/my-emails', async (req, res) => {
    try {
        const { page = 1, limit = 10, emailType, status } = req.query;
        const userId = req.user._id;

        // Build filter object
        const filter = { guest: userId };
        
        if (emailType) {
            filter.emailType = emailType;
        }
        
        if (status) {
            filter.status = status;
        }

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count for pagination info
        const totalCount = await EmailLog.countDocuments(filter);

        // Fetch email logs with pagination
        const emailLogs = await EmailLog.find(filter)
            .populate('event', 'title eventDate location')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: emailLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                hasNext: skip + emailLogs.length < totalCount,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching user email logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all email logs (Admin only)
router.get('/logs/all', adminRoute, async (req, res) => {
    try {
        const { page = 1, limit = 20, emailType, status, guestId, eventId } = req.query;

        // Build filter object
        const filter = {};
        
        if (emailType) {
            filter.emailType = emailType;
        }
        
        if (status) {
            filter.status = status;
        }
        
        if (guestId) {
            filter.guest = guestId;
        }
        
        if (eventId) {
            filter.event = eventId;
        }

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count for pagination info
        const totalCount = await EmailLog.countDocuments(filter);

        // Fetch email logs with pagination and populate guest and event details
        const emailLogs = await EmailLog.find(filter)
            .populate('guest', 'firstName lastName email')
            .populate('event', 'title eventDate location')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: emailLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                hasNext: skip + emailLogs.length < totalCount,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all email logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get email log statistics (Admin only)
router.get('/logs/stats', adminRoute, async (req, res) => {
    try {
        const { eventId } = req.query;
        
        // Build match condition
        const matchCondition = eventId ? { event: eventId } : {};
        
        const stats = await EmailLog.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: null,
                    totalEmails: { $sum: 1 },
                    sentEmails: {
                        $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
                    },
                    failedEmails: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    pendingEmails: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    bouncedEmails: {
                        $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] }
                    }
                }
            }
        ]);

        const emailTypeStats = await EmailLog.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: '$emailType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                overall: stats[0] || {
                    totalEmails: 0,
                    sentEmails: 0,
                    failedEmails: 0,
                    pendingEmails: 0,
                    bouncedEmails: 0
                },
                byEmailType: emailTypeStats
            }
        });
    } catch (error) {
        console.error('Error fetching email statistics:', error);
        res.status(500).json({ error: error.message });
    }
});

export { router as emailRoutes };