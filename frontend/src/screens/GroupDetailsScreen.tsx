import React from 'react';
import Header from '../components/Header';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';

const EXPENSES = [
    { id: '1', title: 'Dinner', amount: '₹2,500', paidBy: 'You', date: '20 Apr', icon: 'fast-food' },
    { id: '2', title: 'Cab to Hotel', amount: '₹800', paidBy: 'Rahul', date: '20 Apr', icon: 'car' },
    { id: '3', title: 'Booze', amount: '₹4,000', paidBy: 'Amit', date: '19 Apr', icon: 'beer' },
];

const GroupDetailsScreen = ({ navigation }: { navigation: any }) => {
    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Goa Trip"
                showBack={true}
                showBack={true}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Dark Card Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>Your Total Share</Text>
                    <Text style={styles.cardAmount}>₹4,500</Text>

                    <View style={styles.breakdownRow}>
                        <View style={styles.breakdownItem}>
                            <Text style={styles.breakdownLabel}>Paid</Text>
                            <Text style={[styles.breakdownValue, { color: '#4CAF50' }]}>₹2,500</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.breakdownItem}>
                            <Text style={styles.breakdownLabel}>Owe</Text>
                            <Text style={[styles.breakdownValue, { color: '#FF7043' }]}>₹2,000</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.breakdownItem}>
                            <Text style={styles.breakdownLabel}>Owed</Text>
                            <Text style={[styles.breakdownValue, { color: '#8B5CF6' }]}>₹0</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Expenses</Text>

                {/* Expenses List */}
                <View>
                    {EXPENSES.map((item) => (
                        <View key={item.id} style={styles.expenseItem}>
                            <View style={styles.iconContainer}>
                                <Icon name={item.icon} size={24} color="#FF7043" />
                            </View>
                            <View style={styles.expenseInfo}>
                                <Text style={styles.expenseTitle}>{item.title}</Text>
                                <Text style={styles.expenseSubtitle}>Paid by {item.paidBy} • {item.date}</Text>
                            </View>
                            <Text style={styles.expenseAmount}>{item.amount}</Text>
                        </View>
                    ))}
                </View>

                {/* Add Expense Button for Group */}
                <TouchableOpacity
                    style={styles.addExpenseButton}
                    onPress={() => navigation.navigate('AddExpense')}
                >
                    <Icon name="add" size={24} color="#fff" />
                    <Text style={styles.addExpenseText}>Add Group Expense</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
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
        marginBottom: 16,
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
    settingsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    summaryCard: {
        backgroundColor: '#1E1B2E', // Dark card
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 8,
    },
    cardAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 24,
    },
    breakdownRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
    },
    breakdownItem: {
        alignItems: 'center',
        flex: 1,
    },
    breakdownLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    breakdownValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    expenseSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    addExpenseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF7043',
        padding: 16,
        borderRadius: 32,
        marginTop: 16,
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addExpenseText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
});

export default GroupDetailsScreen;
