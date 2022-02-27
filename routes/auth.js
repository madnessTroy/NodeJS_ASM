const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');

// Log-in page
router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);

module.exports = router;
