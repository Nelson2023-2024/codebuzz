// routes/authRoutes.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Guest } from "../models/Guest.model.js";
import { generateToken } from "../utils/generateTokenAndSetCookie.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = Router();

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Guest.findOne({ email });
    if (!user) return res.status(404).json({ message: "Invalid credentials", error: "Email not found" });

    //if email existed
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword)
      return res
        .status(400)
        .json({ message: "Password didn't match our records" });


    // Generate JWT token if all checks are passed 
    const token = await generateToken(user._id, res)

    console.log("token:", token)




    res.status(200).json({
      message: "Logged In succesfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin logout (client-side token invalidation)
router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

// Get current authenticated admin
router.get("/me", protectRoute, async (req, res) => {
  try {
    // Middleware will attach user to req
    const user = await Guest.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update current user's profile
router.put("/update-profile", protectRoute, async (req, res) => {
  try {
    const { firstName, lastName, phone, company } = req.body;

    const user = await Guest.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (company) user.company = company;

    
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.firstName + " " + user.lastName,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export { router as authRoutes };