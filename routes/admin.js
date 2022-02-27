const express = require('express');
const router = express.Router();

const isAuth = require('../middleware/is-auth');
const adminController = require('../controllers/admin');

// Admin page
router.get('/staff-management', isAuth, adminController.getAdminPage);

// Check lương nhân viên:
router.get('/worked/:staffId', isAuth, adminController.getStaffSalary);
router.post('/worked/:staffId', isAuth, adminController.getStaffSalary);

router.post('/deleteWorked/:staffId', isAuth, adminController.postDeleteWorked);

router.get('/covid/:staffId', isAuth, adminController.getCovidPDF);

module.exports = router;
