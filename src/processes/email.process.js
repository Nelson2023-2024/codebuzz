import nodemailer from 'nodemailer';
import {Guest} from '../models/Guest.model.js';
import { Event } from '../models/Event.model.js';
import {EmailLog} from '../models/EmailLog.model.js';

// Create multiple transporters with your Gmail credentials
const createTransporter = async () => {
    if (process.env.NODE_ENV === 'production') {
        // Production - Use Gmail with your working credentials
        return nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER || "nelsonobuya18@gmail.com",
                pass: process.env.GMAIL_APP_PASSWORD || "evyn xgyo rcbo qkna"
            },
            pool: true, // Enable connection pooling for better performance
            maxConnections: 5, // Limit concurrent connections
            maxMessages: 100, // Max messages per connection
            rateDelta: 1000, // Rate limiting: 1 second between batches
            rateLimit: 5 // Max 5 emails per rateDelta
        });
    } else {
        // Development - Still use Gmail for testing
        return nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER || "nelsonobuya18@gmail.com",
                pass: process.env.GMAIL_APP_PASSWORD || "evyn xgyo rcbo qkna"
            }
        });
    }
};

// Generate invitation email HTML with invitation token displayed
const generateInvitationHTML = (guest, event) => {
    const rsvpUrl = `${process.env.FRONTEND_URL}/rsvp`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: 'Arial', sans-serif; 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #f4f4f4;
                padding: 20px;
            }
            .email-container {
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px 20px; 
                text-align: center; 
                color: white;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .content { 
                padding: 30px 20px; 
                line-height: 1.6;
                color: #333;
            }
            .event-details {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
            }
            .invitation-token {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 25px 0;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            .token-code {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                letter-spacing: 2px;
                background: rgba(255, 255, 255, 0.2);
                padding: 10px 15px;
                border-radius: 5px;
                margin: 10px 0;
                word-break: break-all;
            }
            .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 25px; 
                margin: 25px 0;
                font-weight: bold;
                transition: transform 0.2s;
            }
            .button:hover {
                transform: translateY(-2px);
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                font-size: 14px; 
                color: #666; 
                text-align: center;
            }
            .security-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 4px;
                margin: 15px 0;
                font-size: 14px;
            }
            .instructions {
                background-color: #e8f4fd;
                border: 1px solid #bee5eb;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🎉 You're Invited!</h1>
            </div>
            <div class="content">
                <p>Dear <strong>${guest.firstName} ${guest.lastName}</strong>,</p>
                
                <p>We're thrilled to invite you to an exclusive event that promises to be unforgettable!</p>
                
                <div class="event-details">
                    <h3 style="margin-top: 0; color: #667eea;">${event.name}</h3>
                    <p><strong>📅 Date & Time:</strong> ${new Date(event.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                    ${event.venue ? `<p><strong>📍 Venue:</strong> ${event.venue}</p>` : ''}
                    ${event.description ? `<p><strong>ℹ️ About:</strong> ${event.description}</p>` : ''}
                </div>
                
                <div class="invitation-token">
                    <h3 style="margin: 0 0 10px 0;">🎫 Your Invitation Token</h3>
                    <div class="token-code">${guest.invitationToken}</div>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">Use this token to RSVP</p>
                </div>
                
                <div class="instructions">
                    <h4 style="margin-top: 0; color: #0c5460;">📝 How to RSVP:</h4>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Log in to the Event Management System.</li>
                        <li>Click on **"Events"** in the sidebar navigation.</li>
                        <li>Find the specific event you've received this invitation for (<strong>"${event.name}"</strong>) and click on **"View Details"** on its card.</li>
                        <li>On the Event Details page, scroll down until you see a **green button** with the text **"Confirm RSVP"**.</li>
                        <li>Click that button to confirm your attendance!</li>
                        <li>You will be prompted to enter your invitation token: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${guest.invitationToken}</code></li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${rsvpUrl}" class="button">✨ RSVP Now ✨</a>
                </div>
                
                <div class="security-notice">
                    <strong>🔒 Important:</strong> This invitation token is unique to you. Please keep it safe and do not share it with others. You'll need this exact token to complete your RSVP.
                </div>
                
                <p>We can't wait to see you there!</p>
                <p>Best regards,<br><strong>The Event Team</strong></p>
            </div>
            <div class="footer">
                <p><strong>RSVP Website:</strong> <a href="${rsvpUrl}" style="color: #667eea;">${rsvpUrl}</a></p>
                <p><strong>Your Token:</strong> <code>${guest.invitationToken}</code></p>
                <p>For questions, contact our event team at <a href="mailto:${process.env.CONTACT_EMAIL || 'support@yourevents.com'}" style="color: #667eea;">${process.env.CONTACT_EMAIL || 'support@yourevents.com'}</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Enhanced bulk invitation processor with Gmail rate limiting
const processBulkInvitation = async (job) => {
    const { guests, event, batchNumber, totalBatches } = job.data;
    const transporter = await createTransporter();
    
    console.log(`📧 Processing batch ${batchNumber}/${totalBatches} with ${guests.length} guests`);
    
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
                from: {
                    name: process.env.FROM_NAME || "Event Team",
                    address: process.env.GMAIL_USER || "nelsonobuya18@gmail.com"
                },
                to: guest.email,
                subject: `🎉 You're Invited: ${event.name}`,
                html: generateInvitationHTML(guest, event),
                // Add headers for better deliverability
                headers: {
                    'X-Priority': '3',
                    'X-Mailer': 'Event Management System',
                    'Return-Path': process.env.GMAIL_USER || "nelsonobuya18@gmail.com"
                }
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
            
            console.log(`✅ Email sent to ${guest.email}`);
            
        } catch (error) {
            failCount++;
            console.error(`❌ Failed to send email to ${guest.email}:`, error.message);
            
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
        
        // Gmail rate limiting: delay between emails (increased for bulk sending)
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
    
    console.log(`🎯 Batch ${batchNumber} completed: ${successCount} sent, ${failCount} failed`);
    
    // Close transporter connection pool
    transporter.close();
    
    return {
        batchNumber,
        totalProcessed: guests.length,
        successCount,
        failCount,
        results
    };
};

// Process single email with Gmail
const processSingleEmail = async (job) => {
    const { guestId, eventId, emailType } = job.data;
    const transporter = await createTransporter();
    
    try {
        const guest = await Guest.findById(guestId);
        const event = await Event.findById(eventId);
        
        if (!guest || !event) {
            throw new Error('Guest or Event not found');
        }
        
        const subject = emailType === 'reminder' ? 
            `🔔 Reminder: ${event.name} - RSVP Required` : 
            `🎉 You're Invited: ${event.name}`;
        
        const mailOptions = {
            from: {
                name: process.env.FROM_NAME || "Event Team",
                address: process.env.GMAIL_USER || "nelsonobuya18@gmail.com"
            },
            to: guest.email,
            subject: subject,
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
        
        console.log(`✅ ${emailType} email sent to ${guest.email}`);
        
        return info;
    } finally {
        transporter.close();
    }
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