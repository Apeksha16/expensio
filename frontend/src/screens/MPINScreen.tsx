import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import { useToast } from '../components/Toast';

const { width } = Dimensions.get('window');

const MPINScreen = ({ navigation }: { navigation: any }) => {
    const [pin, setPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

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
            // Logic to handle completion
            setTimeout(() => {
                if (step === 'enter') {
                    setConfirmPin(pin);
                    setPin('');
                    setStep('confirm');
                } else {
                    if (pin === confirmPin) {
                        // Success with dummy loader
                        setLoading(true);
                        setTimeout(() => {
                            setLoading(false);
                            showToast('MPIN set successfully', 'success');
                            navigation.goBack();
                        }, 2000);
                    } else {
                        // Mismatch
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
                    { borderColor: isFilled ? '#8B5CF6' : '#E5E7EB' }
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
                <Text style={styles.keyText}>{key}</Text>
            ) : (
                key
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Security"
                showBack={true}
            />

            <View style={styles.content}>
                <View style={styles.messageContainer}>
                    <View style={styles.lockIconContainer}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#8B5CF6" />
                        ) : (
                            <Icon name="lock-closed" size={32} color="#8B5CF6" />
                        )}
                    </View>
                    <Text style={styles.title}>
                        {loading ? 'Setting MPIN...' : (step === 'enter' ? 'Set Your MPIN' : 'Confirm Your MPIN')}
                    </Text>
                    <Text style={styles.subtitle}>
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
                        {renderKey(<Icon name="backspace-outline" size={28} color="#1F2937" />, 'backspace')}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
