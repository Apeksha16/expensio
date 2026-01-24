
// Replace with your Laptop's Local IP if testing on Real Device, or 10.0.2.2 for Android Emulator, localhost for iOS simulator
// Since user is on Mac, localhost is usually fine for iOS Simulator. 
// For physical device, we should ideally use local IP, but let's stick to localhost for simulator first.
export const API_URL = 'http://localhost:5001/api/auth';

export const sendOtp = async (email: string) => {
    try {
        const response = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Send OTP Failed:', response.status, errorText);
            throw new Error(`Failed to send OTP: ${response.status} ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Send OTP Error:', error);
        throw error;
    }
};

export const verifyOtp = async (email: string, otp: string) => {
    try {
        const response = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            throw new Error('Failed to verify OTP');
        }

        return await response.json();
    } catch (error) {
        console.error('Verify OTP Error:', error);
        throw error;
    }
};

export const googleLogin = async (idToken: string) => {
    try {
        const response = await fetch(`${API_URL}/google-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            throw new Error('Failed to verify Google Token');
        }

        return await response.json();
    } catch (error) {
        console.error('Google Login Error:', error);
        throw error;
    }
};
