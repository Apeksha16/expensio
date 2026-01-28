
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get User Profile
router.post('/profile', userController.getUserProfile);
router.post('/theme', userController.updateUserTheme);

module.exports = router;
