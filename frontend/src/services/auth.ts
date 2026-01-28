
import { Platform } from 'react-native';

// Android Emulator uses 10.0.2.2 to access host localhost.
// iOS Simulator uses localhost.
// For physical devices, you must use your computer's LAN IP address.
export const API_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:5001/api/auth'
    : 'http://localhost:5001/api/auth';

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

export const getUserProfile = async (email: string) => {
    try {
        // Construct user api url manually since API_URL points to /api/auth
        const USER_API_URL = API_URL.replace('/auth', '/users');
        const response = await fetch(`${USER_API_URL}/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Get Profile Error:', error);
        throw error;
    }
};

export const updateUserTheme = async (email: string, theme: 'light' | 'dark' | 'system') => {
    try {
        const USER_API_URL = API_URL.replace('/auth', '/users');
        const response = await fetch(`${USER_API_URL}/theme`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, theme }),
        });

        if (!response.ok) {
            throw new Error('Failed to update user theme');
        }

        return await response.json();
    } catch (error) {
        console.error('Update Theme Error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) console.warn('Backend logout failed');
        return true;
    } catch (error) {
        console.error('Logout API Error:', error);
        return false;
    }
};
