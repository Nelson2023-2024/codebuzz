// Enhanced RSVP Model with seat number support
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
    seatNumber: {
        type: Number,
        sparse: true, // Only confirmed attendees get seat numbers
        min: 1
    },
    rsvpDate: {
        type: Date,
        default: Date.now
    },
    specialRequests: String,
    dietaryRestrictions: String,
    checkInStatus: {
        type: String,
        enum: ['not_arrived', 'checked_in', 'no_show'],
        default: 'not_arrived'
    },
    checkInTime: Date
}, {
    timestamps: true
});

// Compound index to prevent duplicate RSVPs
rsvpSchema.index({ guest: 1, event: 1 }, { unique: true });
rsvpSchema.index({ event: 1, status: 1 });
// Index for seat number queries (sparse index only indexes documents with seatNumber)
rsvpSchema.index({ event: 1, seatNumber: 1 }, { sparse: true });

export const RSVP = mongoose.model('RSVP', rsvpSchema);