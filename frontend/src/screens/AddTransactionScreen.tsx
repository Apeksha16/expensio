import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
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
import { useTransactions } from '../context/TransactionContext';
import Icon from '@expo/vector-icons/Ionicons';

const AddTransactionScreen = ({ navigation, route }: { navigation: any; route: any }) => {
    const { friendName = 'Friend' } = route.params || {};
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'lent' | 'borrowed'>('lent'); // 'lent' to friend, 'borrowed' from friend

    const { showToast } = useToast();
    const { addTransaction, budgets } = useTransactions();
    const [selectedCategory, setSelectedCategory] = useState('Others');

    const handleSave = () => {
        if (!amount) {
            showToast('Please enter an amount', 'error');
            return;
        }

        addTransaction({
            title: friendName !== 'Friend' ? (type === 'lent' ? `Lent to ${friendName}` : `Borrowed from ${friendName}`) : (note || 'Expense'),
            amount: parseFloat(amount),
            type: type === 'lent' ? 'expense' : 'income', // Treating lent as expense (outflow) contextually for now
            category: selectedCategory, // Use selected category
            note,
        });

        showToast('Transaction Saved', 'success');
        navigation.goBack();
    };

    const getIconName = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return 'fast-food';
            case 'entertainment': return 'film';
            case 'travel': return 'airplane';
            case 'bills': return 'receipt';
            case 'credit card': return 'card';
            case 'others': return 'grid';
            default: return 'wallet';
        }
    };

    const getIconColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return '#F59E0B'; // Amber
            case 'entertainment': return '#EC4899'; // Pink
            case 'travel': return '#3B82F6'; // Blue
            case 'bills': return '#EF4444'; // Red
            case 'credit card': return '#8B5CF6'; // Purple
            default: return '#10B981'; // Green
        }
    };

    return (
        <ScreenWrapper
            title="Add Transaction"
            alignment="center"
            leftAction={
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
            }
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
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
                                Expense / Lent
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
                                Income / Borrowed
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Category Selection (Only if Type is Expense) */}
                    {type === 'lent' && (
                        <View style={styles.categoryContainer}>
                            <Text style={styles.label}>Category</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 20 }}
                                keyboardShouldPersistTaps="handled"
                            >
                                {Object.keys(budgets).map(cat => {
                                    const icon = getIconName(cat);
                                    const color = getIconColor(cat);
                                    const isActive = selectedCategory === cat;

                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            style={styles.categoryItem}
                                            onPress={() => setSelectedCategory(cat)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[
                                                styles.iconCircle,
                                                { backgroundColor: isActive ? color : `${color}15` },
                                                isActive && {
                                                    shadowColor: color,
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 8,
                                                    elevation: 4
                                                }
                                            ]}>
                                                <Icon
                                                    name={icon}
                                                    size={24}
                                                    color={isActive ? '#fff' : color}
                                                />
                                            </View>
                                            <Text style={[
                                                styles.categoryLabel,
                                                isActive && { color: '#1F2937', fontWeight: '700' }
                                            ]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* Friend/Person Display */}
                    {friendName !== 'Friend' && (
                        <View style={styles.personContainer}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitial}>{friendName.charAt(0)}</Text>
                            </View>
                            <Text style={styles.personText}>
                                {type === 'lent' ? `To ${friendName}` : `From ${friendName}`}
                            </Text>
                        </View>
                    )}

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
                        // Removed autoFocus to prevent focus stealing from Note if user taps there
                        />
                    </View>

                    {/* Note Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Note</Text>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Add a note... (e.g. Dinner at Taj)"
                                placeholderTextColor="#9CA3AF"
                                value={note}
                                onChangeText={setNote}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                autoCorrect={false}
                            />
                        </View>
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
        </ScreenWrapper>
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
    categoryContainer: {
        marginBottom: 24,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 20,
        marginBottom: 8,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    textAreaContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 100,
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        textAlignVertical: 'top',
    },
});

export default AddTransactionScreen;
