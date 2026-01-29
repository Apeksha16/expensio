import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../context/ThemeContext';

export interface HeaderProps {
    title?: string | React.ReactNode;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    style?: ViewStyle;
    onBackPress?: () => void;
    alignment?: 'center' | 'left';
    leftAction?: React.ReactNode;
    leftStyle?: ViewStyle;
}

const Header: React.FC<HeaderProps> = ({
    title,
    showBack = false,
    rightAction,
    style,
    onBackPress,
    alignment = 'center',
    leftAction,
    leftStyle
}) => {
    const navigation = useNavigation();
    const { isDarkMode } = useTheme();

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                // Fallback for web refresh or deep linking
                navigation.navigate('Main' as never);
            }
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.leftContainer, leftStyle]}>
                {showBack ? (
                    <TouchableOpacity onPress={handleBack} style={[styles.backButton, isDarkMode && { backgroundColor: '#374151' }]}>
                        <Icon name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1F2937'} />
                    </TouchableOpacity>
                ) : (
                    leftAction
                )}
            </View>

            <View style={[styles.titleContainer, alignment === 'left' && styles.titleLeft]}>
                {typeof title === 'string' ? (
                    <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#1F2937' }]}>{title}</Text>
                ) : (
                    title
                )}
            </View>

            <View style={styles.rightContainer}>
                {rightAction}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'transparent', // Can be standard or transparent
        height: 60, // Fixed height for consistency
    },
    leftContainer: {
        width: 48,
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleLeft: {
        alignItems: 'flex-start',
        paddingLeft: 0,
    },
    rightContainer: {
        width: 48,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        // Optional shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
});

export default Header;
