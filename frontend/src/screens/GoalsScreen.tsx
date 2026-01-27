import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const GoalsScreen = ({ navigation }: { navigation: any }) => {
    const [modalVisible, setModalVisible] = useState(false);

    // Mock Data based on user request and image style
    const [goals, setGoals] = useState([
        {
            id: '1',
            title: 'Buy iPhone 17',
            targetAmount: 120000,
            savedAmount: 45000,
            deadline: '16th July',
            color: '#FF7043', // Red/Orange from image
            icon: 'phone-portrait'
        },
        {
            id: '2',
            title: 'Goa Trip',
            targetAmount: 50000,
            savedAmount: 35000,
            deadline: '20th Apr',
            color: '#8B5CF6', // Purple/Blue from image
            icon: 'airplane'
        },
        {
            id: '3',
            title: 'Emergency Fund',
            targetAmount: 100000,
            savedAmount: 80000,
            deadline: 'Dec 2026',
            color: '#10B981', // Green
            icon: 'shield-checkmark'
        },
    ]);

    const calculateProgress = (saved: number, target: number) => {
        return (saved / target) * 100;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Goals</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Featured / Active Goals */}
                <Text style={styles.sectionTitle}>Active Goals</Text>
                <View style={styles.gridContainer}>
                    {goals.map((goal) => {
                        const progress = calculateProgress(goal.savedAmount, goal.targetAmount);
                        return (
                            <TouchableOpacity key={goal.id} style={[styles.goalCard, { backgroundColor: goal.color }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}>
                                        <Icon name={goal.icon} size={20} color={goal.color} />
                                    </View>
                                    <TouchableOpacity>
                                        <Icon name="ellipsis-vertical" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.cardBody}>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalDeadline}>by {goal.deadline}</Text>

                                    <View style={styles.amountRow}>
                                        <Text style={styles.savedText}>₹{(goal.savedAmount / 1000).toFixed(0)}k</Text>
                                        <Text style={styles.targetText}>/ ₹{(goal.targetAmount / 1000).toFixed(0)}k</Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{progress.toFixed(0)}% completed</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Simple Add Goal Modal (Mock) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Goal</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Goal Name (e.g. iPhone 17)"
                            placeholderTextColor="#9CA3AF"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Target Amount (e.g. 120000)"
                            keyboardType="numeric"
                            placeholderTextColor="#9CA3AF"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Target Date (e.g. 16th July)"
                            placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                            style={styles.saveGoalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.saveGoalText}>Create Goal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
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
        minHeight: 180,
        justifyContent: 'space-between',
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
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
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
});

export default GoalsScreen;
