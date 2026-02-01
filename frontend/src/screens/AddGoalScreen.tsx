import React, { useState, useRef, useEffect } from 'react';
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
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useToast } from '../components/Toast';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useGoals } from '../context/GoalContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 48; // 32px container + 16px margin

const AddGoalScreen = ({ navigation }: { navigation: any }) => {
    const { addGoal, loading } = useGoals();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | null>(null);
    const { showToast } = useToast();
    const { isDarkMode } = useTheme();

    // Calendar State
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        if (now.getDate() === daysInCurrentMonth) {
            // Last day of month, move to next month
            return new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        return now;
    });
    const scrollViewRef = useRef<ScrollView>(null);

    const handleTitleChange = (text: string) => {
        // Remove allowed special characters, keep alphanumeric and spaces
        const cleaned = text.replace(/[^a-zA-Z0-9\s]/g, '');
        setTitle(cleaned);
    };

    const handleAmountChange = (text: string) => {
        // Remove non-digits
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned) {
            // Format with commas (using Indian locale for standard ₹ formatting or en-US)
            // efficient way to add commas
            const formatted = Number(cleaned).toLocaleString('en-IN');
            setAmount(formatted);
        } else {
            setAmount('');
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showToast('Please enter a goal name', 'error');
            return;
        }
        if (!amount) {
            showToast('Please enter a target amount', 'error');
            return;
        }
        if (!date) {
            showToast('Please select a target date', 'error');
            return;
        }

        try {
            await addGoal({
                title: title.trim(),
                targetAmount: parseFloat(amount.replace(/,/g, '')),
                targetDate: date
            });
            showToast('Goal Created Successfully', 'success');
            navigation.goBack();
        } catch (error) {
            console.error('Failed to create goal:', error);
            showToast('Failed to create goal', 'error');
        }
    };

    // Calendar Logic
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

    // Auto-scroll to center selected date when modal opens or month changes
    useEffect(() => {
        if (scrollViewRef.current && date && isSameDay(date, currentDate)) {
            // If we have a selected date in the current view
            scrollToDate(date);
        } else if (scrollViewRef.current && !date && isSameDay(new Date(), currentDate)) {
            // Default to today if no date selected
            scrollToDate(new Date());
        }
    }, [currentDate, date]);

    const scrollToDate = (targetDate: Date) => {
        const dateIndex = targetDate.getDate() - 1;
        const containerWidth = width - 48; // Screen padding 24 * 2
        const position = (dateIndex * ITEM_WIDTH) - (containerWidth / 2) + (ITEM_WIDTH / 2);
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ x: Math.max(0, position), animated: true });
        }, 100);
    };

    const handleDateSelect = (selectedDate: Date) => {
        setDate(selectedDate);
    };

    // Theme Colors
    const textColor = isDarkMode ? '#F9FAFB' : '#1F2937';
    const subTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const inputBg = isDarkMode ? '#1F2937' : '#F9FAFB';
    const inputBorder = isDarkMode ? '#374151' : '#F3F4F6';
    const labelColor = isDarkMode ? '#D1D5DB' : '#374151';
    const placeholderColor = isDarkMode ? '#6B7280' : '#9CA3AF';
    const containerBg = isDarkMode ? '#111827' : '#fff';
    const modalOverlay = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';
    const calendarBg = isDarkMode ? '#1F2937' : '#fff';

    const daysData = getDaysInMonth(currentDate);

    return (
        <ScreenWrapper
            title="New Goal"
            showBack={true}
            backgroundColor={containerBg}
        >

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Amount Input (Top) */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: textColor }]}>₹</Text>
                        <TextInput
                            style={[
                                styles.amountInput,
                                { color: textColor },
                                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                            ]}
                            placeholder="0"
                            placeholderTextColor={isDarkMode ? '#4B5563' : '#D1D5DB'}
                            keyboardType="numeric"
                            maxLength={10}
                            value={amount}
                            onChangeText={handleAmountChange}
                            autoFocus
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: labelColor }]}>Goal Name</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: inputBg,
                                    borderColor: inputBorder,
                                    color: textColor
                                }
                            ]}
                            placeholder="e.g. New Laptop"
                            placeholderTextColor={placeholderColor}
                            value={title}
                            onChangeText={handleTitleChange}
                        />
                    </View>



                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: labelColor }]}>Target Date</Text>
                        <View
                            style={[styles.calendarCard, { backgroundColor: calendarBg, padding: 16, marginTop: 12 }]}
                        >
                            {/* Month Navigation */}
                            <View style={styles.calendarHeader}>
                                <TouchableOpacity
                                    onPress={handlePrevMonth}
                                    disabled={(() => {
                                        const now = new Date();
                                        const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                                        // If today is last day of month, min valid month is next month
                                        const isLastDay = now.getDate() === daysInCurrentMonth;

                                        const minMonth = isLastDay ? now.getMonth() + 1 : now.getMonth();
                                        const minYear = isLastDay && minMonth === 12 ? now.getFullYear() + 1 : now.getFullYear();
                                        // Handle December rollover for minMonth
                                        const adjustedMinMonth = minMonth === 12 ? 0 : minMonth;

                                        return currentDate.getFullYear() < minYear ||
                                            (currentDate.getFullYear() === minYear && currentDate.getMonth() <= adjustedMinMonth);
                                    })()}
                                    style={{
                                        opacity: (() => {
                                            const now = new Date();
                                            const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                                            const isLastDay = now.getDate() === daysInCurrentMonth;

                                            const minMonth = isLastDay ? now.getMonth() + 1 : now.getMonth();
                                            const minYear = isLastDay && minMonth === 12 ? now.getFullYear() + 1 : now.getFullYear();
                                            const adjustedMinMonth = minMonth === 12 ? 0 : minMonth;

                                            return (currentDate.getFullYear() < minYear ||
                                                (currentDate.getFullYear() === minYear && currentDate.getMonth() <= adjustedMinMonth)) ? 0.3 : 1;
                                        })()
                                    }}
                                >
                                    <Icon name="chevron-back" size={20} color={textColor} />
                                </TouchableOpacity>
                                <Text style={[styles.monthTitle, { color: textColor }]}>
                                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Text>
                                <TouchableOpacity onPress={handleNextMonth}>
                                    <Icon name="chevron-forward" size={20} color={textColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Days Horizontal Scroll */}
                            <ScrollView
                                ref={scrollViewRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.daysScrollContent}
                            >
                                {daysData.map((item) => {
                                    const isSelected = date ? isSameDay(item.fullDate, date) : false;
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isPast = item.fullDate <= today;

                                    return (
                                        <TouchableOpacity
                                            key={item.date}
                                            style={[styles.dayItem, { marginRight: 16 }, isPast && { opacity: 0.3 }]}
                                            onPress={() => !isPast && handleDateSelect(item.fullDate)}
                                            disabled={isPast}
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
                        {date && (
                            <Text style={{ marginTop: 12, fontSize: 14, color: subTextColor, fontWeight: '500', textAlign: 'left', paddingHorizontal: 4 }}>
                                {(() => {
                                    const now = new Date();
                                    now.setHours(0, 0, 0, 0);
                                    const target = new Date(date);
                                    target.setHours(0, 0, 0, 0);

                                    let years = target.getFullYear() - now.getFullYear();
                                    let months = target.getMonth() - now.getMonth();
                                    let days = target.getDate() - now.getDate();

                                    if (days < 0) {
                                        months--;
                                        const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
                                        days += prevMonth.getDate();
                                    }
                                    if (months < 0) {
                                        years--;
                                        months += 12;
                                    }

                                    const parts = [];
                                    if (years > 0) parts.push(`${years} yr`);
                                    if (months > 0) parts.push(`${months} months`);
                                    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

                                    return parts.length > 0 ? parts.join('  ') : 'Today';
                                })()}
                            </Text>
                        )}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            {
                                backgroundColor: isDarkMode ? '#FF7043' : '#1F2937',
                                opacity: (!title.trim() || !amount || !date || loading) ? 0.5 : 1
                            }
                        ]}
                        onPress={handleSave}
                        disabled={!title.trim() || !amount || !date || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.saveButtonText, { color: '#fff' }]}>Create Goal</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
        fontSize: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
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
        fontSize: 18,
        fontWeight: '700',
    },
    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        minWidth: 50,
        textAlign: 'left',
    },
    // Calendar Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    calendarCard: {
        borderRadius: 32,
        padding: 24,
        width: '100%',
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
});

export default AddGoalScreen;
