import React, { useState, useEffect, useRef } from 'react';
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
    SafeAreaView,
    StatusBar,
    Animated,
    Easing,
    Dimensions,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { sendOtp, verifyOtp, googleLogin } from '../services/auth';

const { width, height } = Dimensions.get('window');

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: '820921044814-tmgitqep6hp6qd44qrn1i3sh1790osov.apps.googleusercontent.com',
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

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current; // Start from further down
    const blob1Anim = useRef(new Animated.Value(0)).current;
    const blob2Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Blob Floating Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(blob1Anim, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(blob1Anim, {
                    toValue: 0,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(blob2Anim, {
                    toValue: 1,
                    duration: 5000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(blob2Anim, {
                    toValue: 0,
                    duration: 5000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const user = await GoogleSignin.signIn();
            const userInfo = user as any;
            const idToken = userInfo.idToken || userInfo.data?.idToken;
            if (!idToken) throw new Error('No ID Token found');
            const data = await googleLogin(idToken);
            onLoginSuccess(data.user || { email: 'Google User' });
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
            onLoginSuccess({ email });
        } catch (error) {
            Alert.alert('Error', 'Invalid OTP or Login Failed.');
        } finally {
            setLoading(false);
        }
    };

    // Interpolate animated values for blobs
    const blob1TranslateY = blob1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20],
    });
    const blob2TranslateY = blob2Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -25],
    });


    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            {/* Background Blobs */}
            <View style={styles.backgroundContainer}>
                {/* Pink Blob - Top Right */}
                <Animated.View style={[
                    styles.blob,
                    { backgroundColor: '#F9A8D4', top: -50, right: -50, width: 200, height: 200, transform: [{ translateY: blob1TranslateY }] }
                ]} />

                {/* Yellow Blob - Middle Left */}
                <Animated.View style={[
                    styles.blob,
                    { backgroundColor: '#FDE047', top: height * 0.15, left: -60, width: 180, height: 180, transform: [{ translateY: blob2TranslateY }] }
                ]} />

                {/* Cyan Blob - Bottom Right (Behind sheet a bit) */}
                <Animated.View style={[
                    styles.blob,
                    { backgroundColor: '#67E8F9', top: height * 0.35, right: -30, width: 150, height: 150 }
                ]} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Brand Logo Floating Top */}
                <View style={styles.topSection}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>💰</Text>
                    </View>
                    <Text style={styles.brandName}>Expensio</Text>
                </View>

                {/* Bottom Sheet */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0} // Adjust based on header/status bar
                >
                    <Animated.View style={[
                        styles.bottomSheet,
                        {
                            transform: [{ translateY: slideAnim }],
                            opacity: fadeAnim
                        }
                    ]}>

                        {/* Header Section */}
                        <View style={styles.sheetHeader}>
                            <Text style={styles.title}>{otpSent ? 'Enter Code' : 'Welcome Back'}</Text>
                            <Text style={styles.subtitle}>
                                {otpSent
                                    ? `We sent a code to ${email}`
                                    : 'Please sign in to continue to your account.'}
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Image
                                    source={require('../assets/icons/icon_email.png')}
                                    style={styles.inputIconImage}
                                    resizeMode="contain"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={otpSent ? '000000' : 'name@example.com'}
                                    placeholderTextColor="#9CA3AF"
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
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {otpSent ? 'Verify Access' : 'Continue'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {otpSent && (
                                <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.backButton}>
                                    <Text style={styles.backButtonText}>Use a different email</Text>
                                </TouchableOpacity>
                            )}

                            {!otpSent && (
                                <>
                                    <View style={styles.divider}>
                                        <View style={styles.line} />
                                        <Text style={styles.orText}>OR</Text>
                                        <View style={styles.line} />
                                    </View>

                                    <TouchableOpacity
                                        style={styles.socialButton}
                                        onPress={handleGoogleLogin}
                                        disabled={loading}
                                        activeOpacity={0.8}
                                    >
                                        <Image
                                            source={require('../assets/icons/icon_google.png')}
                                            style={styles.socialIconImage}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.socialButtonText}>Continue with Google</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Light grey surface
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden', // Clip blobs
    },
    blob: {
        position: 'absolute',
        borderRadius: 999, // Circle
        opacity: 0.6, // Soft look
    },
    safeArea: {
        flex: 1,
    },
    topSection: {
        flex: 1, // Takes up remaining space above sheet
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 16,
    },
    logoIcon: {
        fontSize: 40,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: 0.5,
    },
    keyboardView: {
        width: '100%',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 10,
        minHeight: height * 0.5, // Occupy at least half screen
    },
    sheetHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: '80%',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        height: 56,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    inputIconImage: {
        width: 20,
        height: 20,
        marginRight: 12,
        // tintColor removed to show original icon colors
    },
    socialIconImage: {
        width: 24,
        height: 24,
        // No tint for Google (allow colors)
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        height: '100%',
    },
    primaryButton: {
        height: 56,
        backgroundColor: '#1F2937',
        borderRadius: 28, // Pill shape
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    backButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 32,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    orText: {
        marginHorizontal: 16,
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        gap: 12,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
});

export default LoginScreen;
