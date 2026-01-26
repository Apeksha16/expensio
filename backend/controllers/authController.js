const admin = require('firebase-admin');

// In-memory OTP store (Use Redis for production)
const otpStore = new Map();

exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
        otp,
        expires: Date.now() + 5 * 60 * 1000
    });

    // Log to console instead of sending email
    console.log(`============================================`);
    console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);
    console.log(`============================================`);

    res.json({ message: 'OTP sent successfully (check console)' });
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const record = otpStore.get(email);

    if (!record) {
        return res.status(400).json({ error: 'No OTP found for this email' });
    }

    if (Date.now() > record.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired' });
    }

    if (record.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP Valid! Create custom token
    try {
        // Check if user exists, otherwise create
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                user = await admin.auth().createUser({
                    email,
                    emailVerified: true
                });
            } else {
                throw error;
            }
        }

        const customToken = await admin.auth().createCustomToken(user.uid);

        // Clear OTP
        otpStore.delete(email);

        res.json({ token: customToken });
    } catch (error) {
        console.error('Error creating token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID_IOS = '820921044814-tmgitqep6hp6qd44qrn1i3sh1790osov.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_WEB = '820921044814-8fdnvo1193aki6t29kv5lpcdfffr8g6j.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID_WEB);

exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'ID Token required' });
    }

    try {
        console.log('Verifying Google Token via Google Auth Library...');
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: [GOOGLE_CLIENT_ID_IOS, GOOGLE_CLIENT_ID_WEB],
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleUid } = payload;

        console.log(`Google Token Verified. User: ${email}`);

        // Check if user exists in Firebase, if not, create
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create user with Google info
                user = await admin.auth().createUser({
                    email,
                    displayName: name,
                    photoURL: picture,
                    emailVerified: true
                });
            } else {
                throw error;
            }
        }

        // Mint Custom Token for Firebase Auth on Client (if you were using it)
        // OR just return the user object if purely API based.
        // Since we are API based now, returning a custom token is still useful if we decide to re-integrate 
        // or just to have a session token.
        const customToken = await admin.auth().createCustomToken(user.uid);

        res.json({ token: customToken, user: { email, picture, name } });
    } catch (error) {
        console.error('Error verifying Google Token:', error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        res.status(401).json({ error: 'Invalid Google Token', details: error.message });
    }
};
