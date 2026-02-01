const admin = require('firebase-admin');

// Add Subscription
exports.addSubscription = async (req, res) => {
    try {
        const { userId, name, amount, frequency, nextBillDate, icon, color } = req.body;

        if (!userId || !name || !amount || !frequency || !nextBillDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newSubscription = {
            userId,
            name,
            amount: parseFloat(amount),
            frequency,
            nextBillDate: new Date(nextBillDate), // Store as Date object
            icon: icon || 'card-outline',
            color: color || '#EF4444',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore().collection('subscriptions').add(newSubscription);

        // Fetch back to return with ID
        const savedDoc = await docRef.get();
        const savedData = savedDoc.data();

        const responseData = {
            id: savedDoc.id,
            ...savedData,
            nextBillDate: savedData.nextBillDate.toDate().toISOString(),
            createdAt: savedData.createdAt ? savedData.createdAt.toDate().toISOString() : null
        };

        res.status(201).json({ message: 'Subscription saved', subscription: responseData });
    } catch (error) {
        console.error('Error adding subscription:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get User Subscriptions
exports.getSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const snapshot = await admin.firestore()
            .collection('subscriptions')
            .where('userId', '==', userId)
            .get();

        const subscriptions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                nextBillDate: data.nextBillDate.toDate().toISOString(),
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
            };
        });

        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update Subscription
exports.updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }

        // Convert date string back to Date object if present
        if (updates.nextBillDate) {
            updates.nextBillDate = new Date(updates.nextBillDate);
        }

        await admin.firestore().collection('subscriptions').doc(id).update(updates);

        res.status(200).json({ message: 'Subscription updated successfully' });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete Subscription
exports.deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }

        await admin.firestore().collection('subscriptions').doc(id).delete();

        res.status(200).json({ message: 'Subscription deleted successfully' });
    } catch (error) {
        console.error('Error deleting subscription:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
