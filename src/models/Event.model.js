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
        default: true
    }
}, {
    timestamps: true
});

export const Event =  mongoose.model('Event', eventSchema);