const express = require('express');
const router = express.Router();

const staffController = require('../controllers/staff');
const staff = require('../models/staff');

// Staff list
router.get('/', staffController.getStaffs);

// Check In
// /check IN
router.get('/check-in/:staffId', staffController.getCheckIn);
router.post('/check-in', staffController.postCheckIn);

// Status
router.get('/status/:staffId', staffController.getStatus);

// Check Out
router.get('/check-out/:staffId', staffController.getCheckOut);
router.post('/check-out', staffController.postCheckOut);

// Absent
router.get('/absent/:staffId', staffController.getAbsent);
router.post('/absent', staffController.postAbsent);

// Info
router.get('/info/:staffId', staffController.getInfo);
router.post('/info', staffController.postInfo);

// Worked
router.get('/worked/:staffId', staffController.getWorked);
router.post('/worked/:staffId', staffController.getWorked);

// Covid
router.get('/covid', staffController.getCovid);
router.get('/covid/:staffId', staffController.getCovidInfo);
router.get('/covid-regis/:staffId', staffController.getCovidRegis);
router.post('/covid-regis', staffController.postCovidRegis);
module.exports = router;
