import React, { useState, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { fetchPublicKey, setMpin } from '../services/auth';
import { encryptData } from '../utils/crypto';

const { width } = Dimensions.get('window');

const MPINScreen = ({ navigation }: { navigation: any }) => {
    const [pin, setPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { isDarkMode } = useTheme();
    const { user } = useUser();
    const [publicKey, setPublicKey] = useState<string | null>(null);

    const themeStyles = {
        container: { backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' },
        text: { color: isDarkMode ? '#F9FAFB' : '#1F2937' },
        subText: { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
        keyText: { color: isDarkMode ? '#F9FAFB' : '#1F2937' },
        dotEmptyBorder: { borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
        lockBg: { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#F3E8FF' },
        backButtonIcon: isDarkMode ? '#fff' : '#1F2937',
    };

    useEffect(() => {
        // Fetch Public Key on mount
        fetchPublicKey().then(setPublicKey).catch(err => {
            console.error('Failed to get public key', err);
            showToast('Security initialization failed. Please try again.', 'error');
        });
    }, []);

    const handlePress = (key: string) => {
        if (loading) return; // Prevent input while loading

        if (key === 'backspace') {
            setPin(prev => prev.slice(0, -1));
            return;
        }

        if (pin.length < 4) {
            setPin(prev => prev + key);
        }
    };

    useEffect(() => {
        if (pin.length === 4) {
            setTimeout(async () => {
                if (step === 'enter') {
                    setConfirmPin(pin);
                    setPin('');
                    setStep('confirm');
                } else {
                    if (pin === confirmPin) {
                        setLoading(true);
                        try {
                            if (!publicKey) throw new Error('Public Key not ready');
                            if (!user?.email) throw new Error('User email not found');

                            const encryptedPin = encryptData(pin, publicKey);
                            await setMpin(user.email, encryptedPin);

                            showToast('MPIN set successfully', 'success');
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('Main' as never);
                            }
                        } catch (error: any) {
                            console.error(error);
                            // Mismatch is handled below, but API errors here
                            showToast(error.message || 'Failed to set MPIN', 'error');
                            setPin('');
                            setStep('enter');
                            setConfirmPin('');
                        } finally {
                            setLoading(false);
                        }
                    } else {
                        showToast('PINs do not match. Try again.', 'error');
                        setPin('');
                        setStep('enter');
                        setConfirmPin('');
                    }
                }
            }, 300);
        }
    }, [pin]);

    const renderDot = (index: number) => {
        const isFilled = index < pin.length;
        return (
            <View
                key={index}
                style={[
                    styles.dot,
                    isFilled && styles.dotFilled,
                    { borderColor: isFilled ? '#8B5CF6' : (isDarkMode ? '#374151' : '#E5E7EB') }
                ]}
            />
        );
    };

    const renderKey = (key: string | React.ReactNode, value: string) => (
        <TouchableOpacity
            style={styles.key}
            onPress={() => handlePress(value)}
            activeOpacity={0.7}
        >
            {typeof key === 'string' ? (
                <Text style={[styles.keyText, themeStyles.keyText]}>{key}</Text>
            ) : (
                key
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper
            title={<Text style={[styles.headerTitle, themeStyles.text]}>Security</Text>}
            showBack={true}
            backgroundColor={themeStyles.container.backgroundColor}
        >

            <View style={styles.content}>
                <View style={styles.messageContainer}>
                    <View style={[styles.lockIconContainer, themeStyles.lockBg]}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#8B5CF6" />
                        ) : (
                            <Icon name="lock-closed" size={32} color="#8B5CF6" />
                        )}
                    </View>
                    <Text style={[styles.title, themeStyles.text]}>
                        {loading ? 'Setting MPIN...' : (step === 'enter' ? 'Set Your MPIN' : 'Confirm Your MPIN')}
                    </Text>
                    <Text style={[styles.subtitle, themeStyles.subText]}>
                        {loading
                            ? 'Please wait while we secure your account.'
                            : (step === 'enter'
                                ? 'Enter a 4-digit PIN to secure your account'
                                : 'Re-enter your 4-digit PIN to confirm')
                        }
                    </Text>
                </View>

                {/* PIN Dots */}
                <View style={styles.dotsContainer}>
                    {[0, 1, 2, 3].map(renderDot)}
                </View>

                <View style={{ flex: 1 }} />

                {/* Keypad */}
                <View style={styles.keypad}>
                    <View style={styles.keyRow}>
                        {renderKey('1', '1')}
                        {renderKey('2', '2')}
                        {renderKey('3', '3')}
                    </View>
                    <View style={styles.keyRow}>
                        {renderKey('4', '4')}
                        {renderKey('5', '5')}
                        {renderKey('6', '6')}
                    </View>
                    <View style={styles.keyRow}>
                        {renderKey('7', '7')}
                        {renderKey('8', '8')}
                        {renderKey('9', '9')}
                    </View>
                    <View style={styles.keyRow}>
                        <View style={styles.key} />
                        {renderKey('0', '0')}
                        {renderKey(<Icon name="backspace-outline" size={28} color={themeStyles.text.color} />, 'backspace')}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    messageContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    lockIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 40,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    keypad: {
        width: '100%',
        maxWidth: 320,
        gap: 24,
    },
    keyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    key: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#fff', // Optional: if we want button look, but normally keypad is clean
    },
    keyText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1F2937',
    },
});

export default MPINScreen;
