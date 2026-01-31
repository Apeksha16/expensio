import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';

const SkeletonItem = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    const bg = isDarkMode ? '#374151' : '#E5E7EB';

    return (
        <View style={{
            borderRadius: 32,
            padding: 24,
            marginBottom: 16,
            backgroundColor: isDarkMode ? '#1F2937' : '#fff',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Animated.View style={{ width: 48, height: 48, borderRadius: 16, marginRight: 16, backgroundColor: bg, opacity }} />
                <View style={{ flex: 1 }}>
                    <Animated.View style={{ width: '60%', height: 16, borderRadius: 8, marginBottom: 8, backgroundColor: bg, opacity }} />
                    <Animated.View style={{ width: '40%', height: 12, borderRadius: 6, backgroundColor: bg, opacity }} />
                </View>
            </View>
            <Animated.View style={{ width: 60, height: 20, borderRadius: 8, backgroundColor: bg, opacity }} />
        </View>
    );
};
import ScreenWrapper from '../components/ScreenWrapper';
import { useTransactions } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 48; // 32px container + 16px margin

const ExpensesScreen = ({ navigation }: { navigation: any }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const { transactions: rawTransactions, budgets, getCategorySpend, deleteTransaction, loading, fetchTransactions, setSelectedDate: setContextDate } = useTransactions();
    const { isDarkMode } = useTheme();
    const { user } = useUser();

    const [refreshing, setRefreshing] = useState(false);

    // Sync selectedDate with Context for Global Add Button
    useEffect(() => {
        setContextDate(selectedDate);
    }, [selectedDate, setContextDate]);

    // Fetch transactions when month changes
    const fetchMonthlyTransactions = useCallback(async () => {
        if (user?.id) {
            console.log('[ExpensesScreen] Fetching monthly transactions...');
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startDate = new Date(year, month, 1).toISOString();
            const endDate = new Date(year, month + 1, 0).toISOString();

            console.log(`[ExpensesScreen] Date Range: ${startDate} - ${endDate}`);
            await fetchTransactions(user.id, { startDate, endDate });
        }
    }, [currentDate, user?.id, fetchTransactions]);

    useEffect(() => {
        console.log('[ExpensesScreen] currentDate changed:', currentDate);
        fetchMonthlyTransactions();
    }, [fetchMonthlyTransactions]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMonthlyTransactions();
        setRefreshing(false);
    }, [fetchMonthlyTransactions]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const daysArray = [];

        for (let i = 1; i <= days; i++) {
            const d = new Date(year, month, i);
            daysArray.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: i,
                fullDate: d
            });
        }
        return daysArray;
    };

    const daysData = getDaysInMonth(currentDate);

    const isSameMonth = (d1: Date, d2: Date) => {
        return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    };

    // Auto-scroll to center selected date
    useEffect(() => {
        if (scrollViewRef.current && isSameMonth(selectedDate, currentDate)) {
            const dateIndex = selectedDate.getDate() - 1; // 1-based date to 0-based index
            const position = (dateIndex * ITEM_WIDTH) - (width / 2) + (ITEM_WIDTH / 2);

            // Add a small delay to ensure layout is ready before scrolling
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ x: Math.max(0, position), animated: true });
            }, 100);
        }
    }, [selectedDate, currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    // Calculate Monthly Totals based on displayed month (currentDate)
    const monthlyTransactions = rawTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentDate.getMonth() &&
            tDate.getFullYear() === currentDate.getFullYear();
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Cumulative Spend for use in Progress Bars (Matches TotalExpenseScreen logic)
    const transactionCumulativeSpend = React.useMemo(() => {
        const cumulativeMap: Record<string, number> = {};
        const catRunningTotals: Record<string, number> = {};

        // Sort Newest -> Oldest (Top to Bottom visual order)
        [...monthlyTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .forEach(t => {
                const cat = t.category || 'Others';
                const currentTotal = (catRunningTotals[cat] || 0) + t.amount;
                catRunningTotals[cat] = currentTotal;
                cumulativeMap[t.id] = currentTotal;
            });

        return cumulativeMap;
    }, [monthlyTransactions]);

    // Filter transactions for only the selected date
    const dailyTransactions = rawTransactions.filter(t => isSameDay(new Date(t.date), selectedDate));

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return 'fast-food-outline';
            case 'entertainment': return 'film-outline';
            case 'travel': return 'airplane-outline';
            case 'bills': return 'receipt-outline';
            case 'credit card': return 'card-outline';
            case 'shopping': return 'cart-outline';
            case 'health': return 'medkit-outline';
            case 'transport': return 'car-outline';
            case 'gym': return 'barbell-outline';
            case 'others': return 'grid-outline';
            default: return 'cart-outline';
        }
    };

    const getCategoryColor = (category: string) => {
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

    const transactions = dailyTransactions.map(t => {
        const category = t.category || 'Others';
        // USE INCREMENTAL ACCUMULATIVE SPEND
        const spend = transactionCumulativeSpend[t.id] || t.amount;
        // Fallback to getCategorySpend if undefined (shouldn't happen if monthlyTransactions includes t)

        const budget = budgets[category] || 0;
        const percent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
        const color = getCategoryColor(category);

        return {
            id: t.id,
            icon: t.type === 'income' ? 'wallet-outline' : getCategoryIcon(category),
            color: t.type === 'income' ? '#22C55E' : color, // Green for income, Category Color for expense
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

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Expense",
            "Are you sure you want to delete this expense?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setDeletingId(id);
                        try {
                            await deleteTransaction(id);
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScreenWrapper
            title="Expenses"
            backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
            rightAction={
                <TouchableOpacity
                    style={[styles.notificationButton, { backgroundColor: isDarkMode ? '#374151' : '#fff' }]}
                    onPress={() => navigation.navigate('BudgetSettings')}
                >
                    <Icon name="settings-outline" size={24} color={isDarkMode ? '#F9FAFB' : '#1F2937'} />
                </TouchableOpacity>
            }
        >

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? '#F9FAFB' : '#1F2937'} />
                }
            >

                {/* Calendar Card */}
                <View style={[styles.calendarCard, { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }]}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={handlePrevMonth}>
                            <Icon name="chevron-back" size={20} color={isDarkMode ? '#F9FAFB' : '#1F2937'} />
                        </TouchableOpacity>
                        <Text style={[styles.monthTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={handleNextMonth}>
                            <Icon name="chevron-forward" size={20} color={isDarkMode ? '#F9FAFB' : '#1F2937'} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.daysScrollContent}
                    >
                        {daysData.map((item) => {
                            const isSelected = isSameDay(item.fullDate, selectedDate);
                            return (
                                <TouchableOpacity
                                    key={item.date}
                                    style={[styles.dayItem, { marginRight: 16 }]}
                                    onPress={() => setSelectedDate(item.fullDate)}
                                >
                                    <Text style={[styles.dayLabel, { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }]}>{item.day}</Text>
                                    <View style={[styles.dateContainer, isSelected && styles.dateContainerActive]}>
                                        <Text style={[styles.dateLabel, isSelected && styles.dateLabelActive, !isSelected && { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>{item.date}</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                {/* Summary Horizontal Scroll (Salary vs Expense) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
                    {/* Total Salary Card */}
                    <View style={[styles.summaryCard, { backgroundColor: '#8B5CF6', marginRight: 16 }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardLabel}>Total Income</Text>
                        </View>
                        <Text style={styles.cardAmount}>₹{monthlyIncome.toLocaleString()}</Text>
                        <Icon name="wifi" size={100} color="rgba(255,255,255,0.1)" style={styles.bgIcon} />
                    </View>

                    {/* Total Expense Card */}
                    <View style={[styles.summaryCard, { backgroundColor: '#FF7043' }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardLabel}>Total Expense</Text>
                        </View>
                        <Text style={styles.cardAmount}>₹{monthlyExpense.toLocaleString()}</Text>
                        <Icon name="wifi" size={100} color="rgba(255,255,255,0.1)" style={styles.bgIcon} />
                    </View>
                </ScrollView>

                <View style={styles.listHeader}>
                    <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>Expenses</Text>
                    {transactions.length > 0 && (
                        <TouchableOpacity onPress={() => navigation.navigate('TotalExpense')}>
                            <Text style={[styles.viewAll, { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }]}>View All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Loading Skeleton or Expenses List */}
                {loading ? (
                    <View style={{ paddingBottom: 20 }}>
                        {[1, 2, 3].map(key => <SkeletonItem key={key} isDarkMode={isDarkMode} />)}
                    </View>
                ) : (
                    // Expenses List Container - only render if not loading
                    null
                )}

                {/* Expenses List content handled below, checking loading again or hide it */}

                {/* Expenses List */}
                {!loading && (
                    <View>
                        {transactions.length === 0 ? (
                            <View style={[styles.emptyStateContainer, { backgroundColor: isDarkMode ? '#1F2937' : '#fff', borderColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                                <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#374151' : '#FFF7ED' }]}>
                                    <Icon name="receipt-outline" size={40} color="#FF7043" />
                                </View>
                                <Text style={[styles.emptyTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>No Expenses Yet</Text>
                                <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Track your daily spending here.</Text>
                                <TouchableOpacity
                                    style={styles.addExpenseButton}
                                    onPress={() => navigation.navigate('AddTransaction', { date: selectedDate.toISOString() })}
                                >
                                    <Text style={styles.addExpenseButtonText}>Add Expense</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            transactions.map(item => (
                                <View key={item.id} style={[styles.transactionCard, { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }]}>
                                    <View style={[styles.transHeader, { marginBottom: item.subtitle === 'Others' ? 0 : 20 }]}>
                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#374151' : `${item.color}15` }]}>
                                                <Icon name={item.icon} size={24} color={item.color} />
                                            </View>
                                            <View style={styles.transInfo}>
                                                <Text style={[styles.transTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>{item.title}</Text>
                                                <Text style={[styles.transSubtitle, { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }]}>{item.subtitle}</Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <TouchableOpacity
                                                onPress={() => handleDelete(item.id)}
                                                style={{ marginBottom: 8, height: 24, justifyContent: 'center' }}
                                                disabled={deletingId === item.id}
                                            >
                                                {deletingId === item.id ? (
                                                    <ActivityIndicator size="small" color="#EF4444" />
                                                ) : (
                                                    <Icon name="trash-outline" size={20} color="#EF4444" />
                                                )}
                                            </TouchableOpacity>
                                            <Text style={[styles.transDate, { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }]}>{item.date}</Text>
                                        </View>
                                    </View>

                                    {/* Only show budget/progress if NOT Others */}
                                    {item.subtitle !== 'Others' && (
                                        <>
                                            <View style={styles.budgetRow}>
                                                <View>
                                                    <Text style={[styles.budgetLabel, { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }]}>Total Spend</Text>
                                                    <Text style={styles.budgetValue}>{item.spendDisplay}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => navigation.navigate('BudgetSettings')}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Text style={[styles.budgetLabel, { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }]}>Total Budget</Text>
                                                        <Icon name="pencil" size={10} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} style={{ marginLeft: 4, marginBottom: 4 }} />
                                                    </View>
                                                    <Text style={styles.budgetValue}>{item.budget}</Text>
                                                </TouchableOpacity>
                                                <Text style={[styles.percentText, { color: item.percentVal > 90 ? '#EF4444' : '#22C55E' }]}>{item.percent}</Text>
                                            </View>

                                            {/* Progress Bar */}
                                            <View style={[styles.progressContainer, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                                                <View style={[
                                                    styles.progressBar,
                                                    {
                                                        width: `${item.percentVal}%`,
                                                        backgroundColor: item.percentVal > 90 ? '#EF4444' : '#8B5CF6'
                                                    }
                                                ]} />
                                            </View>
                                        </>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* Spacing for FAB */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </ScreenWrapper>
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
    },
    daysScrollContent: {
        flexDirection: 'row',
        paddingHorizontal: 4,
    },
    dayItem: {
        alignItems: 'center',
    },
    dayLabel: {
        fontSize: 12,
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
        height: 150,
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
    },
    viewAll: {
        fontSize: 14,
    },
    transactionCard: {
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    transInfo: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    transTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    transSubtitle: {
        fontSize: 12,
    },
    transDate: {
        fontSize: 12,
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
        borderRadius: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
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
