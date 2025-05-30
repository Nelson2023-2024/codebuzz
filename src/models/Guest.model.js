import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const guestSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Mongoose automatically creates a unique index here
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
        unique: true, // Mongoose automatically creates a unique index here
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
// The 'email' and 'invitationToken' indexes are handled by 'unique: true' above.
// Only keep indexes that are not implicitly created by other schema options.
guestSchema.index({ createdAt: -1 }); // This index is still good for performance

export const Guest = mongoose.model('Guest', guestSchema);