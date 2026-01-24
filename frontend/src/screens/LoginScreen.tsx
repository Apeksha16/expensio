import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { sendOtp, verifyOtp, googleLogin } from '../services/auth';

const { width } = Dimensions.get('window');

// Configure Google Sign-In (You need to update webClientId from your Firebase Console)
GoogleSignin.configure({
    webClientId: '820921044814-tmgitqep6hp6qd44qrn1i3sh1790osov.apps.googleusercontent.com', // Updating this while at it, it should match the one in plist for web/backend verification
    iosClientId: '820921044814-tmgitqep6hp6qd44qrn1i3sh1790osov.apps.googleusercontent.com',
});

interface LoginScreenProps {
    onLoginSuccess: (user: any) => void;
}

const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const user = await GoogleSignin.signIn();

            // Get ID Token - newer versions of Google Signin return userInfo directly or inside data
            const userInfo = user as any;
            const idToken = userInfo.idToken || userInfo.data?.idToken;
            if (!idToken) throw new Error('No ID Token found');

            // Verify with Backend
            const data = await googleLogin(idToken);

            // Notify App
            onLoginSuccess(data.user || { email: 'Google User' });

            console.log('Backend Google Login success!');
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Login Failed', 'Google Sign-In could not be completed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        try {
            setLoading(true);
            await sendOtp(email);
            setOtpSent(true);
            Alert.alert('Success', 'OTP sent! Check your backend console for the code.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the OTP.');
            return;
        }

        try {
            setLoading(true);
            const data = await verifyOtp(email, otp);
            // Verify OTP returns { token: "..." }
            if (data && data.token) {
                // Success!
                onLoginSuccess({ email });
                console.log('Email OTP Login success!');
            } else {
                throw new Error('No token received');
            }
        } catch (error) {
            Alert.alert('Error', 'Invalid OTP or Login Failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.content}>
                    <Text style={styles.title}>Expensio</Text>
                    <Text style={styles.subtitle}>Manage your expenses smartly</Text>

                    <View style={styles.card}>
                        {/* Email OTP Section */}
                        <Text style={styles.label}>{otpSent ? 'Enter OTP' : 'Email Address'}</Text>
                        <View style={styles.inputContainer}>
                            <Icon name={otpSent ? 'key-outline' : 'mail-outline'} size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={otpSent ? '123456' : 'you@example.com'}
                                placeholderTextColor="#999"
                                keyboardType={otpSent ? 'number-pad' : 'email-address'}
                                autoCapitalize="none"
                                value={otpSent ? otp : email}
                                onChangeText={otpSent ? setOtp : setEmail}
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>{otpSent ? 'Verify OTP' : 'Continue with Email'}</Text>
                            )}
                        </TouchableOpacity>

                        {otpSent && (
                            <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.backButton}>
                                <Text style={styles.backButtonText}>Use a different email</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>OR</Text>
                            <View style={styles.line} />
                        </View>

                        {/* Google Login Button */}
                        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
                            {/* Using Ionicon temporary for Google Icon representation */}
                            <Icon name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#e0e0e0',
        marginBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
        height: 50,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#333',
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: '#4c669f',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#eee',
    },
    orText: {
        marginHorizontal: 10,
        color: '#999',
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        height: 50,
    },
    googleButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LoginScreen;
