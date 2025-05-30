import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'declined', 'waitlisted', 'pending'],
        default: 'pending'
    },
    rsvpDate: {
        type: Date,
        default: Date.now
    },
    specialRequests: String,
    dietaryRestrictions: String
}, {
    timestamps: true
});

// Compound index to prevent duplicate RSVPs
rsvpSchema.index({ guest: 1, event: 1 }, { unique: true });
rsvpSchema.index({ event: 1, status: 1 });

export const RSVP =  mongoose.model('RSVP', rsvpSchema);