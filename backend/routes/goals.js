const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

router.post('/add', goalController.addOrUpdateGoal);
router.get('/:userId', goalController.getGoals);
router.delete('/:id', goalController.deleteGoal);
router.post('/add-funds', goalController.addFunds);
router.put('/update-funds', goalController.updateFundEntry);
router.get('/:goalId/history', goalController.getGoalHistory);

module.exports = router;
