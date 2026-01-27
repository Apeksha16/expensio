import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const SHARED_EXPENSES = [
    { id: '1', title: 'Lunch at Cafe', amount: '₹1,200', paidBy: 'You', date: 'Yesterday', icon: 'pizza' },
    { id: '2', title: 'Movie Tickets', amount: '₹800', paidBy: 'Rahul', date: '2 days ago', icon: 'ticket' },
];

const FriendDetailsScreen = ({ navigation }: { navigation: any }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Icon name="person" size={24} color="#fff" />
                    </View>
                    <Text style={styles.headerTitle}>Rahul</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton}>
                    <Icon name="ellipsis-vertical" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Rahul owes you</Text>
                    <Text style={styles.balanceAmount}>₹400</Text>
                    <TouchableOpacity style={styles.settleButton}>
                        <Text style={styles.settleButtonText}>Settle Up</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Shared Expenses</Text>

                {/* Expenses List */}
                <View>
                    {SHARED_EXPENSES.map((item) => (
                        <View key={item.id} style={styles.expenseItem}>
                            <View style={styles.iconContainer}>
                                <Icon name={item.icon} size={24} color="#8B5CF6" />
                            </View>
                            <View style={styles.expenseInfo}>
                                <Text style={styles.expenseTitle}>{item.title}</Text>
                                <Text style={styles.expenseSubtitle}>Paid by {item.paidBy} • {item.date}</Text>
                            </View>
                            <Text style={styles.expenseAmount}>{item.amount}</Text>
                        </View>
                    ))}
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
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#A78BFA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    settingsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    balanceCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    balanceLabel: {
        fontSize: 16,
        color: '#4CAF50', // Green for owes you
        marginBottom: 8,
        fontWeight: '600',
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 24,
    },
    settleButton: {
        backgroundColor: '#1E1B2E',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    settleButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3E8FF', // Light Purple
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    expenseSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
});

export default FriendDetailsScreen;
