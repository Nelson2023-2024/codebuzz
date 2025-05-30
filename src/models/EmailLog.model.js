import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    emailType: {
        type: String,
        enum: ['invitation', 'reminder', 'confirmation', 'update'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'bounced'],
        default: 'pending'
    },
    sentAt: Date,
    errorMessage: String,
    attemptCount: {
        type: Number,
        default: 0
    },
    messageId: String
}, {
    timestamps: true
});

emailLogSchema.index({ guest: 1, emailType: 1 });
emailLogSchema.index({ status: 1, createdAt: -1 });

export const EmailLog =  mongoose.model('EmailLog', emailLogSchema);