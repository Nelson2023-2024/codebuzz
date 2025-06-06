// routes/guestAdmin.route.js
import { Router } from "express";
import { Guest } from "../models/Guest.model.js";
import bcrypt from 'bcryptjs'; // Import bcrypt here
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";

const router = Router();

router.post('/',protectRoute, adminRoute, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, company, password, role } = req.body; // Destructure password and role

        // Basic validation for required fields
        if (!firstName || !lastName || !email || !password) { // password is now required
            return res.status(400).json({ error: 'All Fields are required' });
        }

        // --- Hash the password before creating the guest ---
        const salt = await bcrypt.genSalt(10); // Generate a salt (adjust complexity as needed)
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the provided password

        // Create a new Guest instance
        const newGuest = new Guest({
            firstName,
            lastName,
            email,
            phone,
            company,
            password: hashedPassword, // Store the hashed password
            role: role || 'guest', // Assign role, default to 'guest' if not provided
            // invitationToken is automatically generated by the schema default
            // isActive defaults to true by schema default
        });

        // Save the new guest to the database
        await newGuest.save();

        // Avoid sending the password back in the response, even if hashed
        const guestResponse = newGuest.toObject();

        res.status(201).json({
            message: 'Guest created successfully',
            guest: guestResponse // Send back the guest object without password
        });
    } catch (error) {
        console.error('Create guest error:', error);
        if (error.code === 11000) { // MongoDB duplicate key error (e.g., email already exists)
            return res.status(400).json({ error: 'A guest with this email already exists.' });
        }
        res.status(500).json({ error: error.message || 'Internal server error during guest creation.' });
    }
});

router.get("/", protectRoute, adminRoute, async (req, res) => {
    try {
        // Find all guests in the database.
        // .select('-password -__v') excludes the 'password' and '__v' (version key) fields
        // from the returned guest objects for security and cleaner data.
        // .sort({ createdAt: -1 }) sorts the results by creation date in descending order,
        // so the newest guests appear first.
        const guests = await Guest.find({})
            .select('-password -__v')
            .sort({ createdAt: -1 });

        // Get the total count of all guest documents in the collection.
        // This is a separate, efficient database operation to get only the count.
        const totalGuests = await Guest.countDocuments({});

        // Send a successful response (HTTP 200 OK)
        // The response includes a message, the array of guest objects,
        // and the total count of guests.
        res.status(200).json({
            message: 'Guests retrieved successfully',
            guests: guests,
            totalCount: totalGuests // The total count is included here
        });
    } catch (error) {
        // If an error occurs during the process, log it to the console.
        console.error('Get all guests error:', error);
        // Send an error response (HTTP 500 Internal Server Error)
        // The error message is either from the caught error or a generic one.
        res.status(500).json({ error: error.message || 'Internal server error during guest retrieval.' });
    }
});


// NEW: Route to delete a guest by ID
router.delete("/:id", protectRoute, adminRoute, async (req, res) => {
    try {
        const { id } = req.params; // Get the guest ID from URL parameters

        // Find and delete the guest
        const deletedGuest = await Guest.findByIdAndDelete(id);

        if (!deletedGuest) {
            return res.status(404).json({ error: 'Guest not found.' });
        }

        res.status(200).json({
            message: 'Guest deleted successfully',
            deletedGuestId: id // Optionally return the ID of the deleted guest
        });
    } catch (error) {
        console.error('Delete guest error:', error);
        // Handle invalid ID format (e.g., not a valid MongoDB ObjectId)
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid guest ID format.' });
        }
        res.status(500).json({ error: error.message || 'Internal server error during guest deletion.' });
    }
});
export { router as guestAdminRoute };