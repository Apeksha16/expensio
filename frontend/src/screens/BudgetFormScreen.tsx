import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTransactions } from '../context/TransactionContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';

// Suggested budget categories with icons and colors (for add flow)
const BUDGET_CATEGORY_SUGGESTIONS: { name: string; icon: string; color: string }[] = [
    { name: 'Food', icon: 'fast-food', color: '#F59E0B' },
    { name: 'Entertainment', icon: 'film', color: '#EC4899' },
    { name: 'Travel', icon: 'airplane', color: '#3B82F6' },
    { name: 'Bills', icon: 'receipt', color: '#EF4444' },
    { name: 'Credit Card', icon: 'card', color: '#8B5CF6' },
    { name: 'Shopping', icon: 'cart', color: '#10B981' },
    { name: 'Health', icon: 'medkit', color: '#06B6D4' },
    { name: 'Transport', icon: 'car', color: '#F97316' },
    { name: 'Gym', icon: 'barbell', color: '#84CC16' },
];

const BudgetFormScreen = ({ navigation, route }: { navigation: any, route: any }) => {
    const { category, currentLimit } = route.params || {};
    const isEditing = !!category;

    const [name, setName] = useState(category || '');
    const [limit, setLimit] = useState(currentLimit ? currentLimit.toString() : '');
    const [nameError, setNameError] = useState('');
    const [limitError, setLimitError] = useState('');
    const [saving, setSaving] = useState(false);

    const { updateBudget, budgets, totalIncome } = useTransactions();
    const { user } = useUser();
    const { isDarkMode } = useTheme();
    const { showToast } = useToast();

    // Only show suggestions that don't already have a budget (add and edit: chosen = not suggested)
    const existingCategoryNames = Object.keys(budgets).map((c) => c.toLowerCase());
    const availableSuggestions = BUDGET_CATEGORY_SUGGESTIONS.filter(
        (item) => !existingCategoryNames.includes(item.name.toLowerCase())
    );

    // Parse salary/income string (may contain commas e.g. "9,99,005")
    const parseIncomeAmount = (value: string | undefined): number => {
        if (!value) return 0;
        const cleaned = String(value).replace(/,/g, '').replace(/\s/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    // Calculate available income for budget allocation (same rule for add and edit)
    // Available = total income - (sum of OTHER budgets). This budget can use at most that amount.
    const getAvailableIncome = () => {
        // Use salary if available (strip commas for Indian format), else total income from transactions
        const salaryAmount = parseIncomeAmount(user?.salary);
        const monthlyIncome = salaryAmount > 0 ? salaryAmount : totalIncome;
        
        // When editing: sum of all budgets EXCEPT the category we're editing
        // When adding: sum of all existing budgets
        const otherBudgetsTotal = Object.entries(budgets).reduce((sum, [cat, budgetLimit]) => {
            if (isEditing && cat === (category || name.trim())) {
                return sum; // exclude this category's current budget
            }
            return sum + budgetLimit;
        }, 0);
        
        // This budget can use at most: total income - what's already allocated to others
        const available = monthlyIncome - otherBudgetsTotal;
        
        return {
            monthlyIncome,
            totalAllocated: otherBudgetsTotal + (isEditing ? (budgets[category || name.trim()] || 0) : 0),
            available: Math.max(0, Math.min(available, monthlyIncome)), // never exceed total income
            hasIncome: monthlyIncome > 0
        };
    };

    // Validate name
    const validateName = (value: string) => {
        if (!value.trim()) {
            setNameError('Category name is required');
            return false;
        }
        if (value.trim().length < 2) {
            setNameError('Category name must be at least 2 characters');
            return false;
        }
        if (value.trim().length > 50) {
            setNameError('Category name must be less than 50 characters');
            return false;
        }
        setNameError('');
        return true;
    };

    // Validate limit
    const validateLimit = (value: string) => {
        if (!value.trim()) {
            setLimitError('Monthly limit is required');
            return false;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setLimitError('Please enter a valid number');
            return false;
        }
        if (numValue < 0) {
            setLimitError('Limit cannot be negative');
            return false;
        }
        if (numValue === 0) {
            setLimitError('Limit must be greater than 0');
            return false;
        }
        if (numValue > 999999999) {
            setLimitError('Limit is too large');
            return false;
        }
        
        // Check if user has income set
        const { available, monthlyIncome, hasIncome } = getAvailableIncome();
        if (!hasIncome) {
            setLimitError('Please set your monthly income/salary first');
            return false;
        }
        
        // Check if budget exceeds available income
        if (numValue > available) {
            setLimitError(`Limit exceeds available income. Maximum: ₹${available.toLocaleString()}`);
            return false;
        }
        
        setLimitError('');
        return true;
    };

    // Handle name change
    const handleNameChange = (value: string) => {
        setName(value);
        if (nameError) {
            validateName(value);
        }
    };

    // Handle limit change - only allow numeric input
    const handleLimitChange = (value: string) => {
        // Remove any non-numeric characters except decimal point
        const numericValue = value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        const parts = numericValue.split('.');
        const formattedValue = parts.length > 2 
            ? parts[0] + '.' + parts.slice(1).join('')
            : numericValue;
        
        setLimit(formattedValue);
        if (limitError) {
            validateLimit(formattedValue);
        }
    };

    // Check if form is valid (including: limit must not exceed available income)
    const isFormValid = () => {
        const limitNum = parseFloat(limit);
        const { available, hasIncome } = getAvailableIncome();
        const withinIncome = hasIncome && limitNum <= available;
        return name.trim().length >= 2 &&
               limit.trim() !== '' &&
               !isNaN(limitNum) &&
               limitNum > 0 &&
               limitNum <= 999999999 &&
               withinIncome &&
               !nameError &&
               !limitError;
    };

    const handleSave = async () => {
        const isNameValid = validateName(name);
        const isLimitValid = validateLimit(limit);

        if (!isNameValid || !isLimitValid) {
            showToast('Please fix the errors before saving', 'error');
            return;
        }

        setSaving(true);
        try {
            await updateBudget(name.trim(), parseFloat(limit));
            showToast(`Budget ${isEditing ? 'updated' : 'added'} successfully`, 'success');
            navigation.goBack();
        } catch (error: any) {
            showToast(error.message || 'Failed to save budget', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScreenWrapper
            title={isEditing ? "Edit Budget" : "New Budget"}
            showBack={true}
            backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
        >

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.content}>
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>Category Name</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            { 
                                                backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                                                borderColor: nameError 
                                                    ? '#EF4444' 
                                                    : (isDarkMode ? '#374151' : '#E5E7EB'),
                                                color: isDarkMode ? '#F9FAFB' : '#1F2937'
                                            },
                                            isEditing && { 
                                                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                color: isDarkMode ? '#9CA3AF' : '#6B7280'
                                            }
                                        ]}
                                        value={name}
                                        onChangeText={handleNameChange}
                                        onBlur={() => validateName(name)}
                                        placeholder="e.g. Shopping, Gym"
                                        placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                                        editable={!isEditing}
                                    />
                                    {nameError ? (
                                        <Text style={styles.errorText}>{nameError}</Text>
                                    ) : isEditing ? (
                                        <Text style={[styles.hint, { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }]}>Category names cannot be changed.</Text>
                                    ) : null}

                                    {/* Category row - same layout as Add Expense: label "Category", horizontal ScrollView, icon circle + label */}
                                    {!isEditing && (
                                        <View style={styles.categoryContainer}>
                                            <Text style={[styles.categoryRowLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                                                Category
                                            </Text>
                                            {availableSuggestions.length === 0 ? (
                                                <Text style={[styles.suggestionsEmpty, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>
                                                    All suggested categories already have a budget. Type a custom name above.
                                                </Text>
                                            ) : (
                                                <ScrollView
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    contentContainerStyle={{ paddingRight: 20 }}
                                                    keyboardShouldPersistTaps="handled"
                                                >
                                                    {availableSuggestions.map((item) => {
                                                        const isSelected = name.trim().toLowerCase() === item.name.toLowerCase();
                                                        return (
                                                            <TouchableOpacity
                                                                key={item.name}
                                                                style={styles.categoryItem}
                                                                onPress={() => {
                                                                    setName(item.name);
                                                                    setNameError('');
                                                                }}
                                                                activeOpacity={0.8}
                                                            >
                                                                <View style={[
                                                                    styles.iconCircle,
                                                                    {
                                                                        backgroundColor: isSelected ? item.color : (isDarkMode ? '#374151' : `${item.color}15`),
                                                                    },
                                                                    isSelected && {
                                                                        shadowColor: item.color,
                                                                        shadowOffset: { width: 0, height: 4 },
                                                                        shadowOpacity: 0.3,
                                                                        shadowRadius: 8,
                                                                        elevation: 4,
                                                                    }
                                                                ]}>
                                                                    <Icon
                                                                        name={item.icon as any}
                                                                        size={24}
                                                                        color={isSelected ? '#fff' : item.color}
                                                                    />
                                                                </View>
                                                                <Text
                                                                    style={[
                                                                        styles.categoryLabel,
                                                                        isSelected ? { color: isDarkMode ? '#F9FAFB' : '#1F2937', fontWeight: '700' } : { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                                                                    ]}
                                                                    numberOfLines={1}
                                                                >
                                                                    {item.name}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </ScrollView>
                                            )}
                                        </View>
                                    )}
                                </View>

                                <View style={styles.formGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }]}>Monthly Limit</Text>
                                    {(() => {
                                        const { available, monthlyIncome, hasIncome } = getAvailableIncome();
                                        if (!hasIncome) {
                                            return (
                                                <Text style={[styles.availableText, { color: '#EF4444' }]}>
                                                    Set income first
                                                </Text>
                                            );
                                        }
                                        return (
                                            <Text style={[styles.availableText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                                                Available: ₹{available.toLocaleString()} / ₹{monthlyIncome.toLocaleString()}
                                            </Text>
                                        );
                                    })()}
                                </View>
                                <View style={[
                                    styles.amountInputContainer,
                                    { 
                                        borderBottomColor: limitError 
                                            ? '#EF4444' 
                                            : (isDarkMode ? '#374151' : '#E5E7EB')
                                    }
                                ]}>
                                    <Text style={[styles.currencySymbol, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>₹</Text>
                                    <TextInput
                                        style={[styles.amountInput, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}
                                        value={limit}
                                        onChangeText={handleLimitChange}
                                        onBlur={() => validateLimit(limit)}
                                        placeholder="0"
                                        placeholderTextColor={isDarkMode ? '#6B7280' : '#D1D5DB'}
                                        keyboardType="numeric"
                                        autoFocus={!isEditing}
                                    />
                                </View>
                                {limitError && <Text style={styles.errorText}>{limitError}</Text>}
                                {!limitError && (() => {
                                    const { available } = getAvailableIncome();
                                    const limitValue = parseFloat(limit) || 0;
                                    if (limitValue > 0 && limitValue <= available) {
                                        const remaining = available - limitValue;
                                        return (
                                            <Text style={[styles.hint, { color: isDarkMode ? '#22C55E' : '#22C55E' }]}>
                                                ₹{remaining.toLocaleString()} remaining after this budget
                                            </Text>
                                        );
                                    }
                                    return null;
                                })()}
                            </View>
                            </View>
                        </ScrollView>

                        <View style={[styles.footer, { borderTopColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                            <TouchableOpacity 
                                style={[
                                    styles.saveButton, 
                                    { 
                                        backgroundColor: isFormValid() && !saving ? '#8B5CF6' : (isDarkMode ? '#374151' : '#D1D5DB'),
                                        opacity: isFormValid() && !saving ? 1 : 0.6
                                    }
                                ]} 
                                onPress={handleSave}
                                disabled={!isFormValid() || saving}
                            >
                                <Text style={styles.saveButtonText}>
                                    {saving ? 'Saving...' : 'Save Budget'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    content: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    availableText: {
        fontSize: 12,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
    },
    disabledInput: {
        opacity: 0.6,
    },
    hint: {
        marginTop: 8,
        fontSize: 12,
    },
    errorText: {
        marginTop: 8,
        fontSize: 12,
        color: '#EF4444',
    },
    // Match Add Expense category section exactly
    categoryContainer: {
        marginTop: 24,
        marginBottom: 24,
    },
    categoryRowLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    suggestionsEmpty: {
        fontSize: 13,
        paddingVertical: 12,
        paddingHorizontal: 4,
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
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: '700',
    },
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
});

export default BudgetFormScreen;
