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

// GET /api/guest-dashboard/metrics
router.get("/guest-metrics", protectRoute, async (req, res) => {
  try {
    const guestId = req.user._id;

    // Fetch RSVPs for the guest
    const rsvps = await RSVP.find({ guest: guestId }).populate("event");

    // Calculate RSVP status counts
    const rsvpStatusCounts = rsvps.reduce((acc, rsvp) => {
      acc[rsvp.status] = (acc[rsvp.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate check-in status counts
    const checkInStatusCounts = rsvps.reduce((acc, rsvp) => {
      acc[rsvp.checkInStatus] = (acc[rsvp.checkInStatus] || 0) + 1;
      return acc;
    }, {});

    // Fetch recent RSVPs (limit to 5)
    const recentRSVPs = rsvps
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((rsvp) => ({
        eventName: rsvp.event.name,
        eventDate: rsvp.event.eventDate,
        status: rsvp.status,
        checkInStatus: rsvp.checkInStatus,
        rsvpDate: rsvp.rsvpDate,
      }));

    // Fetch upcoming events the guest is invited to
    const upcomingEvents = rsvps
      .filter((rsvp) => new Date(rsvp.event.eventDate) > new Date())
      .sort((a, b) => new Date(a.event.eventDate) - new Date(b.event.eventDate))
      .slice(0, 3)
      .map((rsvp) => ({
        eventName: rsvp.event.name,
        eventDate: rsvp.event.eventDate,
        status: rsvp.status,
      }));

    // Fetch email logs for the guest
    const emailLogs = await EmailLog.find({ guest: guestId });

    // Calculate email status counts
    const emailStatusCounts = emailLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      totalInvitedEvents: rsvps.length,
      rsvpStatusCounts,
      checkInStatusCounts,
      recentRSVPs,
      upcomingEvents,
      emailStatusCounts,
    });
  } catch (error) {
    console.error("Error fetching guest dashboard metrics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as adminDashnoardRoutes };
