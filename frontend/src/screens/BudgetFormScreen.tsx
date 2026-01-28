import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../context/TransactionContext';
import { useToast } from '../components/Toast';

const BudgetFormScreen = ({ navigation, route }: { navigation: any, route: any }) => {
    const { category, currentLimit } = route.params || {};
    const isEditing = !!category;

    const [name, setName] = useState(category || '');
    const [limit, setLimit] = useState(currentLimit ? currentLimit.toString() : '');

    const { updateBudget } = useTransactions();
    const { showToast } = useToast();

    const handleSave = () => {
        if (!name.trim()) {
            showToast('Please enter a category name', 'error');
            return;
        }
        if (!limit || isNaN(parseFloat(limit))) {
            showToast('Please enter a valid limit', 'error');
            return;
        }

        updateBudget(name, parseFloat(limit));
        showToast(`Budget ${isEditing ? 'updated' : 'added'} successfully`, 'success');
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        <Header
                            title={isEditing ? "Edit Budget" : "New Budget"}
                            showBack={true}
                        />

                        <View style={styles.content}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Category Name</Text>
                                <TextInput
                                    style={[styles.input, isEditing && styles.disabledInput]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Shopping, Gym"
                                    placeholderTextColor="#9CA3AF"
                                    editable={!isEditing}
                                />
                                {isEditing && <Text style={styles.hint}>Category names cannot be changed.</Text>}
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Monthly Limit</Text>
                                <View style={styles.amountInputContainer}>
                                    <Text style={styles.currencySymbol}>₹</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        value={limit}
                                        onChangeText={setLimit}
                                        placeholder="0"
                                        placeholderTextColor="#D1D5DB"
                                        keyboardType="numeric"
                                        autoFocus={!isEditing}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Save Budget</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
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
        flex: 1,
        padding: 24,
    },
    formGroup: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
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
    disabledInput: {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
    },
    hint: {
        marginTop: 8,
        fontSize: 12,
        color: '#9CA3AF',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: '700',
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

export default BudgetFormScreen;
