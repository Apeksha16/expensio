import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.profileContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Icon name="person" size={24} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.headerTitle}>Home</Text>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Icon name="notifications-outline" size={24} color="#1F2937" />
                        <View style={styles.badge} />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>

                        {/* Legend / Stats */}
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

                        {/* Ring Chart Visualization */}
                        <View style={styles.chartContainer}>
                            {/* Simple CSS Hack for Ring Chart */}
                            <View style={styles.ringBackground} />
                            <View style={styles.ringProgress} />
                            <View style={styles.ringInner} />
                        </View>
                    </View>
                </View>

                {/* Analytics Header */}
                <View style={styles.sectionHeader}>
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
                            const heights = [80, 120, 100, 160, 125, 140, 110]; // Mock heights
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
    profileContainer: {
        // Mock profile
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#A78BFA', // Light Purple
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
        // Shadow
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
        opacity: 0.2, // Simulate the empty part or secondary color
    },
    ringProgress: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 15,
        borderColor: '#FF7043',
        position: 'absolute',
        borderLeftColor: 'transparent', // Hack to look like partial ring
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
