import React, { useState } from 'react';
import Header from '../components/Header';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const TotalExpenseScreen = ({ navigation }: { navigation: any }) => {
    const [selectedDate, setSelectedDate] = useState('24');

    const calendarData = [
        { day: 'M', date: '20' },
        { day: 'T', date: '21' },
        { day: 'W', date: '22' },
        { day: 'T', date: '23' },
        { day: 'F', date: '24' },
        { day: 'S', date: '25' },
        { day: 'S', date: '26' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Total Expense"
                showBack={true}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Calendar Card */}
                <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                        <Icon name="chevron-back" size={20} color="#1F2937" />
                        <Text style={styles.monthTitle}>April 2022</Text>
                        <Icon name="chevron-forward" size={20} color="#1F2937" />
                    </View>

                    <View style={styles.weekRow}>
                        {calendarData.map((item, index) => (
                            <View key={index} style={styles.dayCol}>
                                <Text style={styles.dayLabel}>{item.day}</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.dateBtn,
                                        selectedDate === item.date && styles.dateBtnActive
                                    ]}
                                    onPress={() => setSelectedDate(item.date)}
                                >
                                    <Text style={[
                                        styles.dateText,
                                        selectedDate === item.date && styles.dateTextActive
                                    ]}>{item.date}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Monthly Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryText}>
                            You have Spend <Text style={styles.highlightAmount}>₹6,584</Text>{'\n'}this month.
                        </Text>
                        <Text style={styles.summaryDate}>April, 2022</Text>
                    </View>

                    <View style={styles.progressRow}>
                        <View style={styles.progressLabelContainer}>
                            <Text style={styles.progressPercent}>75.78%</Text>
                        </View>
                        <Text style={styles.remainingPercent}>24.22%</Text>
                    </View>

                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '75.78%' }]} />
                    </View>
                </View>

                {/* Analytics Header */}
                <View style={styles.analyticsHeader}>
                    <Text style={styles.sectionTitle}>Analytics</Text>
                    <Text style={styles.viewAllText}>View All</Text>
                </View>

                {/* Pie Chart Representation (Mock) */}
                <View style={styles.pieChartContainer}>
                    <Text style={styles.chartTitle}>Food And Drinks</Text>
                    <Text style={styles.chartSubtitle}>₹4,672</Text>

                    <View style={styles.chartArea}>
                        {/* Simple Donut Chart Representation */}
                        <View style={styles.donutContainer}>
                            {/* Purple Segment (Base) */}
                            <View style={[styles.donutSegment, { borderColor: '#8B5CF6' }]} />
                            {/* Orange Segment (Overlay) */}
                            <View style={[styles.donutSegment, {
                                borderColor: '#FF7043',
                                position: 'absolute',
                                borderLeftColor: 'transparent',
                                borderBottomColor: 'transparent',
                                transform: [{ rotate: '-45deg' }]
                            }]} />

                            {/* Center Info */}
                            <View style={styles.donutInner}>
                                <Text style={styles.innerLabel}>Total</Text>
                            </View>
                        </View>

                        {/* Percentage Labels */}
                        <View style={[styles.percentLabel, { top: 40, right: 20 }]}>
                            <Text style={styles.percentText}>35%</Text>
                        </View>
                        <View style={[styles.percentLabel, { bottom: 40, left: 20 }]}>
                            <Text style={styles.percentText}>45%</Text>
                        </View>
                    </View>

                    <View style={styles.legendContainer}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#FF7043' }]} />
                            <View>
                                <Text style={styles.legendTitle}>Shopping</Text>
                                <Text style={styles.legendValue}>₹3,762</Text>
                            </View>
                        </View>

                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                            <View>
                                <Text style={styles.legendTitle}>Healthcare</Text>
                                <Text style={styles.legendValue}>₹2,917</Text>
                            </View>
                        </View>
                    </View>
                </View>

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
    calendarCard: {
        backgroundColor: '#fff',
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
        color: '#1F2937',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCol: {
        alignItems: 'center',
        gap: 8,
    },
    dayLabel: {
        fontSize: 12,
        color: '#9CA3AF',
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
        color: '#1F2937',
    },
    dateTextActive: {
        color: '#fff',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    summaryText: {
        fontSize: 18,
        color: '#1F2937',
        lineHeight: 26,
    },
    highlightAmount: {
        color: '#FF7043',
        fontWeight: '700',
    },
    summaryDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabelContainer: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    progressPercent: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    remainingPercent: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        marginTop: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 4,
    },
    analyticsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    viewAllText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    pieChartContainer: {
        alignItems: 'center',
        height: 350,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 24,
    },
    chartArea: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        height: 240,
        width: '100%',
        marginBottom: 24,
    },
    donutContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutSegment: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 20,
        position: 'absolute',
    },
    donutInner: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    percentLabel: {
        position: 'absolute',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    percentText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    legendValue: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});

export default TotalExpenseScreen;
