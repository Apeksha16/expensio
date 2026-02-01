import React, { useState, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { useToast } from '../components/Toast';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useGoals, Goal } from '../context/GoalContext';

const { width } = Dimensions.get('window');

const GoalDetailsScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { goal } = route.params; // Initial goal data (date might be string)
    const { addFunds, deleteGoal, getGoalHistory, updateFundEntry, loading, goals } = useGoals();
    const { isDarkMode } = useTheme();
    const { showToast } = useToast();

    // Get the latest goal data from context to ensure updates are reflected
    // If not in context (deleted/error), use param goal (parse date if string)
    const contextGoal = goals.find(g => g.id === goal.id);
    const currentGoal = contextGoal || {
        ...goal,
        targetDate: typeof goal.targetDate === 'string' ? new Date(goal.targetDate) : goal.targetDate
    };

    const [amount, setAmount] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Edit Transaction State
    const [editingTransaction, setEditingTransaction] = useState<any>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoadingHistory(true);
        const data = await getGoalHistory(currentGoal.id);
        setHistory(data);
        setLoadingHistory(false);
    };

    const handleAmountChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned) {
            setAmount(Number(cleaned).toLocaleString('en-IN'));
        } else {
            setAmount('');
        }
    };

    const handleSubmitTransaction = async () => {
        if (!amount) return;

        setSubmitting(true);
        try {
            const numericAmount = parseFloat(amount.replace(/,/g, ''));

            if (editingTransaction) {
                // Update existing transaction
                // Keep original date
                const transactionDate = new Date(editingTransaction.date);

                await updateFundEntry(
                    currentGoal.id,
                    editingTransaction.id,
                    numericAmount,
                    transactionDate
                );
                showToast('Transaction updated successfully', 'success');
                setEditingTransaction(null);
            } else {
                // Add new transaction
                await addFunds(currentGoal.id, numericAmount, new Date());
                showToast('Funds added successfully', 'success');
            }

            setAmount('');
            loadHistory(); // Refresh history
        } catch (error) {
            showToast(editingTransaction ? 'Failed to update transaction' : 'Failed to add funds', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteGoal = () => {
        Alert.alert(
            "Delete Goal",
            "Are you sure you want to delete this goal?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteGoal(currentGoal.id);
                            showToast('Goal deleted successfully', 'success');
                            navigation.goBack();
                        } catch (error) {
                            showToast('Failed to delete goal', 'error');
                        }
                    }
                }
            ]
        );
    };

    const handleEditTransaction = (item: any) => {
        setEditingTransaction(item);
        setAmount(item.amount.toLocaleString('en-IN'));
    };

    const handleCancelEdit = () => {
        setEditingTransaction(null);
        setAmount('');
    };

    const calculateProgress = (saved: number, target: number) => {
        if (target === 0) return 0;
        return (saved / target) * 100;
    };

    const progress = calculateProgress(currentGoal.savedAmount || 0, currentGoal.targetAmount);
    const isCompleted = progress >= 100;

    const now = new Date();
    const target = new Date(currentGoal.targetDate);
    const diffTime = target.getTime() - now.getTime();
    const daysEarly = Math.ceil(diffTime / (1000 * 60 * 60 * 24));



    // Theme Colors
    const containerBg = isDarkMode ? '#111827' : '#F9FAFB';
    const cardBg = isDarkMode ? '#1F2937' : '#fff';
    const textColor = isDarkMode ? '#F9FAFB' : '#1F2937';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const inputBg = isDarkMode ? '#374151' : '#F3F4F6';
    const completedColor = '#10B981';

    return (
        <ScreenWrapper
            title="Goal Details"
            showBack={true}
            backgroundColor={containerBg}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Goal Summary Card */}
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.headerRow}>
                            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                                <Icon name="trophy-outline" size={24} color={isDarkMode ? '#A78BFA' : '#8B5CF6'} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={[styles.goalTitle, { color: textColor }]}>{currentGoal.title}</Text>
                                <Text style={[styles.goalDate, { color: subTextColor }]}>
                                    Target: {new Date(currentGoal.targetDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.amountRow}>
                                <Text style={[styles.savedAmount, { color: textColor }]}>
                                    ₹{currentGoal.savedAmount?.toLocaleString('en-IN') || 0}
                                </Text>
                                <Text style={[styles.targetAmount, { color: subTextColor }]}>
                                    / ₹{currentGoal.targetAmount.toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: '#8B5CF6' }]} />
                            </View>
                            <Text style={[styles.progressText, { color: subTextColor }]}>{progress.toFixed(0)}% completed</Text>
                        </View>
                    </View>

                    {/* Add/Edit Funds Section */}
                    {(!isCompleted || editingTransaction) && (
                        <>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                {editingTransaction ? 'Edit Transaction' : 'Add Funds'}
                            </Text>
                            <View style={[
                                styles.card,
                                styles.addFundsRow,
                                { backgroundColor: cardBg },
                                Platform.OS === 'web' && styles.addFundsRowWeb,
                            ]}>
                                <View style={[
                                    styles.addFundsInputWrap,
                                    Platform.OS === 'web' && styles.addFundsInputWrapWeb,
                                ]}>
                                    <Text style={[styles.currencySymbol, { color: textColor }]}>₹</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            { color: textColor, flex: 1 },
                                            Platform.OS === 'web' && ({
                                                outlineStyle: 'none',
                                                outlineWidth: 0,
                                                boxShadow: 'none',
                                                minWidth: 0,
                                                height: 44,
                                                paddingVertical: 0,
                                            } as any)
                                        ]}
                                        placeholder="Amount"
                                        placeholderTextColor={subTextColor}
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                    />
                                </View>

                                {editingTransaction && (
                                    <TouchableOpacity
                                        style={[styles.cancelButton, { marginRight: 12 }]}
                                        onPress={handleCancelEdit}
                                    >
                                        <Icon name="close-circle" size={24} color={subTextColor} />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.addButton,
                                        Platform.OS === 'web' && styles.addButtonWeb,
                                        (!amount || submitting) && { opacity: 0.5 }
                                    ]}
                                    onPress={handleSubmitTransaction}
                                    disabled={!amount || submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.addButtonText}>
                                            {editingTransaction ? 'Update' : 'Add'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* History Section */}
                    <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>History</Text>
                    {loadingHistory ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={isDarkMode ? '#fff' : '#000'} />
                    ) : history.length === 0 ? (
                        <Text style={[styles.emptyHistory, { color: subTextColor }]}>No contributions yet.</Text>
                    ) : (
                        <View style={[styles.historyList, { backgroundColor: cardBg }]}>
                            {history.map((item, index) => (
                                <View key={item.id} style={[
                                    styles.historyItem,
                                    index !== history.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6' },
                                    editingTransaction?.id === item.id && { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }
                                ]}>
                                    <View>
                                        <Text style={[styles.historyDate, { color: textColor }]}>
                                            {new Date(item.date).toLocaleDateString()}
                                        </Text>
                                        <Text style={[styles.historyTime, { color: subTextColor }]}>
                                            {new Date(item.createdAt || item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={[styles.historyAmount, { color: '#10B981', marginRight: 12 }]}>
                                            + ₹{item.amount.toLocaleString('en-IN')}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => handleEditTransaction(item)}
                                            style={{ padding: 4 }}
                                        >
                                            <Icon name="create-outline" size={20} color={subTextColor} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Delete Option */}
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteGoal}
                    >
                        <Icon name="trash-outline" size={20} color="#EF4444" />
                        <Text style={styles.deleteButtonText}>Delete Goal</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>


            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 24,
    },
    card: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    goalDate: {
        fontSize: 14,
    },
    progressSection: {
        marginTop: 8,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    savedAmount: {
        fontSize: 24,
        fontWeight: '700',
    },
    targetAmount: {
        fontSize: 14,
        marginLeft: 4,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        textAlign: 'right',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    addFundsRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        padding: 16,
    },
    addFundsRowWeb: {
        alignItems: 'center',
        display: 'flex',
    },
    addFundsInputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        minWidth: 0,
    },
    addFundsInputWrapWeb: {
        minHeight: 44,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '600',
        marginRight: 8,
    },
    input: {
        fontSize: 20,
        fontWeight: '600',
        paddingVertical: 10,
        minWidth: 0,
    },
    addButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
    },
    addButtonWeb: {
        height: 44,
        alignSelf: 'center',
        paddingVertical: 0,
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    cancelButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyList: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    historyTime: {
        fontSize: 12,
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyHistory: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginTop: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 48,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default GoalDetailsScreen;
