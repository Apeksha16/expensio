const admin = require('firebase-admin');

// Add or Update Budget
exports.addOrUpdateBudget = async (req, res) => {
    try {
        const { userId, category, limit } = req.body;

        if (!userId || !category || limit === undefined) {
            return res.status(400).json({ error: 'Missing required fields: userId, category, and limit are required' });
        }

        const limitValue = parseFloat(limit);
        if (isNaN(limitValue) || limitValue <= 0) {
            return res.status(400).json({ error: 'Limit must be a positive number' });
        }

        if (category.trim().length < 2 || category.trim().length > 50) {
            return res.status(400).json({ error: 'Category name must be between 2 and 50 characters' });
        }

        // Check if budget already exists for this user and category
        const budgetsSnapshot = await admin.firestore()
            .collection('budgets')
            .where('userId', '==', userId)
            .where('category', '==', category.trim())
            .get();

        let budgetRef;
        let isNew = false;
        let currentBudgetLimit = 0;

        if (budgetsSnapshot.empty) {
            // Create new budget
            budgetRef = admin.firestore().collection('budgets').doc();
            isNew = true;
        } else {
            // Update existing budget
            budgetRef = budgetsSnapshot.docs[0].ref;
            currentBudgetLimit = budgetsSnapshot.docs[0].data().limit || 0;
        }

        // Get user's monthly income (salary or calculate from transactions)
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        // Strip commas (e.g. "9,99,005") before parsing
        const salaryStr = userData.salary != null ? String(userData.salary).replace(/,/g, '').trim() : '';
        const userSalary = salaryStr ? (parseFloat(salaryStr) || 0) : 0;

        // If no salary set, calculate from transactions
        let monthlyIncome = userSalary;
        if (monthlyIncome <= 0) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const incomeTransactions = await admin.firestore()
                .collection('transactions')
                .where('userId', '==', userId)
                .where('type', '==', 'income')
                .where('date', '>=', startOfMonth)
                .where('date', '<=', endOfMonth)
                .get();

            monthlyIncome = incomeTransactions.docs.reduce((sum, doc) => {
                return sum + (doc.data().amount || 0);
            }, 0);
        }

        // Get all budgets for this user
        const allBudgetsSnapshot = await admin.firestore()
            .collection('budgets')
            .where('userId', '==', userId)
            .get();

        // Sum of OTHER budgets only (exclude the one we're editing, if any)
        const otherBudgetsTotal = allBudgetsSnapshot.docs.reduce((sum, doc) => {
            const budgetData = doc.data();
            if (!isNew && doc.id === budgetRef.id) {
                return sum; // exclude this budget when editing
            }
            return sum + (budgetData.limit || 0);
        }, 0);

        // This budget can use at most: monthly income - what's already allocated to others
        const available = monthlyIncome - otherBudgetsTotal;

        // After save, total budgets must not exceed income: otherBudgetsTotal + limitValue <= monthlyIncome
        const newTotalWouldBe = otherBudgetsTotal + limitValue;

        // If user has no income set, show helpful error
        if (monthlyIncome <= 0) {
            return res.status(400).json({ 
                error: 'Please set your monthly income/salary first before creating budgets',
                available: 0,
                monthlyIncome: 0
            });
        }

        // Validate: this budget cannot exceed available; total budgets must never exceed income
        if (limitValue > available) {
            return res.status(400).json({ 
                error: `Budget limit exceeds available income. Maximum allowed: ₹${available.toLocaleString()}`,
                available: available,
                monthlyIncome: monthlyIncome
            });
        }
        if (newTotalWouldBe > monthlyIncome) {
            return res.status(400).json({ 
                error: `Total budgets cannot exceed monthly income (₹${monthlyIncome.toLocaleString()}). Maximum for this budget: ₹${available.toLocaleString()}`,
                available: available,
                monthlyIncome: monthlyIncome
            });
        }

        const budgetData = {
            userId,
            category: category.trim(),
            limit: limitValue,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (isNew) {
            budgetData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await budgetRef.set(budgetData, { merge: true });

        // Fetch the saved document
        const savedDoc = await budgetRef.get();
        const savedData = savedDoc.data();

        const responseData = {
            id: savedDoc.id,
            ...savedData,
            createdAt: savedData.createdAt ? savedData.createdAt.toDate().toISOString() : null,
            updatedAt: savedData.updatedAt ? savedData.updatedAt.toDate().toISOString() : null
        };

        res.status(isNew ? 201 : 200).json({ 
            message: isNew ? 'Budget created successfully' : 'Budget updated successfully',
            budget: responseData 
        });
    } catch (error) {
        console.error('Error adding/updating budget:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get User Budgets
exports.getBudgets = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const snapshot = await admin.firestore()
            .collection('budgets')
            .where('userId', '==', userId)
            .get();

        const budgets = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            budgets[data.category] = data.limit;
        });

        res.status(200).json(budgets);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete Budget
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Budget ID is required' });
        }

        await admin.firestore().collection('budgets').doc(id).delete();

        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete Budget by Category
exports.deleteBudgetByCategory = async (req, res) => {
    try {
        const { userId, category } = req.body;

        if (!userId || !category) {
            return res.status(400).json({ error: 'User ID and category are required' });
        }

        const snapshot = await admin.firestore()
            .collection('budgets')
            .where('userId', '==', userId)
            .where('category', '==', category)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        // Delete all matching budgets (should be only one)
        const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
