const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');

const isAuth = require('../middleware/is-auth');
// Home page
router.get('/', userController.getHomePage);

// Staff list
router.get('/staff', isAuth, userController.getStaffs);

// Check In
// /check IN
router.get('/check-in/:userId', isAuth, userController.getCheckIn);
router.post('/check-in', isAuth, userController.postCheckIn);

// Status
router.get('/status/:userId', isAuth, userController.getStatus);

// Check Out
router.get('/check-out/:userId', isAuth, userController.getCheckOut);
router.post('/check-out', isAuth, userController.postCheckOut);

// Absent
router.get('/absent/:userId', isAuth, userController.getAbsent);
router.post('/absent', isAuth, userController.postAbsent);

// Info
router.get('/info/:userId', isAuth, userController.getInfo);
router.post('/info', isAuth, userController.postInfo);

// Worked
router.get('/worked', isAuth, userController.getWorked);
router.post('/worked', isAuth, userController.getWorked);

// Covid
router.get('/covid', isAuth, userController.getCovid);
router.get('/covid/:userId', isAuth, userController.getCovidInfo);
router.get('/covid-regis/:userId', isAuth, userController.getCovidRegis);
router.post('/covid-regis', isAuth, userController.postCovidRegis);

module.exports = router;
