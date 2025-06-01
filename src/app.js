import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser"
import dotenv, { configDotenv } from "dotenv";
import rateLimit from 'express-rate-limit';
import { router as bullRouter } from 'bull-board';
import { connectToDB } from './DB/db.js';

// Import external routes
import { guestAdminRoute } from './routes/guestAdmin.route.js'; // Keep existing or rename
import { emailRoutes } from './routes/email.routes.js';
import { rsvpRoutes } from './routes/rsvp.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { authRoutes } from './routes/auth.router.js';
import { adminDashnoardRoutes } from './routes/adminDashboard.route.js';

configDotenv();

const app = express();
app.use(cookieParser())

// Middleware
// Configure CORS
app.use(cors({
    origin: 'http://localhost:5173', // EXACTLY your frontend's origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'], // Ensure GET is allowed
    allowedHeaders: ['Content-Type', 'Authorization'], // Important if you send custom headers
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Mount external routes
app.use("/api/admin-guests", guestAdminRoute);
app.use("/api/email", emailRoutes);
app.use("/api/rsvp", rsvpRoutes);
app.use("/api/admin", adminRoutes); // Admin routes under /api/admin
app.use("/api/auth", authRoutes); // Admin routes under /api/admin
app.use("/api/admin-dashboard", adminDashnoardRoutes); // Admin routes under /api/admin

// Bull dashboard
app.use('/admin/queues', bullRouter);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Bull Dashboard available at http://localhost:${PORT}/admin/queues`);
    connectToDB();
});

export default app;