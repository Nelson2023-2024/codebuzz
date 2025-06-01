import { Router } from "express";
import { Guest } from "../models/Guest.model.js";
import { Event } from "../models/Event.model.js";
import { RSVP } from "../models/RSVP.model.js";
import { EmailLog } from "../models/EmailLog.model.js";
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";

const router = Router();

// GET /api/admin-dashboard/metrics
router.get("/metrics",protectRoute,adminRoute, async (req, res) => {
  try {
    const [
      totalGuests,
      totalEvents,
      activeEvents,
      totalRSVPs,
      rsvpBreakdown,
      checkInStatusBreakdown,
      emailStats,
      recentRSVPs,
      upcomingEvents
    ] = await Promise.all([
      Guest.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ isActive: true }),
      RSVP.countDocuments(),

      RSVP.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),

      RSVP.aggregate([
        { $group: { _id: "$checkInStatus", count: { $sum: 1 } } }
      ]),

      EmailLog.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),

      RSVP.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("guest", "firstName lastName email")
        .populate("event", "name eventDate"),

      Event.find({ eventDate: { $gte: new Date() } })
        .sort({ eventDate: 1 })
        .limit(3)
    ]);

    // Format response
    res.status(200).json({
      totalGuests,
      totalEvents,
      activeEvents,
      totalRSVPs,
      rsvpBreakdown: formatArrayToObject(rsvpBreakdown),
      checkInStatusBreakdown: formatArrayToObject(checkInStatusBreakdown),
      emailStats: formatArrayToObject(emailStats),
      recentRSVPs,
      upcomingEvents
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Utility: Converts [{ _id: 'confirmed', count: 5 }] to { confirmed: 5 }
function formatArrayToObject(arr) {
  return arr.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
}

export { router as adminDashnoardRoutes };
