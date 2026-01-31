import React, { useState, useMemo, useRef, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTransactions } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import Svg, { Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 52; // 40px width + 12px margin
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TotalExpenseScreen = ({ navigation }: { navigation: any }) => {
    const { transactions, budgets, getCategorySpend } = useTransactions();
    const { isDarkMode } = useTheme();

    // State for selected date
    const [currentDate, setCurrentDate] = useState(new Date());
    // Allow null for full month view
    // Allow null for full month view
    const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
    const daysScrollViewRef = useRef<ScrollView>(null);

    // Auto-scroll to center selected date
    useEffect(() => {
        if (daysScrollViewRef.current && selectedDay) {
            const dateIndex = selectedDay - 1; // 1-based date to 0-based index
            const position = (dateIndex * ITEM_WIDTH) - (width / 2) + (ITEM_WIDTH / 2);

            // Add a small delay to ensure layout is ready before scrolling
            setTimeout(() => {
                daysScrollViewRef.current?.scrollTo({ x: Math.max(0, position), animated: true });
            }, 100);
        }
    }, [selectedDay, currentDate]);

    // Theme Colors
    const textColor = isDarkMode ? '#F9FAFB' : '#1F2937';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const cardBg = isDarkMode ? '#1F2937' : '#fff';
    const bgColor = isDarkMode ? '#111827' : '#F9FAFB';

    // Helper to change month
    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1);
        setCurrentDate(newDate);
        setSelectedDay(null); // Default to full month when changing months
    };

    // Generate days for the current month
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const daysArray = [];

        for (let i = 1; i <= days; i++) {
            const d = new Date(year, month, i);
            daysArray.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }), // e.g., 'Mon'
                date: i,
                fullDate: d
            });
        }
        return daysArray;
    }, [currentDate]);

    // Filter Transactions and Calculate Stats
    const { displayedTransactions, totalExpense, chartData, chartSegments, transactionCumulativeSpend } = useMemo(() => {
        // 1. Filter by Month first
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentDate.getMonth() &&
                tDate.getFullYear() === currentDate.getFullYear() &&
                t.type === 'expense';
        });

        // 2. Filter by Day if selected
        const finalTransactions = selectedDay
            ? monthTransactions.filter(t => new Date(t.date).getDate() === selectedDay)
            : monthTransactions;

        // 3. Calculate Total for displayed set
        const total = finalTransactions.reduce((sum, t) => sum + t.amount, 0);

        // 4. Prepare Chart Data (Category breakdown of displayed set)
        const categories: Record<string, number> = {};
        finalTransactions.forEach(t => {
            const cat = t.category || 'Others';
            categories[cat] = (categories[cat] || 0) + t.amount;
        });

        const data = Object.keys(categories)
            .map(cat => ({
                name: cat,
                amount: categories[cat],
                color: getCategoryColor(cat),
                percentage: total > 0 ? (categories[cat] / total) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);

        // 5. Calculate Segments
        let currentAngle = 0;
        const segments = data.map(item => {
            const strokeDasharray = `${(item.percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
            // SVG rotate: angle, cx, cy
            const rotate = `rotate(${currentAngle}, 100, 100)`;
            currentAngle += (item.percentage / 100) * 360;
            return { ...item, strokeDasharray, rotate };
        });

        // 6. Calculate Incremental Cumulative Spend per Transaction (Sort Newest -> Oldest to match visual Top -> Bottom accumulation)
        const cumulativeMap: Record<string, number> = {};
        const catRunningTotals: Record<string, number> = {};

        // Sort Descending (Newest -> Oldest) which matches the visual list order.
        // The user wants the "Top" item to start the accumulation and the "Bottom" items to include the previous (Top) amounts.
        [...monthTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .forEach(t => {
                const cat = t.category || 'Others';
                const currentTotal = (catRunningTotals[cat] || 0) + t.amount;
                catRunningTotals[cat] = currentTotal;
                cumulativeMap[t.id] = currentTotal;
            });

        return {
            displayedTransactions: finalTransactions,
            totalExpense: total,
            chartData: data,
            chartSegments: segments,
            transactionCumulativeSpend: cumulativeMap
        };
    }, [transactions, currentDate, selectedDay]);


    function getCategoryColor(category: string) {
        switch (category.toLowerCase()) {
            case 'food': return '#F59E0B';
            case 'entertainment': return '#EC4899';
            case 'travel': return '#3B82F6';
            case 'bills': return '#EF4444';
            case 'shopping': return '#8B5CF6';
            case 'healthcare': return '#10B981';
            default: return '#6B7280';
        }
    }

    function getIconName(category: string) {
        switch (category?.toLowerCase()) {
            case 'food': return 'fast-food';
            case 'entertainment': return 'film';
            case 'travel': return 'airplane';
            case 'bills': return 'receipt';
            case 'credit card': return 'card';
            case 'others': return 'grid';
            default: return 'wallet';
        }
    }

    return (
        <ScreenWrapper
            title="Total Expense"
            showBack={true}
            backgroundColor={bgColor}
        >

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Calendar Card */}
                <View style={[styles.calendarCard, { backgroundColor: cardBg }]}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={() => changeMonth(-1)}>
                            <Icon name="chevron-back" size={20} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.monthTitle, { color: textColor }]}>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={() => changeMonth(1)}>
                            <Icon name="chevron-forward" size={20} color={textColor} />
                        </TouchableOpacity>
                    </View>

                    {/* Horizontal Scroll for Days */}
                    <ScrollView
                        ref={daysScrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.weekRow}
                    >
                        {daysInMonth.map((item, index) => (
                            <View key={index} style={styles.dayCol}>
                                <Text style={[styles.dayLabel, { color: subTextColor }]}>{item.day.charAt(0)}</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.dateBtn,
                                        selectedDay === item.date && styles.dateBtnActive,
                                    ]}
                                    onPress={() => setSelectedDay(prev => prev === item.date ? null : item.date)}
                                >
                                    <Text style={[
                                        styles.dateText,
                                        { color: textColor },
                                        selectedDay === item.date && styles.dateTextActive
                                    ]}>{item.date}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                    {/* Helper text for toggle */}
                    <Text style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: subTextColor }}>
                        {selectedDay ? 'Tap again to view full month' : 'Showing full month'}
                    </Text>
                </View>

                {/* Analytics Chart (Only show if there is data) */}
                {displayedTransactions.length > 0 && (
                    <View style={styles.analyticsSection}>
                        <View style={styles.analyticsHeader}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Analytics</Text>
                        </View>

                        <View style={styles.pieChartContainer}>
                            {/* Top Category Title - Dynamic */}
                            {chartData.length > 0 && (
                                <>
                                    <Text style={[styles.chartTitle, { color: textColor }]}>{chartData[0].name}</Text>
                                    <Text style={[styles.chartSubtitle, { color: subTextColor }]}>₹{chartData[0].amount.toLocaleString()}</Text>
                                </>
                            )}

                            <View style={styles.chartArea}>
                                <View style={styles.donutContainer}>
                                    <Svg height={160} width={160} viewBox="0 0 200 200">
                                        <G rotation="-90" origin="100, 100">
                                            {/* Background Circle */}
                                            <Circle
                                                cx="100"
                                                cy="100"
                                                r={RADIUS}
                                                stroke={isDarkMode ? '#374151' : "#F3F4F6"}
                                                strokeWidth="20"
                                                fill="transparent"
                                            />
                                            {/* Segments */}
                                            {chartSegments.map((segment, index) => (
                                                <Circle
                                                    key={index}
                                                    cx="100"
                                                    cy="100"
                                                    r={RADIUS}
                                                    stroke={segment.color}
                                                    strokeWidth="20"
                                                    fill="transparent"
                                                    strokeDasharray={segment.strokeDasharray}
                                                    transform={segment.rotate}
                                                />
                                            ))}
                                        </G>
                                    </Svg>

                                    {/* Center Info */}
                                    <View style={styles.donutInner}>
                                        <Text style={[styles.innerLabel, { color: subTextColor }]}>Total</Text>
                                        <Text style={[styles.innerValue, { color: textColor }]}>₹{totalExpense.toLocaleString()}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Dynamic Legend */}
                            <View style={styles.legendContainer}>
                                {chartData.slice(0, 3).map((cat, index) => (
                                    <View key={index} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                                        <View>
                                            <Text style={[styles.legendTitle, { color: textColor }]}>{cat.name}</Text>
                                            <Text style={[styles.legendValue, { color: subTextColor }]}>₹{cat.amount.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Transactions List */}
                <View style={styles.listContainer}>
                    <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 16 }]}>
                        {selectedDay ? `Expenses for ${selectedDay} ${currentDate.toLocaleString('default', { month: 'short' })}` : `All Expenses - ${currentDate.toLocaleString('default', { month: 'long' })}`}
                    </Text>

                    {displayedTransactions.length === 0 ? (
                        <View style={[styles.emptyState, { borderColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
                            <Text style={{ color: subTextColor }}>No expenses found for this selection.</Text>
                        </View>
                    ) : (
                        displayedTransactions.map((item) => {
                            const category = item.category || 'Others';
                            // Use the incremental cumulative spend for this transaction
                            const spend = transactionCumulativeSpend[item.id] || item.amount;
                            const budget = budgets[category] || 0;
                            const percent = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;

                            return (
                                <View key={item.id} style={[styles.transactionCard, { backgroundColor: cardBg }]}>
                                    <View style={styles.transHeader}>
                                        <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                                            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#374151' : '#FFF7ED' }]}>
                                                <Icon name={getIconName(category)} size={20} color="#FF7043" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.transTitle, { color: textColor }]}>{item.title}</Text>
                                                <Text style={[styles.transSubtitle, { color: subTextColor }]}>{category} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.transAmount, { color: '#EF4444' }]}>-₹{item.amount}</Text>
                                    </View>

                                    {/* Only Show Category Budget Progress if NOT Others */}
                                    {category !== 'Others' && (
                                        <View style={styles.budgetRow}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={[styles.budgetLabel, { color: subTextColor }]}>Category Budget</Text>
                                                <Text style={[styles.percentText, {
                                                    color: percent > 90 ? '#EF4444' : percent > 80 ? '#F97316' : '#22C55E'
                                                }]}>{Math.round(percent)}%</Text>
                                            </View>
                                            <View style={[styles.progressContainer, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                                                <View style={[
                                                    styles.progressBar,
                                                    {
                                                        width: `${percent}%`,
                                                        backgroundColor: percent > 90 ? '#EF4444' : percent > 80 ? '#F97316' : '#8B5CF6'
                                                    }
                                                ]} />
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 24,
    },
    calendarCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    weekRow: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    dayCol: {
        alignItems: 'center',
        gap: 8,
        marginRight: 12,
        width: 40,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    dateBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateBtnActive: {
        backgroundColor: '#FF7043',
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateTextActive: {
        color: '#fff',
    },
    listContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 16,
    },
    transactionCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
    },
    transHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    transSubtitle: {
        fontSize: 12,
    },
    transAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    budgetRow: {
        marginTop: 4,
    },
    budgetLabel: {
        fontSize: 10,
    },
    percentText: {
        fontSize: 10,
        fontWeight: '700',
    },
    progressContainer: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    analyticsSection: {
        marginBottom: 24,
    },
    analyticsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    pieChartContainer: {
        alignItems: 'center',
        // Removed fixed height
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 14,
        marginBottom: 12,
    },
    chartArea: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        // Removed fixed height
        width: '100%',
        marginBottom: 12,
    },
    donutContainer: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    donutInner: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    innerLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    innerValue: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 2,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 16,
        width: '100%',
        paddingHorizontal: 0,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 80,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    legendValue: {
        fontSize: 10,
    },
});

export default TotalExpenseScreen;
