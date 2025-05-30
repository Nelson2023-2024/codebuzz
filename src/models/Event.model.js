import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    venue:{
        type: String,
        required: true
    },
    maxCapacity: {
        type: Number,
        default: 500
    },
    currentReservations: {
        type: Number,
        default: 0
    },
    waitlistCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    registrationDeadline: {
        type: Date,
        // Removed `default: true`. Now it will be undefined/null if not provided.
        // If you want it to default to the current time, use: default: Date.now
    }
}, {
    timestamps: true
});

export const Event = mongoose.model('Event', eventSchema);