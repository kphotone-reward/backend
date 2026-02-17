const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const UserSurvey = require("../models/UserSurvey");
const User = require("../models/User");

// console.log("🔥 dashboard.js loaded");


const router = express.Router();

router.get("/surveys", authMiddleware, async (req, res) => {
  try {
    // console.log("Fetching surveys for user:", req.user.userId);
    const surveys = await UserSurvey.find({
      userId: req.user.userId
    }).populate("surveyId");

    res.json({
      message: "Assigned surveys fetched",
      surveys
    });
  } catch (error) {
    console.error("Dashboard surveys error:", error);
    res.status(500).json({ message: error.message });
  }
});
/*---------------------------------------------
  New route to filter users by speciality
---------------------------------------------*/
router.get("/filter-users", async (req, res) => {
  try {
    const { specialities } = req.query;

    if (!specialities) {
      return res.json({ users: [] });
    }

    const specialityArray = specialities.split(",");

    const users = await User.find({
      speciality: { $in: specialityArray }
    }).select("-password");

    res.json({ users });

  } catch (error) {
    console.error("Filter users error:", error);
    res.status(500).json({ message: "Failed to filter users" });
  }
});

router.get("/alive", (req, res) => {
  res.send("dashboard router alive");
});

module.exports = router;
