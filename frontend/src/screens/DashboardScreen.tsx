import React from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

// ... (mock data for payments)
const UPCOMING_PAYMENTS = [
    { id: '1', name: 'Adobe Premium', cost: '$30', sub: '/month', days: '2 days left', icon: 'logo-dropbox', color: '#7C3AED', bg: '#8B5CF6' }, // Approximate Adobe
    { id: '2', name: 'Apple Premium', cost: '$30', sub: '/month', days: '2 days left', icon: 'logo-apple', color: '#000', bg: '#F3F4F6' },
    { id: '3', name: 'Netflix', cost: '$15', sub: '/month', days: '5 days left', icon: 'logo-usd', color: '#E50914', bg: '#FEE2E2' },
];

const DashboardScreen = ({ navigation }: { navigation: any }) => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.profileContainer}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={styles.avatarPlaceholder}>
                            <Icon name="person" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Home</Text>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Icon name="notifications-outline" size={24} color="#1F2937" />
                        <View style={styles.badge} />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    {/* ... (existing summary card content) ... */}
                    <View style={styles.summaryRow}>
                        <View style={styles.statsColumn}>
                            <View style={styles.statItem}>
                                <View style={[styles.indicator, { backgroundColor: '#8B5CF6' }]} />
                                <View>
                                    <Text style={styles.statLabel}>Income</Text>
                                    <Text style={styles.statValue}>₹8,429</Text>
                                </View>
                            </View>

                            <View style={styles.statItem}>
                                <View style={[styles.indicator, { backgroundColor: '#FF7043' }]} />
                                <View>
                                    <Text style={styles.statLabel}>Spent</Text>
                                    <Text style={styles.statValue}>₹3,621</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.chartContainer}>
                            <View style={styles.ringBackground} />
                            <View style={styles.ringProgress} />
                            <View style={styles.ringInner} />
                        </View>
                    </View>
                </View>

                {/* Upcoming Payments Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Upcoming payment</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
                        <Text style={styles.seeAllText}>See all</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.paymentsContainer}
                >
                    {UPCOMING_PAYMENTS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.paymentCard, { backgroundColor: item.bg }]}
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
                                    { backgroundColor: item.bg === '#F3F4F6' ? '#FFFFFF' : 'rgba(255,255,255,0.2)' }
                                ]}>
                                    <Icon name={item.icon} size={24} color={item.bg === '#F3F4F6' ? '#000' : '#fff'} />
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
                                    <Icon name="ellipsis-vertical" size={20} color={item.bg === '#F3F4F6' ? '#000' : '#fff'} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <Text style={[styles.paymentName, { color: item.bg === '#F3F4F6' ? '#000' : '#fff' }]}>{item.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                                    <Text style={[styles.paymentCost, { color: item.bg === '#F3F4F6' ? '#000' : '#fff' }]}>{item.cost}</Text>
                                    <Text style={[styles.paymentSub, { color: item.bg === '#F3F4F6' ? '#6B7280' : 'rgba(255,255,255,0.7)' }]}>{item.sub}</Text>
                                </View>
                                <Text style={[styles.paymentDays, { color: item.bg === '#F3F4F6' ? '#000' : '#fff' }]}>{item.days}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>


                {/* Analytics Header */}
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>Analytics</Text>
                    <TouchableOpacity style={styles.yearButton}>
                        <Text style={styles.yearText}>Year - 2022</Text>
                        <Icon name="chevron-down" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Analytics Bar Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.barChartHeader}>
                        <Text style={styles.chartValueLabel}>₹2,972</Text>
                    </View>
                    <View style={styles.barChartContainer}>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month, index) => {
                            const heights = [80, 120, 100, 160, 125, 140, 110];
                            const isActive = month === 'Apr';
                            return (
                                <View key={month} style={styles.barColumn}>
                                    <View style={[styles.barValue, { height: heights[index], backgroundColor: isActive ? '#8B5CF6' : '#F3F4F6' }]} />
                                    <Text style={[styles.barLabel, isActive && styles.barLabelActive]}>{month}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Spacing for FAB */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // ... (existing styles)
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    profileContainer: {},
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#A78BFA',
        justifyContent: 'center',
        alignItems: 'center',
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
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
    ringBackground: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 15,
        borderColor: '#8B5CF6',
        position: 'absolute',
        opacity: 0.2,
    },
    ringProgress: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 15,
        borderColor: '#FF7043',
        position: 'absolute',
        borderLeftColor: 'transparent',
        borderBottomColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
    },
    ringInner: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#fff',
        position: 'absolute',
    },
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
        marginTop: 8,
        fontWeight: '500',
    },
    yearButton: {
        backgroundColor: '#FF7043',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    yearText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    barChartHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    chartValueLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 180,
    },
    barColumn: {
        alignItems: 'center',
        gap: 12,
        width: 32,
    },
    barValue: {
        width: '100%',
        borderRadius: 8,
    },
    barLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    barLabelActive: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
});

export default DashboardScreen;
