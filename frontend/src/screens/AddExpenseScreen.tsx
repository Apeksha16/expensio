import React, { useState } from 'react';
import Header from '../components/Header';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';

const { width } = Dimensions.get('window');

const categories = [
    { id: '1', name: 'Food', icon: 'fast-food', color: '#FF7043' },
    { id: '2', name: 'Shopping', icon: 'cart', color: '#E5E7EB' },
    { id: '3', name: 'Transport', icon: 'bus', color: '#E5E7EB' },
    { id: '4', name: 'Stay', icon: 'bed', color: '#E5E7EB' },
    { id: '5', name: 'Activity', icon: 'ticket', color: '#E5E7EB' },
    { id: '6', name: 'Other', icon: 'options', color: '#E5E7EB' },
];

const AddExpenseScreen = ({ navigation }: { navigation: any }) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('1');
    const [date, setDate] = useState(new Date());
    const [openDatePicker, setOpenDatePicker] = useState(false);

    // Helper to format date label
    const getDateLabel = () => {
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Today';
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Add Expense"
                showBack={true}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Amount Output */}
                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Enter Amount</Text>
                    <View style={styles.amountRow}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor="#E5E7EB"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>
                </View>

                {/* Split Options Dropdown Row */}
                <View style={styles.splitRow}>
                    <TouchableOpacity style={styles.dropdownBtn}>
                        <View>
                            <Text style={styles.dropdownLabel}>Paid by</Text>
                            <Text style={styles.dropdownValue}>You</Text>
                        </View>
                        <Icon name="chevron-down" size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dropdownBtn}>
                        <View>
                            <Text style={styles.dropdownLabel}>Split</Text>
                            <Text style={styles.dropdownValue}>Equally</Text>
                        </View>
                        <Icon name="chevron-down" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Category Grid */}
                <Text style={styles.sectionTitle}>Category</Text>
                <View style={styles.categoryGrid}>
                    {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryItem,
                                    isSelected && styles.categoryItemActive
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <View style={[
                                    styles.iconCircle,
                                    { backgroundColor: isSelected ? '#FF7043' : '#F3F4F6' }
                                ]}>
                                    <Icon
                                        name={cat.icon}
                                        size={24}
                                        color={isSelected ? '#fff' : '#9CA3AF'}
                                    />
                                </View>
                                <Text style={[
                                    styles.categoryName,
                                    isSelected && styles.categoryNameActive
                                ]}>{cat.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Note Section */}
                <Text style={styles.sectionTitle}>Note</Text>
                <View style={styles.noteContainer}>
                    <TextInput
                        style={styles.noteInput}
                        placeholder="Add a note... (e.g. Dinner with friends)"
                        placeholderTextColor="#9CA3AF"
                        value={note}
                        onChangeText={setNote}
                    />
                </View>

                {/* Date Picker Button */}
                <View style={{ alignItems: 'center', marginTop: 24 }}>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setOpenDatePicker(true)}
                    >
                        <Icon name="calendar-outline" size={20} color="#1F2937" style={{ marginRight: 8 }} />
                        <Text style={styles.dateButtonText}>{getDateLabel()}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <DatePicker
                modal
                open={openDatePicker}
                date={date}
                mode="date"
                onConfirm={(date) => {
                    setOpenDatePicker(false);
                    setDate(date);
                }}
                onCancel={() => {
                    setOpenDatePicker(false);
                }}
            />

            {/* Bottom Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save Expense</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        padding: 24,
    },
    amountContainer: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 16,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currency: {
        fontSize: 40,
        fontWeight: '700',
        color: '#1F2937',
        marginRight: 8,
    },
    amountInput: {
        fontSize: 40,
        fontWeight: '700',
        color: '#1F2937',
        minWidth: 60,
    },
    splitRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    dropdownBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    dropdownValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    categoryItem: {
        width: (width - 48 - 32) / 3, // 3 columns
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryItemActive: {
        borderColor: '#FF7043',
        backgroundColor: '#fff', // Keep white bg but border
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    categoryNameActive: {
        color: '#1F2937',
        fontWeight: '700',
    },
    noteContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        minHeight: 100, // as per design image
    },
    noteInput: {
        fontSize: 14,
        color: '#1F2937',
        textAlignVertical: 'top',
        height: '100%',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    dateButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    footer: {
        padding: 24,
        backgroundColor: '#F9FAFB',
    },
    saveButton: {
        height: 56,
        backgroundColor: '#1F2937',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default AddExpenseScreen;
