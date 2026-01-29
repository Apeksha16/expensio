
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
    ImageBackground,
    ScrollView,
} from 'react-native';
import { useToast } from '../components/Toast';
import Icon from '@expo/vector-icons/Ionicons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { sendOtp, verifyOtp, googleLogin, getUserProfile } from '../services/auth';
import loginBackground from '../assets/login/login_background.png';
import emailIcon from '../assets/icons/icon_email.png';

const { width, height } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
    onLoginSuccess: (user: any) => void;
}

const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '820921044814-8fdnvo1193aki6t29kv5lpcdfffr8g6j.apps.googleusercontent.com',
        iosClientId: '820921044814-tmgitqep6hp6qd44qrn1i3sh1790osov.apps.googleusercontent.com',
        webClientId: '820921044814-8fdnvo1193aki6t29kv5lpcdfffr8g6j.apps.googleusercontent.com',
    });

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current; // Start from further down
    const blob1Anim = useRef(new Animated.Value(0)).current;
    const blob2Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleBackendLogin(id_token);
        } else if (response?.type === 'error') {
            Alert.alert('Login Failed', 'Google Sign-In could not be completed.');
        }
    }, [response]);

    const handleBackendLogin = async (idToken: string) => {
        try {
            setLoading(true);
            const data = await googleLogin(idToken) as { user?: { email?: string } };

            // Fetch full profile from Firestore as requested
            let userProfile = data.user;
            if (data.user && data.user.email) {
                try {
                    const profile = await getUserProfile(data.user.email);
                    userProfile = { ...userProfile, ...profile };
                } catch (e) {
                    console.error('Failed to fetch realtime profile, using basic info', e);
                }
            }

            showToast('Welcome back!', 'success');
            setTimeout(() => {
                onLoginSuccess(userProfile || { email: 'Google User' });
            }, 500);
        } catch (error) {
            console.error('Google Login Error:', error);
            Alert.alert('Login Failed', 'Google authentication failed on server.');
        } finally {
            setLoading(false);
        }
    }

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
            promptAsync();
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Login Failed', 'Google Sign-In could not be initiated.');
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
            const data = await verifyOtp(email, otp) as { token?: string };
            if (data && data.token) {
                showToast('Welcome back!', 'success');
                setTimeout(() => {
                    onLoginSuccess({ email });
                }, 500);
            } else {
                throw new Error('No token received');
            }
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
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ImageBackground
                source={loginBackground}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Top Section: Logo & Brand */}
                    <View style={styles.topSection}>
                        <Animated.View style={[styles.logoContainer, { transform: [{ scale: 1 }] }]}>
                            <Text style={styles.logoIcon}>💰</Text>
                        </Animated.View>
                        <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                            <Text style={styles.appName}>Expensio</Text>
                            <Text style={styles.description}>Master your finances with style.</Text>
                        </Animated.View>
                    </View>
                </SafeAreaView>

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
                    {/* Brand Logo Floating Top (Hidden or Duplicate? Keeping for safety of user intent, but might overlap) */}
                    {/* Actually, user had two safe areas overlapping? I'll keep the structure but ensure zIndex if needed */}

                    {/* Bottom Sheet */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.keyboardView}
                        keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
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
                                        source={emailIcon}
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

                                {!otpSent && (
                                    <>
                                        <View style={styles.divider}>
                                            <View style={styles.line} />
                                            <Text style={styles.orText}>OR</Text>
                                            <View style={styles.line} />
                                        </View>

                                        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin} disabled={loading} activeOpacity={0.8}>
                                            <Icon name="logo-google" size={24} color="#1F2937" />
                                            <Text style={styles.socialButtonText}>Continue with Google</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {otpSent && (
                                    <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.backButton}>
                                        <Text style={styles.backButtonText}>Use a different email</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </ImageBackground>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    backgroundImage: {
        flex: 1,
        width: width,
        height: height,
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.6,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    topSection: {
        flex: 1,
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
    appName: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    brandName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: 0.5,
    },
    keyboardView: {
        width: '100%',
        position: 'absolute',
        bottom: 0,
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
        minHeight: height * 0.5,
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
        borderRadius: 28,
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
