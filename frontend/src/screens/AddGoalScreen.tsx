import React, { useState } from 'react';
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
} from 'react-native';
import { useToast } from '../components/Toast';
import Icon from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddGoalScreen = ({ navigation }: { navigation: any }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | null>(null);
    const [open, setOpen] = useState(false);
    const { showToast } = useToast();

    const handleSave = () => {
        if (!title || !amount) {
            showToast('Please enter a goal and amount', 'error');
            return;
        }
        // Save logic would go here (Context)
        showToast('Goal Created Successfully', 'success');
        navigation.goBack();
    };

    return (
        <ScreenWrapper
            title="New Goal"
            showBack={true}
        >

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Goal Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. New Laptop"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Target Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="₹ 1,00,000"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Target Date</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setOpen(true)}
                        >
                            <Text style={date ? styles.dateText : styles.datePlaceholder}>
                                {date ? date.toLocaleDateString() : 'Select Date'}
                            </Text>
                            <Icon name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Create Goal</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {open && (
                <DateTimePicker
                    value={date || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setOpen(false);
                        if (selectedDate) {
                            setDate(selectedDate);
                        }
                    }}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    dateText: {
        fontSize: 16,
        color: '#1F2937',
    },
    datePlaceholder: {
        fontSize: 16,
        color: '#9CA3AF',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default AddGoalScreen;
