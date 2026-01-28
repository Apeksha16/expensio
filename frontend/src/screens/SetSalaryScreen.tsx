import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { updateUserSalary } from '../services/auth';

import { useUser } from '../context/UserContext';

const SetSalaryScreen = ({ navigation, route }: { navigation: any, route: any }) => {
    const { isDarkMode } = useTheme();
    const { user, updateUser } = useUser();
    const [salary, setSalary] = useState(user?.salary || '');
    const [loading, setLoading] = useState(false);

    const themeStyles = {
        container: { backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' },
        text: { color: isDarkMode ? '#F9FAFB' : '#1F2937' },
        subText: { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
        input: {
            color: isDarkMode ? '#F9FAFB' : '#1F2937',
            backgroundColor: isDarkMode ? '#374151' : '#fff'
        },
        button: { backgroundColor: '#8B5CF6' }, // Violet for premium feel
    };

    const formatSalary = (value: string) => {
        // Remove non-digits
        const cleaned = value.replace(/\D/g, '');
        // Format with Indian Number System (e.g. 10,00,000)
        let x = cleaned;
        if (x.length <= 3) return x;

        let lastThree = x.substring(x.length - 3);
        let otherNumbers = x.substring(0, x.length - 3);
        if (otherNumbers !== '')
            lastThree = ',' + lastThree;

        return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    };

    const handleChangeText = (text: string) => {
        setSalary(formatSalary(text));
    };

    const handleSave = async () => {
        if (!salary) {
            Platform.OS === 'web' ? alert('Please enter a valid salary.') : Alert.alert('Error', 'Please enter a valid salary.');
            return;
        }

        setLoading(true);
        try {
            const userEmail = user?.email;

            if (!userEmail) {
                Platform.OS === 'web' ? alert('User email not found. Please log in again.') : Alert.alert('Error', 'User email not found. Please log in again.');
                return;
            }

            // Update backend
            await updateUserSalary(userEmail, salary);

            // Update global state
            await updateUser({ salary });

            if (Platform.OS === 'web') {
                setTimeout(() => {
                    alert('Salary updated successfully!');
                    navigation.goBack();
                }, 100);
            } else {
                Alert.alert('Success', 'Salary updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            }
        } catch (error) {
            console.error(error);
            Platform.OS === 'web' ? alert('Failed to update salary.') : Alert.alert('Error', 'Failed to update salary.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, themeStyles.text]}>Set Monthly Salary</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Icon name="wallet-outline" size={64} color="#8B5CF6" />
                    </View>

                    <Text style={[styles.label, themeStyles.subText]}>
                        What is your monthly income?
                    </Text>

                    <View style={[styles.inputContainer, { borderColor: isDarkMode ? '#4B5563' : '#E5E7EB' }]}>
                        <Text style={[styles.currencySymbol, themeStyles.text]}>₹</Text>
                        <TextInput
                            style={[styles.input, themeStyles.text]}
                            placeholder="0"
                            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                            keyboardType="numeric"
                            value={salary}
                            onChangeText={handleChangeText}
                            autoFocus
                            numberOfLines={1}
                        />
                    </View>

                    <Text style={[styles.hint, themeStyles.subText]}>
                        This helps us calculate your savings and goals accurately.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, themeStyles.button, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Salary</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        alignItems: 'center',
        paddingTop: 48,
    },
    iconContainer: {
        marginBottom: 32,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        paddingBottom: 8,
        width: '100%',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 40,
        fontWeight: '700',
        marginRight: 8,
    },
    input: {
        fontSize: 40,
        fontWeight: '700',
        minWidth: 100,
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        marginTop: 32,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        padding: 24,
    },
    saveButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#8B5CF6",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    }
});

export default SetSalaryScreen;
