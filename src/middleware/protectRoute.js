import jwt from "jsonwebtoken";
import { Guest } from "../models/Guest.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Retrieve token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized44 - No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // Find user in the database
    const user = await Guest.findById(decoded.userId)
      .select("-password")
      
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach user to request object and proceed
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};