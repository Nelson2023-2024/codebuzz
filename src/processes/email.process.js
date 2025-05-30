import nodemailer from 'nodemailer';
import {Guest} from '../models/Guest.model.js';
import { Event } from '../models/Event.model.js'; // Assuming Event model is also in .model.js
import {EmailLog} from '../models/EmailLog.model.js';

// Create multiple transporters for better throughput
const createTransporter = async () => {
    if (process.env.NODE_ENV === 'production') {
        // Production email service
        return nodemailer.createTransporter({
            service: 'SendGrid', // or your preferred service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Development - Ethereal Email
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
};

// Generate invitation email HTML
const generateInvitationHTML = (guest, event) => {
    const rsvpUrl = `${process.env.FRONTEND_URL}/rsvp/${guest.invitationToken}`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { 
                display: inline-block; 
                background: #007bff; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>You're Invited!</h1>
        </div>
        <div class="content">
            <p>Dear ${guest.firstName} ${guest.lastName},</p>
            
            <p>We're excited to invite you to <strong>${event.name}</strong>!</p>
            
            <p><strong>Event Details:</strong></p>
            <ul>
                <li><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</li>
                ${event.venue ? `<li><strong>Venue:</strong> ${event.venue}</li>` : ''}
            </ul>
            
            ${event.description ? `<p>${event.description}</p>` : ''}
            
            <p>Please confirm your attendance by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${rsvpUrl}" class="button">RSVP Now</a>
            </div>
            
            <p><small>This invitation is personal to you. Please do not forward this email.</small></p>
        </div>
        <div class="footer">
            <p>If you have any questions, please contact our event team.</p>
            <p>RSVP Link: <a href="${rsvpUrl}">${rsvpUrl}</a></p>
        </div>
    </body>
    </html>
    `;
};

// Process bulk invitations
const processBulkInvitation = async (job) => {
    const { guests, event, batchNumber, totalBatches } = job.data;
    const transporter = await createTransporter();
    
    console.log(`Processing batch ${batchNumber}/${totalBatches} with ${guests.length} guests`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const guest of guests) {
        try {
            // Create email log entry
            const emailLog = new EmailLog({
                guest: guest._id,
                event: event.id,
                emailType: 'invitation',
                status: 'pending'
            });
            await emailLog.save();
            
            const mailOptions = {
                from: process.env.FROM_EMAIL || 'noreply@yourevents.com',
                to: guest.email,
                subject: `You're Invited: ${event.name}`,
                html: generateInvitationHTML(guest, event)
            };
            
            const info = await transporter.sendMail(mailOptions);
            
            // Update email log
            emailLog.status = 'sent';
            emailLog.sentAt = new Date();
            emailLog.messageId = info.messageId;
            await emailLog.save();
            
            successCount++;
            results.push({ 
                email: guest.email, 
                status: 'sent', 
                messageId: info.messageId 
            });
            
        } catch (error) {
            failCount++;
            console.error(`Failed to send email to ${guest.email}:`, error.message);
            
            // Update email log with error
            await EmailLog.findOneAndUpdate(
                { guest: guest._id, event: event.id, emailType: 'invitation' },
                { 
                    status: 'failed', 
                    errorMessage: error.message,
                    $inc: { attemptCount: 1 }
                }
            );
            
            results.push({ 
                email: guest.email, 
                status: 'failed', 
                error: error.message 
            });
        }
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Batch ${batchNumber} completed: ${successCount} sent, ${failCount} failed`);
    
    return {
        batchNumber,
        totalProcessed: guests.length,
        successCount,
        failCount,
        results
    };
};

// Process single email
const processSingleEmail = async (job) => {
    const { guestId, eventId, emailType } = job.data;
    const transporter = await createTransporter();
    
    const guest = await Guest.findById(guestId);
    const event = await Event.findById(eventId);
    
    if (!guest || !event) {
        throw new Error('Guest or Event not found');
    }
    
    const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@yourevents.com',
        to: guest.email,
        subject: `${emailType === 'reminder' ? 'Reminder: ' : ''}${event.name}`,
        html: generateInvitationHTML(guest, event)
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log the email
    const emailLog = new EmailLog({
        guest: guestId,
        event: eventId,
        emailType,
        status: 'sent',
        sentAt: new Date(),
        messageId: info.messageId
    });
    await emailLog.save();
    
    return info;
};

// Process reminder emails
const processReminderEmail = async (job) => {
    return processSingleEmail({
        data: { ...job.data, emailType: 'reminder' }
    });
};

export default {
    processBulkInvitation,
    processSingleEmail,
    processReminderEmail
};