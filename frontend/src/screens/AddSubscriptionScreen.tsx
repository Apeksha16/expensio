import React, { useState, useRef, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useToast } from '../components/Toast';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useTransactions } from '../context/TransactionContext';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 48;

const AddSubscriptionScreen = ({ navigation, route }: { navigation: any, route: any }) => {
    const { isDarkMode } = useTheme();
    const editingSubscription = route?.params?.subscription;

    const [name, setName] = useState(editingSubscription?.name || '');
    const [amount, setAmount] = useState(editingSubscription?.amount?.toString() || '');
    const [frequency, setFrequency] = useState<'Monthly' | 'Yearly'>(editingSubscription?.frequency || 'Monthly');
    const [date, setDate] = useState<Date>(editingSubscription ? new Date(editingSubscription.nextBillDate) : new Date());
    const [isEditing, setIsEditing] = useState(!editingSubscription);
    const [isPaying, setIsPaying] = useState(false);

    const { addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
    const { addTransaction, transactions } = useTransactions();
    const { showToast } = useToast();

    // Subscription payment history
    const subscriptionHistory = editingSubscription
        ? transactions
            .filter(
                (t) =>
                    t.type === 'expense' &&
                    t.category === 'Subscription' &&
                    (t.title === editingSubscription.name || t.note?.includes(editingSubscription.name))
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];

    // Calendar State - Initialize to Selected Date's month to ensure correct view
    const [currentDate] = useState(new Date(date));
    const scrollViewRef = useRef<ScrollView>(null);

    // Theme Colors
    const containerBg = isDarkMode ? '#111827' : '#fff';
    const textColor = isDarkMode ? '#F9FAFB' : '#1F2937';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const inputBg = isDarkMode ? '#1F2937' : '#F9FAFB';
    const inputBorder = isDarkMode ? '#374151' : '#E5E7EB';
    const placeholderColor = isDarkMode ? '#6B7280' : '#9CA3AF';
    const calendarBg = isDarkMode ? '#1F2937' : '#F9FAFB';
    const toggleBg = isDarkMode ? '#374151' : '#E5E7EB';
    const toggleActiveBg = isDarkMode ? '#4B5563' : '#fff';
    const footerBorder = isDarkMode ? '#374151' : '#F3F4F6';

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const daysArray: { day: string; date: number; fullDate: Date }[] = [];

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

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const scrollToDate = (targetDate: Date) => {
        const dateIndex = targetDate.getDate() - 1;
        const containerWidth = width - 48; // Screen padding 24 * 2
        const position = (dateIndex * ITEM_WIDTH) - (containerWidth / 2) + (ITEM_WIDTH / 2);

        // Ensure accurate scrolling
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ x: Math.max(0, position), animated: true });
        }, 500);
    };

    useEffect(() => {
        scrollToDate(date);
    }, []);

    const handleDateSelect = (selectedDate: Date) => {
        if (!isEditing) return;
        setDate(selectedDate);
    };

    const handleSave = () => {
        if (!name || !amount) {
            showToast('Please enter name and amount', 'error');
            return;
        }

        if (editingSubscription) {
            updateSubscription(editingSubscription.id, {
                name,
                amount: parseFloat(amount),
                frequency,
                nextBillDate: date,
                icon: editingSubscription.icon,
                color: editingSubscription.color,
            });
            showToast('Subscription Updated', 'success');
        } else {
            addSubscription({
                name,
                amount: parseFloat(amount),
                frequency,
                nextBillDate: date,
                icon: 'card-outline',
                color: getRandomColor(),
            });
            showToast('Subscription Added', 'success');
        }

        navigation.goBack();
    };

    const getRandomColor = () => {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleDeleteSubscription = () => {
        if (!editingSubscription) return;
        Alert.alert(
            'Delete Subscription',
            `Are you sure you want to delete ${editingSubscription.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteSubscription(editingSubscription.id);
                        showToast('Subscription deleted', 'success');
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const handlePaySubscription = () => {
        if (!editingSubscription) return;
        Alert.alert(
            'Record Payment',
            `Record payment of ₹${editingSubscription.amount} for ${editingSubscription.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay',
                    onPress: async () => {
                        setIsPaying(true);
                        try {
                            await addTransaction({
                                title: editingSubscription.name,
                                amount: editingSubscription.amount,
                                type: 'expense',
                                category: 'Subscription',
                                date: new Date(),
                                note: 'Subscription Payment',
                            });
                            // Advance next bill date by 1 month
                            const nextDate = new Date(editingSubscription.nextBillDate);
                            nextDate.setMonth(nextDate.getMonth() + 1);
                            updateSubscription(editingSubscription.id, {
                                name: editingSubscription.name,
                                amount: editingSubscription.amount,
                                frequency: editingSubscription.frequency,
                                nextBillDate: nextDate,
                                icon: editingSubscription.icon,
                                color: editingSubscription.color,
                            });
                            showToast('Payment recorded', 'success');

                            // Note: We don't necessarily goBack here if we want to stay on the view,
                            // but usually syncing the new date is good. 
                            // For now, let's refresh the current screen's date state or go back.
                            // The user didn't specify, but 'goBack' is safe.
                            navigation.goBack();
                        } catch (error) {
                            showToast('Failed to record payment', 'error');
                        } finally {
                            setIsPaying(false);
                        }
                    },
                },
            ]
        );
    };

    const daysData = getDaysInMonth(currentDate);

    return (
        <ScreenWrapper
            title={editingSubscription ? "Subscription Details" : "Add Subscription"}
            showBack={true}
            backgroundColor={containerBg}
            rightAction={
                editingSubscription && !isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Icon name="create-outline" size={24} color={textColor} />
                    </TouchableOpacity>
                ) : null
            }
        >

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Service Name</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isEditing ? inputBg : 'transparent',
                                    borderColor: isEditing ? inputBorder : 'transparent',
                                    paddingHorizontal: isEditing ? 16 : 0,
                                    color: textColor
                                }
                            ]}
                            placeholder="Netflix, Spotify, etc."
                            placeholderTextColor={placeholderColor}
                            value={name}
                            onChangeText={setName}
                            editable={isEditing}
                            autoFocus={!editingSubscription}
                        />
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Amount (₹)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isEditing ? inputBg : 'transparent',
                                    borderColor: isEditing ? inputBorder : 'transparent',
                                    paddingHorizontal: isEditing ? 16 : 0,
                                    color: textColor
                                }
                            ]}
                            placeholder="499"
                            placeholderTextColor={placeholderColor}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            editable={isEditing}
                        />
                    </View>

                    {/* Custom Date Picker with Frequency Tabs */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Billing Cycle & Date</Text>
                        <View
                            style={[styles.calendarCard, { backgroundColor: calendarBg }]}
                        >
                            {/* Header with Monthly/Yearly Tabs */}
                            <View style={styles.calendarHeader}>
                                <View style={[styles.toggleContainer, { backgroundColor: toggleBg }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.toggleButton,
                                            frequency === 'Monthly' && { backgroundColor: toggleActiveBg, shadowOpacity: 0.1 },
                                        ]}
                                        onPress={() => isEditing && setFrequency('Monthly')}
                                        disabled={!isEditing}
                                    >
                                        <Text
                                            style={[
                                                styles.toggleText,
                                                { color: frequency === 'Monthly' ? textColor : subTextColor },
                                            ]}
                                        >
                                            Monthly
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.toggleButton,
                                            frequency === 'Yearly' && { backgroundColor: toggleActiveBg, shadowOpacity: 0.1 },
                                        ]}
                                        onPress={() => isEditing && setFrequency('Yearly')}
                                        disabled={!isEditing}
                                    >
                                        <Text
                                            style={[
                                                styles.toggleText,
                                                { color: frequency === 'Yearly' ? textColor : subTextColor },
                                            ]}
                                        >
                                            Yearly
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Days Horizontal Scroll */}
                            <ScrollView
                                ref={scrollViewRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.daysScrollContent}
                                pointerEvents={isEditing ? 'auto' : 'none'}
                            >
                                {daysData.map((item) => {
                                    const isSelected = isSameDay(item.fullDate, date);

                                    return (
                                        <TouchableOpacity
                                            key={item.date}
                                            style={[styles.dayItem, { marginRight: 16 }]}
                                            onPress={() => handleDateSelect(item.fullDate)}
                                        >
                                            <Text style={[styles.dayLabel, { color: subTextColor }]}>{item.day}</Text>
                                            <View style={[styles.dateContainer, isSelected && styles.dateContainerActive, !isSelected && isDarkMode && { backgroundColor: '#374151' }]}>
                                                <Text style={[styles.dateLabel, isSelected && styles.dateLabelActive, !isSelected && { color: textColor }]}>{item.date}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                })}
                            </ScrollView>
                        </View>
                    </View>

                    {/* History Section (Visible in both, but Action Buttons moved) */}
                    {editingSubscription && (
                        <>
                            <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>History</Text>
                            {subscriptionHistory.length === 0 ? (
                                <Text style={[styles.emptyHistory, { color: subTextColor }]}>No payments yet.</Text>
                            ) : (
                                <View style={[styles.historyList, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                                    {subscriptionHistory.map((item, index) => (
                                        <View
                                            key={item.id}
                                            style={[
                                                styles.historyItem,
                                                index !== subscriptionHistory.length - 1 && {
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
                                                },
                                            ]}
                                        >
                                            <View>
                                                <Text style={[styles.historyDate, { color: textColor }]}>
                                                    {new Date(item.date).toLocaleDateString()}
                                                </Text>
                                                <Text style={[styles.historyTime, { color: subTextColor }]}>
                                                    {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            <Text style={[styles.historyAmount, { color: '#10B981' }]}>
                                                ₹{item.amount.toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Removed actionButtonsRow from here */}
                        </>
                    )}

                </ScrollView>

                <View style={[styles.footer, { borderTopColor: footerBorder }]}>
                    {isEditing ? (
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                { backgroundColor: isDarkMode ? '#FF7043' : '#1F2937' }
                            ]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>
                                {editingSubscription ? 'Update Subscription' : 'Save Subscription'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={[styles.payButton, { backgroundColor: isDarkMode ? '#10B981' : '#059669' }]}
                                onPress={handlePaySubscription}
                                disabled={isPaying}
                            >
                                {isPaying ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Icon name="card-outline" size={20} color="#fff" />
                                        <Text style={styles.payButtonText}>Pay</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDeleteSubscription}
                            >
                                <Icon name="trash-outline" size={20} color="#EF4444" />
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
    },
    saveButton: {
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    // Calendar Styles
    calendarCard: {
        borderRadius: 24,
        padding: 16,
        width: '100%',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        width: '100%',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
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
        width: 36,
        height: 36,
        borderRadius: 12,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    emptyHistory: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        fontSize: 14,
    },
    historyList: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
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
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    payButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        gap: 8,
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddSubscriptionScreen;

