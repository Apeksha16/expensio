const admin = require('firebase-admin');

// Add Transaction
exports.addTransaction = async (req, res) => {
    try {
        const { userId, amount, type, category, note, date, title } = req.body;

        if (!userId || !amount || !type || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newTransaction = {
            userId,
            amount: parseFloat(amount),
            type, // 'expense' or 'income'
            category,
            note: note || '',
            title: title || note || 'Untitled',
            date: date ? new Date(date) : new Date(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore().collection('transactions').add(newTransaction);

        // Fetch back to return with ID
        const savedDoc = await docRef.get();
        const savedData = savedDoc.data();

        // Convert Dates to ISO strings
        const responseData = {
            id: savedDoc.id,
            ...savedData,
            date: savedData.date.toDate().toISOString(),
            createdAt: savedData.createdAt.toDate().toISOString()
        };

        res.status(201).json({ message: 'Transaction saved', transaction: responseData });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get User Transactions
// Optimized with pagination and date filtering for scalability
exports.getTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            limit = 100, // Default limit to prevent fetching too many at once
            startAfter, // For pagination
            startDate, // Optional: filter by start date
            endDate, // Optional: filter by end date
            type, // Optional: filter by type (expense/income)
            category // Optional: filter by category
        } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Build query - always filter by userId first (most selective)
        let query = admin.firestore()
            .collection('transactions')
            .where('userId', '==', userId);

        // Add optional filters
        if (type) {
            query = query.where('type', '==', type);
        }
        if (category) {
            query = query.where('category', '==', category);
        }
        if (startDate || endDate) {
            if (startDate) {
                query = query.where('date', '>=', new Date(startDate));
            }
            if (endDate) {
                query = query.where('date', '<=', new Date(endDate));
            }
        }

        // Order by date descending (requires composite index)
        // If index doesn't exist, we'll sort in memory (fallback)
        try {
            query = query.orderBy('date', 'desc');
        } catch (indexError) {
            // Index might not exist, we'll sort in memory
            console.warn('Composite index not found, sorting in memory:', indexError.message);
        }

        // Apply pagination
        const limitNum = parseInt(limit, 10);
        if (limitNum > 0 && limitNum <= 500) { // Max 500 per request
            query = query.limit(limitNum);
        } else {
            query = query.limit(100); // Default limit
        }

        if (startAfter) {
            const startAfterDoc = await admin.firestore().collection('transactions').doc(startAfter).get();
            if (startAfterDoc.exists) {
                query = query.startAfter(startAfterDoc);
            }
        }

        const snapshot = await query.get();

        const transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate().toISOString(),
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
            };
        });

        // If we couldn't use orderBy in query, sort in memory
        if (transactions.length > 0 && !startDate && !endDate) {
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        // Return with pagination metadata
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        res.status(200).json({
            transactions,
            hasMore: snapshot.docs.length === limitNum,
            lastDocId: lastDoc ? lastDoc.id : null,
            count: transactions.length
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Transaction ID is required' });
        }

        await admin.firestore().collection('transactions').doc(id).delete();

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
