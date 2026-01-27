import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';


interface QuickActionModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (screen: string) => void;
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
                            {/* Add Expense */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    onNavigate('AddExpense');
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="wallet-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Add Expense</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Group Splits */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    onNavigate('Split'); // Navigate to SplitBillScreen
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="people-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Group splits</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            {/* Add Income */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    onClose();
                                    // onNavigate('AddIncome'); 
                                    console.log("Add Income clicked");
                                }}
                            >
                                <View style={styles.iconContainer}>
                                    <Icon name="card-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.menuText}>Add Income</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>

                    {/* Close Button at bottom, aligned with FAB location */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={24} color="#fff" />
                    </TouchableOpacity>
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
        marginBottom: 80, // Space above the close button/FAB
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
    closeButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF7043',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 46, // Align with tab bar fab position (80 height - 30 offset roughly)
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default QuickActionModal;
