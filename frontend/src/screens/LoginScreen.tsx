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
    Dimensions,
    ImageBackground,
    SafeAreaView,
    StatusBar,
    Animated,
    Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

    // Animation Values (Stable initialization)
    const fadeAnim = React.useMemo(() => new Animated.Value(0), []);
    const slideAnim = React.useMemo(() => new Animated.Value(30), []);
    const scaleAnim = React.useMemo(() => new Animated.Value(1), []);

    useEffect(() => {
        if (!fadeAnim || !slideAnim || !scaleAnim) return;

        // Entrance Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                delay: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                delay: 200,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
        ]).start();

        // Breathing Animation for Logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 3000,
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
            if (data && data.token) {
                onLoginSuccess({ email });
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ImageBackground
                source={require('../assets/login/login_background.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Top Section: Logo & Brand */}
                    <View style={styles.topSection}>
                        <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
                            <Text style={styles.logoIcon}>💰</Text>
                        </Animated.View>
                        <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                            <Text style={styles.appName}>Expensio</Text>
                            <Text style={styles.description}>Master your finances with style.</Text>
                        </Animated.View>
                    </View>
                </SafeAreaView>

                {/* Bottom Sheet Section */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.bottomSheet}
                >
                    {/* Glass Effect Background */}
                    <LinearGradient
                        colors={['rgba(15, 23, 42, 0.85)', 'rgba(15, 23, 42, 0.95)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.glassBorder} />

                    <View style={styles.formContent}>
                        <Text style={styles.welcomeText}>
                            {otpSent ? 'Enter Code' : 'Welcome Back'}
                        </Text>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputContainer}>
                                <View style={styles.iconContainer}>
                                    <Icon
                                        name={otpSent ? 'lock-closed-outline' : 'mail-outline'}
                                        size={22}
                                        color="#E2E8F0"
                                    />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder={otpSent ? '000000' : 'name@example.com'}
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    keyboardType={otpSent ? 'number-pad' : 'email-address'}
                                    autoCapitalize="none"
                                    value={otpSent ? otp : email}
                                    onChangeText={otpSent ? setOtp : setEmail}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#F97316', '#EA580C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>
                                            {otpSent ? 'Verify Access' : 'Continue'}
                                        </Text>
                                        <Icon name="arrow-forward" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {otpSent && (
                            <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.secondaryAction}>
                                <Text style={styles.secondaryActionText}>Change Email</Text>
                            </TouchableOpacity>
                        )}

                        {!otpSent && (
                            <>
                                <View style={styles.divider}>
                                    <View style={styles.line} />
                                    <Text style={styles.orText}>OR</Text>
                                    <View style={styles.line} />
                                </View>

                                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin} disabled={loading} activeOpacity={0.8}>
                                    <Icon name="logo-google" size={22} color="#fff" />
                                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>

            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    backgroundImage: {
        flex: 1,
        width: width,
        height: height,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    topSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: height * 0.3, // Push content up above the sheet
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
    },
    logoIcon: {
        fontSize: 50,
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
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        paddingHorizontal: 32,
        paddingTop: 40,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    glassBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    formContent: {
        width: '100%',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 24,
        textAlign: 'center',
        opacity: 0.9,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 30,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#fff',
        paddingRight: 20,
        height: '100%',
    },
    primaryButton: {
        height: 60,
        borderRadius: 30,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        gap: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    secondaryAction: {
        marginTop: 20,
        alignItems: 'center',
    },
    secondaryActionText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    orText: {
        marginHorizontal: 16,
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        gap: 12,
    },
    inputIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    actionIcon: {
        width: 18,
        height: 18,
        resizeMode: 'contain',
    },
    socialIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default LoginScreen;
