const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/google-login', authController.googleLogin);


// Logout Route
router.post('/logout', authController.logout);

// Secure MPIN Routes
router.get('/public-key', authController.getPublicKey);
router.post('/mpin/set', authController.setMpin);
router.post('/mpin/validate', authController.validateMpin);

module.exports = router;
