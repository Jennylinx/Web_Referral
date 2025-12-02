const express = require("express");
const router = express.Router();
const Referral = require("../models/Referral");

// PUBLIC ROUTE - Student Form Submission (No Auth Required)
router.post("/", async (req, res) => {
  try {
    console.log("📥 Received student concern:", req.body);

    const { studentName, concern, nameOption } = req.body;

    // Validate input
    if (!concern || concern.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Concern is required' 
      });
    }

    // Create new referral from student submission
    const newReferral = new Referral({
      studentName: studentName || 'Anonymous',
      studentId: undefined,
      level: undefined, // ✅ Changed from 'N/A' to undefined so counselor can fill it
      grade: undefined, // ✅ Changed from 'N/A' to undefined so counselor can fill it
      referralDate: new Date(),
      reason: concern,
      description: concern,
      severity: 'Medium',
      status: 'Pending',
      isStudentSubmitted: true, // ✅ FIXED: Changed from isStudentConcern to isStudentSubmitted
      studentNameOption: nameOption || 'preferNot',
      createdBy: null,
      referredBy: 'Student Self-Report' // ✅ Added default value
    });

    const savedReferral = await newReferral.save();
    
    console.log("✅ Student concern submitted:", savedReferral.referralId);
    
    res.status(201).json({
      success: true,
      message: 'Concern submitted successfully',
      data: {
        referralId: savedReferral.referralId
      }
    });

  } catch (error) {
    console.error("❌ Error submitting student concern:", error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.'
    });
  }
});

module.exports = router;