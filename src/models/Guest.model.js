import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const guestSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    invitationToken: {
        type: String,
        unique: true,
        default: uuidv4
    },
    phone: String,
    company: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for performance
guestSchema.index({ email: 1 });
guestSchema.index({ invitationToken: 1 });
guestSchema.index({ createdAt: -1 });

export const Guest = mongoose.model('Guest', guestSchema);