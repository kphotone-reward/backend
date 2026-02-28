const Survey = require("../models/Survey");

exports.createSurvey = async (req, res) => {
  try {
    const {
      surveyCode,
      title,
      surveyLink,
      rewardPoints,
      startDate,
      endDate
    } = req.body;

    // 1️⃣ Basic field validation
    if (!surveyCode || !title || !surveyLink || !rewardPoints || !startDate || !endDate) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // 2️⃣ Check if surveyCode already exists
    const existingSurvey = await Survey.findOne({ surveyCode });

    if (existingSurvey) {
      return res.status(400).json({
        message: "Survey Code already exists"
      });
    }

    // 3️⃣ Create survey
    const survey = new Survey({
      surveyCode,
      title,
      surveyLink,
      rewardPoints,
      startDate,
      endDate
    });

    await survey.save();

    res.status(201).json({
      message: "Survey created successfully",
      survey
    });

  } catch (error) {
    console.error("Create Survey Error:", error);
    res.status(500).json({
      message: "Server error while creating survey"
    });
  }
};