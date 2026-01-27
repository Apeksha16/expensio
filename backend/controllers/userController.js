
const admin = require('firebase-admin');

exports.getUserProfile = async (req, res) => {
    const { email } = req.body; // Or query param

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        res.json(userDoc.data());
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
