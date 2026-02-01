import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';


interface QuickActionModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (screen: string, params?: any) => void;
}

const QuickActionModal = ({ visible, onClose, onNavigate }: QuickActionModalProps) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.menuContainer}>
                            {/* Add Income */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    onNavigate('AddTransaction', { type: 'income' });
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="cash-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Add Income</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Add Expense */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    onNavigate('AddTransaction', { type: 'expense' });
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="wallet-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Add Expense</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Add Subscription */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    onNavigate('AddSubscription');
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="calendar-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Add Subscription</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Add Budget */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    onNavigate('BudgetForm');
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="pie-chart-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Add Budget</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Add Goals */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    onNavigate('AddGoal');
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="trophy-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Add Goals</Text>
                            </TouchableOpacity>


                        </View>
                    </TouchableWithoutFeedback>

                    {/* Close Button Removed as per request */}
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent dim
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40, // Adjust based on tab bar height
    },
    menuContainer: {
        backgroundColor: '#1E1B2E', // Dark purple/black shade
        width: 250,
        borderRadius: 16,
        paddingVertical: 8,
        marginBottom: 80, // Keep space above where the FAB would be
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginRight: 12,
    },
    menuText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 16,
    },
});

export default QuickActionModal;
