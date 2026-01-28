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
import { useTransactions } from '../context/TransactionContext';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const BudgetSettingsScreen = ({ navigation }: { navigation: any }) => {
    const { budgets, getCategorySpend } = useTransactions();

    const categories = Object.keys(budgets);

    const getIconName = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return 'fast-food';
            case 'entertainment': return 'film';
            case 'travel': return 'airplane';
            case 'bills': return 'receipt';
            case 'credit card': return 'card';
            case 'others': return 'grid';
            default: return 'wallet';
        }
    };

    const getIconColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return '#F59E0B'; // Amber
            case 'entertainment': return '#EC4899'; // Pink
            case 'travel': return '#3B82F6'; // Blue
            case 'bills': return '#EF4444'; // Red
            case 'credit card': return '#8B5CF6'; // Purple
            default: return '#10B981'; // Green
        }
    };

    const handleEdit = (category: string) => {
        navigation.navigate('BudgetForm', {
            category,
            currentLimit: budgets[category]
        });
    };

    const handleAddNew = () => {
        navigation.navigate('BudgetForm');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="My Budgets" showBack={true} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <Text style={styles.subtitle}>Track your monthly spending limits.</Text>
                    <TouchableOpacity onPress={handleAddNew}>
                        <Text style={styles.addText}>+ Add New</Text>
                    </TouchableOpacity>
                </View>

                {categories.map((category) => {
                    const limit = budgets[category];
                    const spend = getCategorySpend(category);
                    const progress = limit > 0 ? Math.min((spend / limit) * 100, 100) : 0;
                    const isOverBudget = spend > limit;
                    const color = getIconColor(category);

                    return (
                        <TouchableOpacity
                            key={category}
                            style={styles.budgetCard}
                            activeOpacity={0.9}
                            onPress={() => handleEdit(category)}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                                    <Icon name={getIconName(category)} size={24} color={color} />
                                </View>
                                <View style={styles.cardLabels}>
                                    <Text style={styles.categoryTitle}>{category}</Text>
                                    <Text style={styles.categorySubtitle}>Monthly Limit</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleEdit(category)}>
                                    <Icon name="create-outline" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.statsRow}>
                                <View>
                                    <Text style={styles.statLabel}>Total Spend</Text>
                                    <Text style={[styles.statValue, { color: isOverBudget ? '#EF4444' : '#1F2937' }]}>
                                        ₹{spend.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.statLabel}>Total Budget</Text>
                                    <Text style={styles.statValue}>₹{limit.toLocaleString()}</Text>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View style={styles.progressContainer}>
                                <View style={[
                                    styles.progressBar,
                                    {
                                        width: `${progress}%`,
                                        backgroundColor: isOverBudget ? '#EF4444' : color
                                    }
                                ]} />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 0,
    },
    addText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    budgetCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
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
    cardLabels: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    categorySubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    progressContainer: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
});

export default BudgetSettingsScreen;
