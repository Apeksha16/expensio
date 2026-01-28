import React, { useState } from 'react';
import Header from '../components/Header';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useToast } from '../components/Toast';
import { useSubscriptions } from '../context/SubscriptionContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';

const AddSubscriptionScreen = ({ navigation }: { navigation: any }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<'Monthly' | 'Yearly'>('Monthly');
    const { addSubscription } = useSubscriptions();
    const { showToast } = useToast();

    const handleSave = () => {
        if (!name || !amount) {
            showToast('Please enter name and amount', 'error');
            return;
        }

        addSubscription({
            name,
            amount: parseFloat(amount),
            frequency,
            nextBillDate: new Date(), // simulating next bill is today/soon
            icon: 'card-outline', // default icon
            color: getRandomColor(),
        });

        showToast('Subscription Added', 'success');
        navigation.goBack();
    };

    const getRandomColor = () => {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Add Subscription"
                showBack={true}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Service Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Netflix, Spotify, etc."
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="499"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    {/* Frequency Toggle */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Billing Cycle</Text>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    frequency === 'Monthly' && styles.toggleButtonActive,
                                ]}
                                onPress={() => setFrequency('Monthly')}
                            >
                                <Text
                                    style={[
                                        styles.toggleText,
                                        frequency === 'Monthly' && styles.toggleTextActive,
                                    ]}
                                >
                                    Monthly
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    frequency === 'Yearly' && styles.toggleButtonActive,
                                ]}
                                onPress={() => setFrequency('Yearly')}
                            >
                                <Text
                                    style={[
                                        styles.toggleText,
                                        frequency === 'Yearly' && styles.toggleTextActive,
                                    ]}
                                >
                                    Yearly
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Subscription</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1F2937',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    toggleButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#1F2937',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default AddSubscriptionScreen;
