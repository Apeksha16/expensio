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
    ActivityIndicator,
} from 'react-native';
import { useToast } from '../components/Toast';
import { useTransactions } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import Icon from '@expo/vector-icons/Ionicons';

const AddTransactionScreen = ({ navigation, route }: { navigation: any; route: any }) => {
    const { friendName = 'Friend', date: dateParam } = route.params || {};
    const { addTransaction, budgets, loading, selectedDate } = useTransactions();
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const { isDarkMode } = useTheme();

    // Determine initial date: Route param > Context Selected Date > Today
    const initialDate = dateParam ? new Date(dateParam) : (selectedDate ? new Date(selectedDate) : new Date());

    // State for the transaction date
    const [transactionDate, setTransactionDate] = useState(initialDate);

    const isToday = (d: Date) => {
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const handleSetToday = () => {
        setTransactionDate(new Date());
    };

    const { showToast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState('');

    const formatAmount = (value: string) => {
        // Remove non-numeric chars
        const number = value.replace(/[^0-9]/g, '');
        // Format with commas (Indian numbering system could be used, but standard for now)
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleAmountChange = (text: string) => {
        setAmount(formatAmount(text));
    };

    const handleNoteChange = (text: string) => {
        // Allow only alphanumeric and spaces
        const filtered = text.replace(/[^a-zA-Z0-9 ]/g, '');
        setNote(filtered);
    };

    const handleSave = async () => {
        if (!amount) {
            showToast('Please enter an amount', 'error');
            return;
        }
        if (!selectedCategory) {
            showToast('Please select a category', 'error');
            return;
        }
        if (!note.trim()) {
            showToast('Please enter a note', 'error');
            return;
        }

        // Strip commas for parsing
        const cleanAmount = parseFloat(amount.replace(/,/g, ''));

        // Use current TIME for the chosen date to avoid sorting issues with 00:00:00
        const finalDate = new Date(transactionDate);
        const now = new Date();
        // If it's today, keep current time. If it's past date, maybe use current time too to keep order?
        // User didn't specify, but "picking current date" usually implies preserving time.
        // Let's safe-guard by using current time component.
        finalDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        await addTransaction({
            title: note, // Note acts as title/label
            amount: cleanAmount,
            type: 'expense', // Default to expense as requested
            category: selectedCategory,
            note: note,
            date: finalDate,
        } as any);

        showToast('Expense Saved', 'success');
        navigation.goBack();
    };

    const getIconName = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return 'fast-food';
            case 'entertainment': return 'film';
            case 'travel': return 'airplane';
            case 'bills': return 'receipt';
            case 'credit card': return 'card';
            case 'shopping': return 'cart';
            case 'health': return 'medkit';
            case 'transport': return 'car';
            case 'gym': return 'barbell';
            case 'others': return 'grid';
            default: return 'wallet';
        }
    };

    const getIconColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return '#F59E0B';
            case 'entertainment': return '#EC4899';
            case 'travel': return '#3B82F6';
            case 'bills': return '#EF4444';
            case 'credit card': return '#8B5CF6';
            case 'shopping': return '#10B981';
            case 'health': return '#06B6D4';
            case 'transport': return '#F97316';
            case 'gym': return '#84CC16';
            case 'others': return '#6366F1';
            default: return '#10B981';
        }
    };

    const textColor = isDarkMode ? '#F9FAFB' : '#1F2937';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const inputBg = isDarkMode ? '#1F2937' : '#fff'; // Transparent/matches bg usually, or specific input bg
    const inputBorder = isDarkMode ? '#374151' : '#E5E7EB';
    const containerBg = isDarkMode ? '#111827' : '#fff';

    return (
        <ScreenWrapper
            title="Add Expense"
            alignment="center"
            backgroundColor={containerBg}
            leftAction={
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, isDarkMode && { backgroundColor: '#374151' }]}>
                    <Icon name="close" size={24} color={textColor} />
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
                    {/* Date Display / Toggle */}
                    {!isToday(transactionDate) && (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24, alignItems: 'center' }}>
                            <Text style={{ color: subTextColor, marginRight: 8 }}>
                                Date: <Text style={{ color: textColor, fontWeight: '700' }}>{transactionDate.toLocaleDateString()}</Text>
                            </Text>
                            <TouchableOpacity onPress={handleSetToday} style={{ backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Set to Today</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Amount Input (Top) */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: textColor }]}>₹</Text>
                        <TextInput
                            style={[
                                styles.amountInput,
                                { color: textColor },
                                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                            ]}
                            placeholder="0"
                            placeholderTextColor={isDarkMode ? '#4B5563' : '#D1D5DB'}
                            keyboardType="number-pad"
                            maxLength={10}
                            value={amount}
                            onChangeText={handleAmountChange}
                            autoFocus
                        />
                    </View>

                    {/* Note Input (Label) - Below Amount */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Note</Text>
                        <View style={[styles.textAreaContainer, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB', borderColor: inputBorder }]}>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    { color: textColor },
                                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                                ]}
                                placeholder="Add a note... (e.g. Dinner at Taj)"
                                placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                                value={note}
                                onChangeText={handleNoteChange}
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Category Selection - Below Note */}
                    <View style={styles.categoryContainer}>
                        <Text style={[styles.label, { color: subTextColor }]}>Category</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingRight: 20 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {(() => {
                                const categories = Object.keys(budgets);
                                if (!categories.includes('Others')) {
                                    categories.push('Others');
                                }
                                return categories.map(cat => {
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
                                                { backgroundColor: isActive ? color : (isDarkMode ? '#374151' : `${color}15`) },
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
                                                isActive && { color: textColor, fontWeight: '700' },
                                                !isActive && { color: subTextColor }
                                            ]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            })()}
                        </ScrollView>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={[styles.footer, { borderTopColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            loading && { opacity: 0.7 },
                            { backgroundColor: isDarkMode ? '#374151' : '#1F2937' }
                        ]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Expense</Text>
                        )}
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
        alignItems: 'center', // Center icon if bg is applied
        borderRadius: 20, // Make it touchable area round if partial bg applied
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
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        minWidth: 100,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
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
    },
    // Date Selector removed
    footer: {
        padding: 24,
        borderTopWidth: 1,
    },
    saveButton: {
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
        fontWeight: '500',
    },
    textAreaContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        textAlignVertical: 'top',
    },
});

export default AddTransactionScreen;
