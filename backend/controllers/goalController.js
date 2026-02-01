const admin = require('firebase-admin');

// Add or Update Goal
exports.addOrUpdateGoal = async (req, res) => {
    try {
        const { id, userId, title, targetAmount, targetDate, savedAmount = 0 } = req.body;

        if (!userId || !title || !targetAmount || !targetDate) {
            return res.status(400).json({ error: 'Missing required fields: userId, title, targetAmount, and targetDate are required' });
        }

        const targetAmountValue = parseFloat(targetAmount);
        if (isNaN(targetAmountValue) || targetAmountValue <= 0) {
            return res.status(400).json({ error: 'Target Amount must be a positive number' });
        }

        if (title.trim().length < 2 || title.trim().length > 50) {
            return res.status(400).json({ error: 'Goal title must be between 2 and 50 characters' });
        }

        let goalRef;
        let isNew = false;

        if (id) {
            // Update existing
            goalRef = admin.firestore().collection('goals').doc(id);
        } else {
            // Create new
            goalRef = admin.firestore().collection('goals').doc();
            isNew = true;
        }

        const goalData = {
            userId,
            title: title.trim(),
            targetAmount: targetAmountValue,
            savedAmount: parseFloat(savedAmount) || 0,
            targetDate: new Date(targetDate), // Store as Firestore Timestamp
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (isNew) {
            goalData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await goalRef.set(goalData, { merge: true });

        const savedDoc = await goalRef.get();
        const savedData = savedDoc.data();

        const responseData = {
            id: savedDoc.id,
            ...savedData,
            targetDate: savedData.targetDate ? savedData.targetDate.toDate().toISOString() : null,
            createdAt: savedData.createdAt ? savedData.createdAt.toDate().toISOString() : null,
            updatedAt: savedData.updatedAt ? savedData.updatedAt.toDate().toISOString() : null
        };

        res.status(isNew ? 201 : 200).json({
            message: isNew ? 'Goal created successfully' : 'Goal updated successfully',
            goal: responseData
        });

    } catch (error) {
        console.error('Error adding/updating goal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get User Goals
exports.getGoals = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const snapshot = await admin.firestore()
            .collection('goals')
            .where('userId', '==', userId)
            .get();

        const goals = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                targetDate: data.targetDate ? data.targetDate.toDate().toISOString() : null,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
            };
        });

        res.status(200).json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete Goal
exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Goal ID is required' });
        }

        await admin.firestore().collection('goals').doc(id).delete();

        res.status(200).json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
// Add Funds to Goal
exports.addFunds = async (req, res) => {
    try {
        const { goalId, amount, date } = req.body;

        if (!goalId || !amount || !date) {
            return res.status(400).json({ error: 'Goal ID, amount, and date are required' });
        }

        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const goalRef = admin.firestore().collection('goals').doc(goalId);

        await admin.firestore().runTransaction(async (t) => {
            const doc = await t.get(goalRef);
            if (!doc.exists) {
                throw new Error('Goal not found');
            }

            const currentSaved = doc.data().savedAmount || 0;
            const newSavedAmount = currentSaved + amountValue;

            t.update(goalRef, {
                savedAmount: newSavedAmount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Add history record
            const historyRef = goalRef.collection('history').doc();
            t.set(historyRef, {
                amount: amountValue,
                date: new Date(date),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // Return updated goal data
        const updatedDoc = await goalRef.get();
        const updatedData = updatedDoc.data();

        res.status(200).json({
            message: 'Funds added successfully',
            goal: {
                id: updatedDoc.id,
                ...updatedData,
                targetDate: updatedData.targetDate ? updatedData.targetDate.toDate().toISOString() : null,
                createdAt: updatedData.createdAt ? updatedData.createdAt.toDate().toISOString() : null,
                updatedAt: updatedData.updatedAt ? updatedData.updatedAt.toDate().toISOString() : null
            }
        });
    } catch (error) {
        console.error('Error adding funds:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

// Get Goal History
exports.getGoalHistory = async (req, res) => {
    try {
        const { goalId } = req.params;

        if (!goalId) {
            return res.status(400).json({ error: 'Goal ID is required' });
        }

        const snapshot = await admin.firestore()
            .collection('goals')
            .doc(goalId)
            .collection('history')
            .orderBy('date', 'desc')
            .get();

        const history = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date ? data.date.toDate().toISOString() : null,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
            };
        });

        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching goal history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update Fund Entry
exports.updateFundEntry = async (req, res) => {
    try {
        const { goalId, transactionId, amount, date } = req.body;

        if (!goalId || !transactionId || !amount || !date) {
            return res.status(400).json({ error: 'Goal ID, Transaction ID, amount, and date are required' });
        }

        const newAmountValue = parseFloat(amount);
        if (isNaN(newAmountValue) || newAmountValue <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const goalRef = admin.firestore().collection('goals').doc(goalId);
        const historyRef = goalRef.collection('history').doc(transactionId);

        await admin.firestore().runTransaction(async (t) => {
            const goalDoc = await t.get(goalRef);
            const historyDoc = await t.get(historyRef);

            if (!goalDoc.exists) {
                throw new Error('Goal not found');
            }
            if (!historyDoc.exists) {
                throw new Error('Transaction not found');
            }

            const currentSaved = goalDoc.data().savedAmount || 0;
            const oldAmount = historyDoc.data().amount || 0;

            // Calculate new total
            const newSavedAmount = currentSaved - oldAmount + newAmountValue;

            t.update(goalRef, {
                savedAmount: newSavedAmount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            t.update(historyRef, {
                amount: newAmountValue,
                date: new Date(date),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // Return updated goal data
        const updatedDoc = await goalRef.get();
        const updatedData = updatedDoc.data();

        res.status(200).json({
            message: 'Transaction updated successfully',
            goal: {
                id: updatedDoc.id,
                ...updatedData,
                targetDate: updatedData.targetDate ? updatedData.targetDate.toDate().toISOString() : null,
                createdAt: updatedData.createdAt ? updatedData.createdAt.toDate().toISOString() : null,
                updatedAt: updatedData.updatedAt ? updatedData.updatedAt.toDate().toISOString() : null
            }
        });

    } catch (error) {
        console.error('Error updating fund entry:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
