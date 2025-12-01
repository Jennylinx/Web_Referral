const express = require("express");
const router = express.Router();
const Referral = require("../models/Referral");
const { auth, authorizeRoles } = require("../middleware/auth");

// CREATE referral (any logged-in user)
router.post("/", auth, async (req, res) => {
  try {
    console.log("📥 Received referral data:", req.body);

    const { studentName, studentId, level, grade, referralDate, reason, description, severity } = req.body;

    // Validate required fields
    if (!studentName || !level || !grade || !reason || !referralDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: studentName, level, grade, reason, and referralDate are required"
      });
    }

    const newReferral = new Referral({
      studentName,
      studentId: studentId || undefined,
      level,
      grade,
      referralDate,
      reason,
      description: description || "",
      severity: severity || "Medium",
      createdBy: req.user._id,
    });

    const savedReferral = await newReferral.save();
    await savedReferral.populate("createdBy", "username fullName role");
    
    console.log("✅ Referral created:", savedReferral.referralId);
    
    res.status(201).json({ success: true, data: savedReferral });
  } catch (error) {
    console.error("❌ Error creating referral:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET adviser's own referrals (for Adviser role)
router.get("/my-referrals", auth, async (req, res) => {
  try {
    const { search, level, severity, status } = req.query;
    
    // Build filter object - only get referrals created by this adviser
    let filter = { createdBy: req.user._id };
    
    // Search by student name
    if (search) {
      filter.studentName = { $regex: search, $options: 'i' };
    }
    
    // Filter by level
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    // Filter by severity
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const referrals = await Referral.find(filter)
      .populate("createdBy", "username fullName role")
      .sort({ createdAt: -1 }); // Most recent first
    
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error("Error fetching adviser referrals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET recent referrals (last 5)
router.get("/recent", auth, async (req, res) => {
  try {
    let filter = {};
    
    // If adviser, only show their own referrals
    if (req.user.role === "Adviser") {
      filter.createdBy = req.user._id;
    }
    // Admin and Counselor see all referrals
    
    const referrals = await Referral.find(filter)
      .populate("createdBy", "username fullName role")
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error("Error fetching recent referrals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ⚠️ IMPORTANT: /stats route MUST come BEFORE /:id route
// GET referral statistics (Admin or Counselor only)
router.get("/stats", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const total = await Referral.countDocuments();
    const elementary = await Referral.countDocuments({ level: "Elementary" });
    const juniorHigh = await Referral.countDocuments({ level: "JHS" });
    const seniorHigh = await Referral.countDocuments({ level: "SHS" });
    
    // Status counts - Updated to match new enum values
    const pending = await Referral.countDocuments({ status: "Pending" });
    const underReview = await Referral.countDocuments({ status: "Under Review" });
    const forConsultation = await Referral.countDocuments({ status: "For Consultation" });
    const complete = await Referral.countDocuments({ status: "Complete" });
    
    // Severity counts
    const lowSeverity = await Referral.countDocuments({ severity: "Low" });
    const mediumSeverity = await Referral.countDocuments({ severity: "Medium" });
    const highSeverity = await Referral.countDocuments({ severity: "High" });

    res.json({
      success: true,
      data: {
        total,
        byLevel: {
          elementary,
          juniorHigh,
          seniorHigh,
        },
        byStatus: {
          pending,
          underReview,
          forConsultation,
          complete,
        },
        bySeverity: {
          low: lowSeverity,
          medium: mediumSeverity,
          high: highSeverity,
        }
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all referrals with filtering (Admin or Counselor only)
router.get("/", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const { search, level, severity, status } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Search by student name
    if (search) {
      filter.studentName = { $regex: search, $options: 'i' };
    }
    
    // Filter by level
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    // Filter by severity
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const referrals = await Referral.find(filter)
      .populate("createdBy", "username fullName role")
      .sort({ createdAt: -1 }); // Most recent first
    
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET referral by ID (Admin, Counselor, or the user who created it)
// ⚠️ This route must come AFTER /stats
router.get("/:id", auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id).populate("createdBy", "username fullName role");

    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    // Only allow access if Admin, Counselor, or the owner
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "Counselor" &&
      referral.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: "Forbidden: Access denied" });
    }

    res.json({ success: true, data: referral });
  } catch (error) {
    console.error("Error fetching referral:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE referral (Admin or Counselor can update all fields, Adviser can update limited fields)
router.put("/:id", auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    // Check permissions
    const isAdminOrCounselor = req.user.role === "Admin" || req.user.role === "Counselor";
    const isOwner = referral.createdBy.toString() === req.user._id.toString();

    if (!isAdminOrCounselor && !isOwner) {
      return res.status(403).json({ success: false, error: "Forbidden: Access denied" });
    }

    // If adviser (owner), only allow updating certain fields
    let updateData = req.body;
    if (!isAdminOrCounselor && isOwner) {
      // Adviser can only update basic info, not status or notes
      const { studentName, studentId, level, grade, referralDate, reason, description, severity } = req.body;
      updateData = { studentName, studentId, level, grade, referralDate, reason, description, severity };
    }

    const updatedReferral = await Referral.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "username fullName role");

    res.json({ success: true, data: updatedReferral });
  } catch (error) {
    console.error("Error updating referral:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE referral (Admin only)
router.delete("/:id", auth, authorizeRoles("Admin"), async (req, res) => {
  try {
    const referral = await Referral.findByIdAndDelete(req.params.id);
    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    res.json({ success: true, message: "Referral deleted successfully" });
  } catch (error) {
    console.error("Error deleting referral:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;