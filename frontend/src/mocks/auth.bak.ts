// Mock Auth Service for Web PWA Demo
export const API_URL = 'http://localhost:5001/api/auth';

export const sendOtp = async (email: string) => {
    console.log('[Mock] sendOtp called for:', email);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate clear delay
    return { success: true, message: 'OTP sent (mock)' };
};

export const verifyOtp = async (email: string, otp: string) => {
    console.log('[Mock] verifyOtp called for:', email, otp);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (otp === '000000') {
        return {
            token: 'mock-jwt-token',
            user: { email, id: 'mock-user-id' }
        };
    }
    // Simulate failure for specific OTP if needed, or just succeed for PWA demo
    return {
        token: 'mock-jwt-token',
        user: { email, id: 'mock-user-id' }
    };
};

export const googleLogin = async (idToken: string) => {
    console.log('[Mock] googleLogin called with token:', idToken);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        token: 'mock-google-jwt-token',
        user: {
            email: 'google@example.com',
            name: 'Google User',
            photo: 'https://via.placeholder.com/150',
            id: 'mock-google-id'
        }
    };
};
