const express = require("express");
const router = express.Router();

const Redemption = require("../models/redemption");
const User = require("../models/User");
const UserSurvey = require("../models/UserSurvey");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * USER → REQUEST REDEMPTION
 * Rules:
 * - Minimum 50 points
 * - Points NOT deducted here
 * - Status = pending
 */
router.post("/request", authMiddleware, async (req, res) => {
  try {
    const { assignedSurvey, assignedSurveys } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (Array.isArray(assignedSurveys) && assignedSurveys.length > 0) {
      const rewardedAssignments = await UserSurvey.find({
        userId: req.user.userId,
        surveyId: { $in: assignedSurveys },
        status: "rewarded"
      }).populate("surveyId", "rewardPoints");

      if (rewardedAssignments.length === 0) {
        return res.status(400).json({
          message: "No eligible rewarded surveys found for redemption"
        });
      }

      const rewardedSurveyIds = rewardedAssignments.map(
        (assignment) => assignment.surveyId?._id
      ).filter(Boolean);

      const points = rewardedAssignments.reduce(
        (sum, assignment) => sum + Number(assignment.surveyId?.rewardPoints || 0),
        0
      );

      if (isNaN(points) || points <= 0) {
        return res.status(400).json({
          message: "Selected surveys have invalid reward points"
        });
      }

      if (user.points < points) {
        return res.status(400).json({
          message: "Insufficient points"
        });
      }

     for (const assignment of eligibleAssignments) {
  await Redemption.create({
    userId: req.user.userId,
    points: Number(assignment.surveyId.rewardPoints || 0),
    assignedSurvey: assignment.surveyId._id,
    status: "pending"
  });
}

      return res.status(201).json({
        message: "Redemption request submitted",
        redemption
      });
    }

    if (!assignedSurvey) {
      return res.status(400).json({ message: "Please select a rewarded survey" });
    }

    const rewardedAssignment = await UserSurvey.findOne({
      userId: req.user.userId,
      surveyId: assignedSurvey,
      status: "rewarded"
    }).populate("surveyId", "rewardPoints");

    if (!rewardedAssignment || !rewardedAssignment.surveyId) {
      return res.status(400).json({
        message: "Selected survey is not eligible for redemption"
      });
    }

    const points = Number(rewardedAssignment.surveyId.rewardPoints || 0);

    if (isNaN(points) || points <= 0) {
      return res.status(400).json({
        message: "Selected survey has invalid reward points"
      });
    }

    if (user.points < points) {
      return res.status(400).json({
        message: "Insufficient points"
      });
    }

    const redemption = await Redemption.create({
      userId: req.user.userId,
      points,
      assignedSurvey,
      status: "pending"
    });

    res.status(201).json({
      message: "Redemption request submitted",
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * USER → FETCH REDEMPTION REQUESTS
 * - Returns all redemption requests for the authenticated user
 */
router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const requests = await Redemption.find({ userId: req.user.userId })
      .populate("assignedSurvey", "surveyCode title rewardPoints")
      .populate("assignedSurveys", "surveyCode title rewardPoints")
      .sort({ createdAt: -1 });

    res.json({
      requests,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch redemption requests" });
  }
});

/**
 * ADMIN → LIST REDEMPTION REQUESTS
 */
router.get("/admin/requests", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await Redemption.find()
      .populate("userId", "name email points")
      .populate("assignedSurvey", "surveyCode title rewardPoints")
      .populate("assignedSurveys", "surveyCode title rewardPoints")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  
});

/**
 * ADMIN → REDEMPTION STATS
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const total = await Redemption.countDocuments();
    const pending = await Redemption.countDocuments({ status: "pending" });
    const approved = await Redemption.countDocuments({ status: "approved" });
    const rejected = await Redemption.countDocuments({ status: "rejected" });

    res.json({
      total,
      pending,
      approved,
      rejected
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ADMIN → APPROVE REDEMPTION
 * Points deducted ONLY here
 */
router.patch("/:id/approve", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const redemption = await Redemption.findById(req.params.id);

    if (!redemption || redemption.status !== "pending") {
      return res.status(400).json({ message: "Invalid request" });
    }

    await User.findByIdAndUpdate(
      redemption.userId,
      { $inc: { points: -redemption.points } }
    );

    redemption.status = "approved";
    await redemption.save();

    res.json({
      message: "Redemption approved",
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ADMIN → REJECT REDEMPTION
 */
router.patch("/:id/reject", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const redemption = await Redemption.findById(req.params.id);

    if (!redemption || redemption.status !== "pending") {
      return res.status(400).json({ message: "Invalid request" });
    }

    redemption.status = "rejected";
    await redemption.save();

    res.json({
      message: "Redemption rejected",
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
