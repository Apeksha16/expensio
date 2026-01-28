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
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const AddTransactionScreen = ({ navigation, route }: { navigation: any; route: any }) => {
    const { friendName = 'Friend' } = route.params || {};
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'lent' | 'borrowed'>('lent'); // 'lent' to friend, 'borrowed' from friend
    const { showToast } = useToast();

    const handleSave = () => {
        // Implement save logic here
        console.log(`Saved: You ${type} ${amount} to/from ${friendName}`);
        showToast('Transaction Saved', 'success');
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <Header
                    title="Add Transaction"
                    alignment="center"
                    leftAction={
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Icon name="close" size={24} color="#1F2937" />
                        </TouchableOpacity>
                    }
                />

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Toggle Switch */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                type === 'lent' && styles.toggleButtonActive,
                                type === 'lent' && { backgroundColor: '#DCFCE7' }, // Green bg for Lent
                            ]}
                            onPress={() => setType('lent')}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    type === 'lent' && { color: '#166534' }, // Dark green text
                                ]}
                            >
                                You Lent
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                type === 'borrowed' && styles.toggleButtonActive,
                                type === 'borrowed' && { backgroundColor: '#FEE2E2' }, // Red bg for Borrowed
                            ]}
                            onPress={() => setType('borrowed')}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    type === 'borrowed' && { color: '#991B1B' }, // Dark red text
                                ]}
                            >
                                You Borrowed
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Friend/Person Display */}
                    <View style={styles.personContainer}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarInitial}>{friendName.charAt(0)}</Text>
                        </View>
                        <Text style={styles.personText}>
                            {type === 'lent' ? `To ${friendName}` : `From ${friendName}`}
                        </Text>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor="#D1D5DB"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>

                    {/* Note Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Note</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What is this for?"
                            placeholderTextColor="#9CA3AF"
                            value={note}
                            onChangeText={setNote}
                        />
                    </View>

                    {/* Quick Access / Date (Visual Only for now) */}
                    <TouchableOpacity style={styles.dateSelector}>
                        <Icon name="calendar-outline" size={20} color="#6B7280" />
                        <Text style={styles.dateText}>Today</Text>
                    </TouchableOpacity>

                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Transaction</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        padding: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
        marginBottom: 32,
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
    personContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarInitial: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    personText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        color: '#1F2937',
        minWidth: 100,
        textAlign: 'center',
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
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    dateText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
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

export default AddTransactionScreen;
