import React, { useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useGoals } from '../context/GoalContext';

const { width } = Dimensions.get('window');

const GoalsScreen = ({ navigation }: { navigation: any }) => {
    const { isDarkMode } = useTheme();
    const { goals } = useGoals();

    const calculateProgress = (saved: number, target: number) => {
        if (target === 0) return 0;
        return (saved / target) * 100;
    };

    // Helper to generate consistent color/icon based on goal title
    const getGoalStyle = (title: string) => {
        const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
        const icons = ['trophy-outline', 'star-outline', 'rocket-outline', 'gift-outline', 'airplane-outline'];
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return { color: colors[index], icon: icons[index] };
    };

    // Theme Colors
    const containerBg = isDarkMode ? '#111827' : '#F9FAFB';
    const textColor = isDarkMode ? '#F9FAFB' : '#1F2937';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const cardBg = isDarkMode ? '#1F2937' : '#fff';
    const borderColor = isDarkMode ? '#374151' : '#F3F4F6';
    const iconCircleBg = isDarkMode ? '#374151' : '#F3F4F6';

    return (
        <ScreenWrapper
            title="Goals"
            backgroundColor={containerBg}
            rightAction={
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddGoal')}
                    style={[styles.addButton, { backgroundColor: isDarkMode ? '#374151' : '#1F2937' }]}
                >
                    <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            }
        >

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Featured / Active Goals */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>Active Goals</Text>

                {goals.length === 0 ? (
                    <View style={[styles.emptyStateContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: iconCircleBg }]}>
                            <Icon name="trophy-outline" size={40} color={isDarkMode ? '#A78BFA' : '#8B5CF6'} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: textColor }]}>No Goals Yet</Text>
                        <Text style={[styles.emptySubtitle, { color: subTextColor }]}>Create a goal to start saving for your dreams.</Text>
                        <TouchableOpacity
                            style={styles.createGoalButton}
                            onPress={() => navigation.navigate('AddGoal')}
                        >
                            <Text style={styles.createGoalButtonText}>Create Your First Goal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.gridContainer}>
                        {goals.map((goal) => {
                            const progress = calculateProgress(goal.savedAmount || 0, goal.targetAmount);
                            const style = getGoalStyle(goal.title);

                            return (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[styles.goalCard, { backgroundColor: style.color }]}
                                    onPress={() => navigation.navigate('GoalDetails', {
                                        goal: {
                                            ...goal,
                                            targetDate: goal.targetDate.toISOString()
                                        }
                                    })}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.iconCircle}>
                                            <Icon name={style.icon} size={20} color={style.color} />
                                        </View>
                                    </View>

                                    <View style={styles.cardBody}>
                                        <Text style={styles.goalTitle} numberOfLines={2}>{goal.title}</Text>
                                        <Text style={styles.goalDeadline}>by {new Date(goal.targetDate).toLocaleDateString()}</Text>

                                        <View style={styles.amountRow}>
                                            <Text style={styles.savedText}>₹{((goal.savedAmount || 0) / 1000).toFixed(0)}k</Text>
                                            <Text style={styles.targetText}>/ ₹{(goal.targetAmount / 1000).toFixed(0)}k</Text>
                                        </View>
                                    </View>

                                    {/* Progress Bar */}
                                    <View style={styles.progressContainer}>
                                        <View style={[
                                            styles.progressBar,
                                            {
                                                width: `${Math.min(progress, 100)}%`,
                                                backgroundColor: progress >= 100 ? '#10B981' : '#fff'
                                            }
                                        ]} />
                                    </View>
                                    <Text style={[
                                        styles.progressText,
                                        progress >= 100 && { color: '#10B981', fontWeight: '700' }
                                    ]}>{progress >= 100 ? 'Completed 🎉' : `${progress.toFixed(0)}% completed`}</Text>

                                    {progress >= 100 && (
                                        <View style={styles.completedBadge}>
                                            <Icon name="checkmark-circle" size={16} color="#10B981" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    goalCard: {
        width: (width - 48 - 16) / 2, // 2 columns with padding and gap
        borderRadius: 24,
        padding: 16,
        marginBottom: 0,
        minHeight: 160,
        justifyContent: 'space-between',
        backgroundColor: '#fff', // Default for shadow calculation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        marginBottom: 16,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        lineHeight: 22,
    },
    goalDeadline: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 12,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    savedText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    targetText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 4,
    },
    progressContainer: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    saveGoalButton: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveGoalText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
    },
    cancelText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
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
        width: 80,
        height: 80,
        borderRadius: 40,
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
    createGoalButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
    },
    createGoalButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    completedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 2,
    },
});

export default GoalsScreen;
