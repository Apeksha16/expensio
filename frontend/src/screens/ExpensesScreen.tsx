import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { useTransactions } from '../context/TransactionContext';

const { width } = Dimensions.get('window');

const ExpensesScreen = ({ navigation }: { navigation: any }) => {
    const [selectedDate, setSelectedDate] = useState(24);
    const { transactions: rawTransactions, totalIncome, totalExpense, budgets, getCategorySpend } = useTransactions();

    // Mock Calendar Data
    const checkInOutData = [
        { day: 'Mon', date: 21 },
        { day: 'Tue', date: 22 },
        { day: 'Wed', date: 23 },
        { day: 'Thu', date: 24 },
        { day: 'Fri', date: 25 },
        { day: 'Sat', date: 26 },
    ];

    const transactions = rawTransactions.map(t => {
        const category = t.category || 'Others';
        const spend = getCategorySpend(category); // Total spend for this category in current month
        const budget = budgets[category] || 0;
        const percent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;

        return {
            id: t.id,
            icon: t.type === 'income' ? 'wallet-outline' : 'cart-outline',
            title: t.title,
            subtitle: category,
            date: t.date.toLocaleDateString(),
            amount: `₹${t.amount}`,
            budget: `₹${budget}`,
            spendDisplay: `₹${spend}`,
            percentVal: percent,
            percent: `${Math.round(percent)}%`,
            type: t.type
        };
    });

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Expenses"
                rightAction={
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate('BudgetSettings')}
                    >
                        <Icon name="settings-outline" size={24} color="#1F2937" />
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Calendar Card */}
                <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                        <Icon name="chevron-back" size={20} color="#1F2937" />
                        <Text style={styles.monthTitle}>April 2022</Text>
                        <Icon name="chevron-forward" size={20} color="#1F2937" />
                    </View>
                    <View style={styles.daysRow}>
                        {checkInOutData.map((item) => {
                            const isSelected = item.date === selectedDate;
                            return (
                                <TouchableOpacity
                                    key={item.date}
                                    style={styles.dayItem}
                                    onPress={() => setSelectedDate(item.date)}
                                >
                                    <Text style={styles.dayLabel}>{item.day}</Text>
                                    <View style={[styles.dateContainer, isSelected && styles.dateContainerActive]}>
                                        <Text style={[styles.dateLabel, isSelected && styles.dateLabelActive]}>{item.date}</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>

                {/* Summary Horizontal Scroll (Salary vs Expense) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
                    {/* Total Salary Card */}
                    <View style={[styles.summaryCard, { backgroundColor: '#8B5CF6', marginRight: 16 }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardLabel}>Total Income</Text>
                            <Icon name="ellipsis-vertical" size={16} color="#fff" style={{ opacity: 0.7 }} />
                        </View>
                        <Text style={styles.cardAmount}>₹{totalIncome.toLocaleString()}</Text>
                        {/* Mock wifi symbol / decoration */}
                        <View style={styles.cardFooter}>
                            <Icon name="card-outline" size={24} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.bankText}>Bank Account</Text>
                        </View>
                        <Icon name="wifi" size={100} color="rgba(255,255,255,0.1)" style={styles.bgIcon} />
                    </View>

                    {/* Total Expense Card */}
                    <View style={[styles.summaryCard, { backgroundColor: '#FF7043' }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardLabel}>Total Expense</Text>
                            <Icon name="ellipsis-vertical" size={16} color="#fff" style={{ opacity: 0.7 }} />
                        </View>
                        <Text style={styles.cardAmount}>₹{totalExpense.toLocaleString()}</Text>
                        <View style={styles.cardFooter}>
                            <Icon name="card-outline" size={24} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.bankText}>Bank Account</Text>
                        </View>
                        <Icon name="wifi" size={100} color="rgba(255,255,255,0.1)" style={styles.bgIcon} />
                    </View>
                </ScrollView>

                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>Expenses</Text>
                    {transactions.length > 0 && (
                        <TouchableOpacity onPress={() => navigation.navigate('TotalExpense')}>
                            <Text style={styles.viewAll}>View All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Expenses List */}
                <View>
                    {transactions.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Icon name="receipt-outline" size={40} color="#FF7043" />
                            </View>
                            <Text style={styles.emptyTitle}>No Expenses Yet</Text>
                            <Text style={styles.emptySubtitle}>Track your daily spending here.</Text>
                            <TouchableOpacity
                                style={styles.addExpenseButton}
                                onPress={() => navigation.navigate('AddTransaction')}
                            >
                                <Text style={styles.addExpenseButtonText}>Add Expense</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        transactions.map(item => (
                            <View key={item.id} style={styles.transactionCard}>
                                <View style={styles.transHeader}>
                                    <View style={styles.iconContainer}>
                                        <Icon name={item.icon} size={24} color="#FF7043" />
                                    </View>
                                    <View style={styles.transInfo}>
                                        <Text style={styles.transTitle}>{item.title}</Text>
                                        <Text style={styles.transSubtitle}>{item.subtitle}</Text>
                                    </View>
                                    <Text style={styles.transDate}>{item.date}</Text>
                                </View>

                                <View style={styles.budgetRow}>
                                    <View>
                                        <Text style={styles.budgetLabel}>Total Spend</Text>
                                        <Text style={styles.budgetValue}>{item.spendDisplay}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => navigation.navigate('BudgetSettings')}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.budgetLabel}>Total Budget</Text>
                                            <Icon name="pencil" size={10} color="#9CA3AF" style={{ marginLeft: 4, marginBottom: 4 }} />
                                        </View>
                                        <Text style={styles.budgetValue}>{item.budget}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.percentText, { color: item.percentVal > 90 ? '#EF4444' : '#22C55E' }]}>{item.percent}</Text>
                                </View>

                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={[
                                        styles.progressBar,
                                        {
                                            width: `${item.percentVal}%`,
                                            backgroundColor: item.percentVal > 90 ? '#EF4444' : '#8B5CF6'
                                        }
                                    ]} />
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Spacing for FAB */}
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
        paddingTop: 12,
        marginBottom: 24,
    },
    profileIconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#A78BFA',
        opacity: 0, // Hidden for centering title if needed, or remove
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    notificationButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    calendarCard: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        marginBottom: 24,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayItem: {
        alignItems: 'center',
    },
    dayLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 12,
        fontWeight: '500',
    },
    dateContainer: {
        width: 32,
        height: 32,
        borderRadius: 12, // slightly rounded
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateContainerActive: {
        backgroundColor: '#FF7043',
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    dateLabel: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    dateLabelActive: {
        color: '#fff',
    },
    summaryScroll: {
        marginBottom: 24,
        // Hack to allow overflow visible on scroll view items
        overflow: 'visible',
    },
    summaryCard: {
        width: width * 0.42,
        height: 200,
        borderRadius: 32,
        padding: 20,
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    cardAmount: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },
    cardFooter: {

    },
    bankText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginTop: 4,
    },
    bgIcon: {
        position: 'absolute',
        bottom: -20,
        right: -20,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    viewAll: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    transactionCard: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        marginBottom: 16,
    },
    transHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFF7ED', // Light Orange
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    transInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    transTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    transSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    transDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    budgetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    budgetLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    budgetValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#22C55E', // Green
    },
    percentText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#22C55E',
        marginBottom: 2,
    },
    progressContainer: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 4,
    },
    // Empty State Styles
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFF7ED', // Light Orange
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 32,
    },
    addExpenseButton: {
        backgroundColor: '#FF7043',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
    },
    addExpenseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ExpensesScreen;
