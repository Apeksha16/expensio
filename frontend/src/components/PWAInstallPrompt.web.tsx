import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    Modal,
    Dimensions,
} from 'react-native';
import { usePWAInstall } from '../hooks/usePWAInstall.web';

const { width } = Dimensions.get('window');

const PWAInstallPrompt: React.FC = () => {
    const { isInstallable, isInstalled, installApp } = usePWAInstall();
    const [showPrompt, setShowPrompt] = useState(false);
    const [slideAnim] = useState(new Animated.Value(300));
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (isInstallable && !isInstalled) {
            // Show prompt after a delay
            const timer = setTimeout(() => {
                setShowPrompt(true);
                Animated.parallel([
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 7,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, 3000); // Show after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [isInstallable, isInstalled, slideAnim, fadeAnim]);

    const handleInstall = async () => {
        const installed = await installApp();
        if (installed) {
            handleDismiss();
        }
    };

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowPrompt(false);
        });
    };

    if (!showPrompt || isInstalled) {
        return null;
    }

    // iOS instructions
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        return (
            <Modal
                visible={showPrompt}
                transparent
                animationType="none"
                onRequestClose={handleDismiss}
            >
                <Animated.View
                    style={[
                        styles.overlay,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.container,
                            {
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <View style={styles.content}>
                            <Text style={styles.emoji}>📱</Text>
                            <Text style={styles.title}>Install Expensio</Text>
                            <Text style={styles.description}>
                                Add Expensio to your home screen for a better experience!
                            </Text>
                            <View style={styles.instructions}>
                                <Text style={styles.instructionText}>
                                    1. Tap the Share button{' '}
                                    <Text style={styles.icon}>⎋</Text>
                                </Text>
                                <Text style={styles.instructionText}>
                                    2. Select "Add to Home Screen"
                                </Text>
                                <Text style={styles.instructionText}>
                                    3. Tap "Add" to install
                                </Text>
                            </View>
                        </View>
                        <View style={styles.buttons}>
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton]}
                                onPress={handleDismiss}
                            >
                                <Text style={styles.primaryButtonText}>Got it!</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        );
    }

    // Android/Chrome install prompt
    return (
        <Modal
            visible={showPrompt}
            transparent
            animationType="none"
            onRequestClose={handleDismiss}
        >
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.content}>
                        <Text style={styles.emoji}>📱</Text>
                        <Text style={styles.title}>Install Expensio</Text>
                        <Text style={styles.description}>
                            Install Expensio for a faster, more native experience on your device.
                        </Text>
                    </View>
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={handleDismiss}
                        >
                            <Text style={styles.secondaryButtonText}>Not now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleInstall}
                        >
                            <Text style={styles.primaryButtonText}>Install</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    container: {
        width: width,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 16,
    },
    instructions: {
        width: '100%',
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    instructionText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 8,
    },
    icon: {
        fontSize: 18,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#0F172A',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#F1F5F9',
    },
    secondaryButtonText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PWAInstallPrompt;
