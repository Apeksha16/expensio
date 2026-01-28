import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProps {
    message: string;
    type: ToastType;
    visible: boolean;
    onHide: () => void;
}

const { width } = Dimensions.get('window');

const ToastMessage: React.FC<ToastProps> = ({ message, type, visible, onHide }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#10B981'; // Green
            case 'error': return '#EF4444';   // Red
            case 'warning': return '#F59E0B'; // Amber
            case 'info': return '#3B82F6';    // Blue
            default: return '#1F2937';        // Dark Gray
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'warning';
            case 'info': return 'information-circle';
            default: return 'information-circle';
        }
    };

    return (
        <SafeAreaInsetsContext.Consumer>
            {(insets) => (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            top: (insets?.top || 0) + 10,
                            backgroundColor: getBackgroundColor(),
                            transform: [{ translateY }],
                            opacity,
                        },
                    ]}
                >
                    <Icon name={getIcon()} size={24} color="#fff" />
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity onPress={onHide}>
                        <Icon name="close" size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </SafeAreaInsetsContext.Consumer>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string, t: ToastType = 'info', duration = 3000) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setMessage(msg);
        setType(t);
        setVisible(true);

        timerRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, []);

    const hideToast = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <ToastMessage
                message={message}
                type={type}
                visible={visible}
                onHide={hideToast}
            />
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 9999,
    },
    message: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        marginLeft: 12,
        marginRight: 12,
    },
});

export default ToastProvider;
