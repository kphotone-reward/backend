const express = require('express');
const router = express.Router();
const { getSpecialities } = require('../controllers/specialityController');

router.get("/", getSpecialities);

module.exports = router;
