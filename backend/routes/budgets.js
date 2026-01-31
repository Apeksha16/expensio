const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

router.post('/add', budgetController.addOrUpdateBudget);
router.get('/:userId', budgetController.getBudgets);
router.delete('/:id', budgetController.deleteBudget);
router.delete('/category/delete', budgetController.deleteBudgetByCategory);

module.exports = router;
