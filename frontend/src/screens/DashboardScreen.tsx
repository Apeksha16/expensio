import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import Svg, { Circle, G } from 'react-native-svg';
import { useTransactions } from '../context/TransactionContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: { navigation: any }) => {
    // State for empty state simulation
    const { totalIncome, totalExpense, chartData, selectedYear, changeYear, transactions } = useTransactions();
    const { subscriptions } = useSubscriptions();

    const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth()); // Default to current month index
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    // Filter transactions for the selected year
    const yearlyTransactions = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);

    const yearlyIncome = yearlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const yearlyExpense = yearlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const hasData = yearlyIncome > 0 || yearlyExpense > 0 || totalIncome > 0; // Fallback to check if *any* data exists globally if we want to show empty state differently

    // Derived value for selected month
    const selectedMonthValue = chartData[selectedMonthIndex]?.value || 0;

    const { isDarkMode } = useTheme();
    const { user } = useUser();

    return (
        <ScreenWrapper
            alignment="left"
            leftStyle={{ width: 0 }}
            backgroundColor={isDarkMode ? '#111827' : '#fff'}
            title={
                <TouchableOpacity
                    style={styles.profileHeaderContent}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={styles.avatarPlaceholder}>
                        {user?.photoURL ? (
                            <Image
                                source={{
                                    uri: user.photoURL,
                                    headers: { Referer: 'no-referrer' }
                                }}
                                style={{ width: 44, height: 44, borderRadius: 22 }}
                            />
                        ) : (
                            <Icon name="person" size={20} color="#fff" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.greeting}>Good Morning,</Text>
                        <Text style={[styles.username, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>{user?.name || 'User'}</Text>
                    </View>
                </TouchableOpacity>
            }
            rightAction={
                <TouchableOpacity
                    style={[styles.notificationButton, { backgroundColor: isDarkMode ? '#374151' : '#fff' }]}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Icon name="notifications-outline" size={24} color={isDarkMode ? '#F9FAFB' : '#1F2937'} />
                    <View style={styles.badge} />
                </TouchableOpacity>
            }
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? '#1F2937' : '#fff', borderColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                    {!hasData && !user?.salary ? (
                        <View style={styles.emptySummaryContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Icon name="wallet-outline" size={40} color="#8B5CF6" />
                            </View>
                            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>Welcome to eXpensio!</Text>
                            <Text style={styles.emptySubtitle}>Start adding your expenses and income to see your financial summary here.</Text>
                            <TouchableOpacity
                                style={styles.addFirstButton}
                                onPress={() => navigation.navigate('Expenses')}
                            >
                                <Text style={styles.addFirstButtonText}>Add First Transaction</Text>
                                <Icon name="arrow-forward" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.summaryRow}>
                            <View style={styles.statsColumn}>
                                <View style={styles.statItem}>
                                    <View style={[styles.indicator, { backgroundColor: '#8B5CF6' }]} />
                                    <View>
                                        <Text style={styles.statLabel}>Income</Text>
                                        <Text style={[styles.statValue, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
                                            {user?.salary ? `₹${user.salary}` : `₹${yearlyIncome.toLocaleString()}`}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.statItem}>
                                    <View style={[styles.indicator, { backgroundColor: '#FF7043' }]} />
                                    <View>
                                        <Text style={styles.statLabel}>Spent</Text>
                                        <Text style={[styles.statValue, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>₹{yearlyExpense.toLocaleString()}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.chartContainer}>
                                {(() => {
                                    const size = 140;
                                    const strokeWidth = 15;
                                    const center = size / 2;
                                    const radius = (size - strokeWidth) / 2;
                                    const circumference = 2 * Math.PI * radius;

                                    // Calculate percentage
                                    const income = user?.salary ? parseInt(user.salary.replace(/,/g, '')) : yearlyIncome;
                                    const percentage = income > 0 ? Math.min((yearlyExpense / income) * 100, 100) : 0;
                                    const progress = (percentage / 100) * circumference;

                                    return (
                                        <Svg width={size} height={size}>
                                            <G rotation="-90" origin={`${center}, ${center}`}>
                                                {/* Background Circle */}
                                                <Circle
                                                    cx={center}
                                                    cy={center}
                                                    r={radius}
                                                    stroke="#8B5CF6"
                                                    strokeWidth={strokeWidth}
                                                    strokeOpacity={0.2}
                                                    fill="transparent"
                                                />
                                                {/* Progress Circle */}
                                                <Circle
                                                    cx={center}
                                                    cy={center}
                                                    r={radius}
                                                    stroke="#FF7043"
                                                    strokeWidth={strokeWidth}
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={circumference - progress}
                                                    strokeLinecap="round"
                                                    fill="transparent"
                                                />
                                            </G>
                                            {/* Inner White Circle (for donut effect) */}
                                            <Circle
                                                cx={center}
                                                cy={center}
                                                r={radius - strokeWidth / 2}
                                                fill={isDarkMode ? '#1F2937' : '#fff'}
                                            />
                                        </Svg>
                                    );
                                })()}
                            </View>
                        </View>
                    )}
                </View>

                {/* Analytics Section */}
                <View style={styles.analyticsSection}>
                    <View style={styles.analyticsHeaderRow}>
                        <View>
                            <Text style={[styles.analyticsTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>Spending Trends</Text>
                            <Text style={styles.analyticsSubtitle}>
                                {new Date(0, selectedMonthIndex).toLocaleString('default', { month: 'long' })} {selectedYear}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.yearPill, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                            onPress={() => setShowYearDropdown(!showYearDropdown)}
                        >
                            <Text style={[styles.yearPillText, { color: isDarkMode ? '#D1D5DB' : '#4B5563' }]}>{selectedYear}</Text>
                            <Icon name="chevron-down" size={12} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Dropdown Menu */}
                    {showYearDropdown && (
                        <>
                            <TouchableOpacity
                                style={{
                                    position: 'absolute',
                                    top: -1000,
                                    bottom: -1000,
                                    left: -1000,
                                    right: -1000,
                                    backgroundColor: 'transparent',
                                    zIndex: 19
                                }}
                                onPress={() => setShowYearDropdown(false)}
                                activeOpacity={1}
                            />
                            <View style={[styles.dropdownMenu, { backgroundColor: isDarkMode ? '#374151' : '#fff', borderColor: isDarkMode ? '#4B5563' : '#F3F4F6', zIndex: 20 }]}>
                                {(() => {
                                    const currentYear = new Date().getFullYear();
                                    const startYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : currentYear;
                                    // generate years from current down to startYear
                                    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

                                    return years.map(year => (
                                        <TouchableOpacity
                                            key={year}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                changeYear(year);
                                                setShowYearDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                { color: isDarkMode ? '#D1D5DB' : '#4B5563' },
                                                selectedYear === year && styles.dropdownItemTextSelected
                                            ]}>
                                                {year}
                                            </Text>
                                            {selectedYear === year && (
                                                <Icon name="checkmark" size={14} color="#8B5CF6" />
                                            )}
                                        </TouchableOpacity>
                                    ))
                                })()}
                            </View>
                        </>
                    )}

                    {/* Chart Card */}
                    <View style={[styles.chartCard, { backgroundColor: isDarkMode ? '#1F2937' : '#fff', borderColor: isDarkMode ? '#374151' : '#F9FAFB' }]}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.chartTotalLabel}>Total Spent</Text>
                            <Text style={[styles.chartTotalValue, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
                                {chartData[selectedMonthIndex] ? `₹${chartData[selectedMonthIndex].value.toLocaleString()}` : '₹0'}
                            </Text>
                        </View>

                        <View style={styles.barChartContainer}>
                            {/* Grid Lines */}
                            <View style={styles.gridLines}>
                                <View style={[styles.gridLine, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderColor: isDarkMode ? '#374151' : '#F3F4F6' }]} />
                                <View style={[styles.gridLine, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderColor: isDarkMode ? '#374151' : '#F3F4F6' }]} />
                                <View style={[styles.gridLine, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderColor: isDarkMode ? '#374151' : '#F3F4F6' }]} />
                            </View>

                            {/* Bars */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.barsScrollContent}
                            >
                                {chartData.map((data, index) => {
                                    const maxVal = Math.max(...chartData.map(d => d.value)) || 1;
                                    const percentageHeight = Math.max((data.value / maxVal) * 100, 0); // Allow 0 for empty state
                                    const isActive = index === selectedMonthIndex;

                                    return (
                                        <TouchableOpacity
                                            key={data.label}
                                            style={styles.barWrapper}
                                            onPress={() => setSelectedMonthIndex(index)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.barTrack, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                                                {isActive ? (
                                                    <LinearGradient
                                                        colors={['#C084FC', '#8B5CF6']}
                                                        style={[styles.bar, { height: `${percentageHeight}%` }]}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 0, y: 1 }}
                                                    />
                                                ) : (
                                                    <View style={[styles.bar, { height: `${percentageHeight}%`, backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB' }]} />
                                                )}
                                            </View>
                                            <Text style={[styles.barLabel, isActive && styles.barLabelActive]}>
                                                {data.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </View>

                {/* Upcoming Payments Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>Upcoming payment</Text>
                    {subscriptions.length > 0 && (
                        <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
                            <Text style={styles.seeAllText}>See all</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {subscriptions.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Icon name="calendar-outline" size={32} color="#9CA3AF" />
                        </View>
                        <Text style={styles.emptyStateText}>No upcoming subscriptions</Text>
                        <Text style={styles.emptyStateSubtext}>Track your recurring payments here</Text>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('AddSubscription')}
                        >
                            <Text style={styles.actionButtonText}>Add Subscription</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.paymentsContainer}
                    >
                        {subscriptions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.paymentCard, { backgroundColor: item.color || '#F3F4F6' }]}
                                activeOpacity={0.9}
                                onPress={() => {
                                    Alert.alert(item.name, 'Payment details', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Pay Now', onPress: () => console.log('Pay Now') }
                                    ]);
                                }}
                            >
                                <View style={styles.paymentHeader}>
                                    <View style={[
                                        styles.paymentIcon,
                                        { backgroundColor: 'rgba(255,255,255,0.2)' }
                                    ]}>
                                        <Icon name={item.icon || 'card-outline'} size={24} color={'#fff'} />
                                    </View>
                                    <TouchableOpacity
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        onPress={() => {
                                            Alert.alert(
                                                'Payment Options',
                                                `Manage ${item.name}`,
                                                [
                                                    { text: 'Pay Now', onPress: () => console.log('Paid') },
                                                    { text: 'Edit', onPress: () => console.log('Edit') },
                                                    { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete') },
                                                    { text: 'Cancel', style: 'cancel' }
                                                ]
                                            );
                                        }}
                                    >
                                        <Icon name="ellipsis-vertical" size={20} color={'#fff'} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ marginTop: 16 }}>
                                    <Text style={[styles.paymentName, { color: '#fff' }]}>{item.name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                                        <Text style={[styles.paymentCost, { color: '#fff' }]}>₹{item.amount}</Text>
                                        <Text style={[styles.paymentSub, { color: 'rgba(255,255,255,0.7)' }]}>/{item.frequency === 'Monthly' ? 'mo' : 'yr'}</Text>
                                    </View>
                                    <Text style={[styles.paymentDays, { color: '#fff' }]}>Due: {new Date(item.nextBillDate).getDate()}{getOrdinal(new Date(item.nextBillDate).getDate())}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}


                {/* Spacing for FAB */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </ScreenWrapper>
    );
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
    },
    // Header
    greeting: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    username: {
        fontSize: 16,
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
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        position: 'absolute',
        top: 10,
        right: 12,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // Summary Card
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statsColumn: {
        flex: 1,
        gap: 24,
    },
    statItem: {
        flexDirection: 'row',
        gap: 12,
    },
    indicator: {
        width: 8,
        height: 24,
        borderRadius: 4,
        marginTop: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    chartContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },

    // Empty State
    emptySummaryContainer: {
        alignItems: 'center',
        padding: 16,
    },
    emptyIconContainer: {
        marginBottom: 16,
        opacity: 0.8,
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
    },
    addFirstButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addFirstButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    // Analytics Layout
    analyticsSection: {
        marginBottom: 40,
        zIndex: 10, // For dropdown
    },
    analyticsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    analyticsTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    analyticsSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
        fontWeight: '500',
    },
    yearPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    yearPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 45,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        width: 110,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        zIndex: 20,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    dropdownItemText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    dropdownItemTextSelected: {
        color: '#8B5CF6',
        fontWeight: '700',
    },

    // Chart Card
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F9FAFB',
    },
    chartHeader: {
        marginBottom: 24,
    },
    chartTotalLabel: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chartTotalValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1F2937',
        marginTop: 4,
        letterSpacing: -0.5,
    },
    barChartContainer: {
        height: 180,
        position: 'relative',
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 30, // Space for labels
        justifyContent: 'space-between',
        zIndex: -1,
    },
    gridLine: {
        height: 1,
        backgroundColor: '#F3F4F6',
        width: '100%',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    barsScrollContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: 10,
        paddingHorizontal: 4,
        gap: 16, // Use gap for spacing in ScrollView
    },
    barWrapper: {
        alignItems: 'center',
        width: 32,
        height: '100%', // Take full height of container
        justifyContent: 'flex-end',
    },
    barTrack: {
        width: 12,
        height: '85%', // Leave space for label
        backgroundColor: '#F3F4F6', // The gray pillar background
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: 6,
    },
    barLabel: {
        fontSize: 12,
        color: '#D1D5DB',
        fontWeight: '500',
    },
    barLabelActive: {
        color: '#8B5CF6',
        fontWeight: '700',
    },

    // Other Sections
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    seeAllText: {
        fontSize: 14,
        color: '#6B7280',
    },
    paymentsContainer: {
        paddingRight: 24,
        gap: 16,
    },
    paymentCard: {
        width: 160,
        padding: 20,
        borderRadius: 24,
        marginRight: 16,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    paymentCost: {
        fontSize: 20,
        fontWeight: '700',
    },
    paymentSub: {
        fontSize: 12,
        marginLeft: 2,
    },
    paymentDays: {
        fontSize: 12,
    },

    // Empty state 2
    emptyStateContainer: {
        width: '100%',
        padding: 24,
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 24,
        textAlign: 'center',
    },
    actionButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default DashboardScreen;
