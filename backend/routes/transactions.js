const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.post('/add', transactionController.addTransaction);
router.get('/:userId', transactionController.getTransactions);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
