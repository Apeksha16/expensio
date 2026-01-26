import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const SplitBillScreen = ({ navigation }: { navigation: any }) => {
    const groups = [
        { id: '1', name: 'Goa Trip', status: 'You owe ₹450', color: '#FEE2E2', statusColor: '#EF4444' }, // Red for owe
        { id: '2', name: 'Flatmates', status: 'You are owed ₹1,200', color: '#DCFCE7', statusColor: '#22C55E' }, // Green for owed
    ];

    const friends = [
        { id: '1', name: 'Rahul', status: 'Owes you ₹500', initial: 'R', color: '#F3E8FF' },
        { id: '2', name: 'Priya', status: 'You owe ₹200', initial: 'P', color: '#F3E8FF' },
        { id: '3', name: 'Amit', status: 'Settled', initial: 'A', color: '#F3E8FF' },
        { id: '4', name: 'Sneha', status: 'Settled', initial: 'S', color: '#F3E8FF' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Split Bill</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Icon name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Create New Group Banner */}
                <TouchableOpacity style={styles.createGroupBanner}>
                    <View style={styles.createIconCircle}>
                        <Icon name="people" size={24} color="#fff" />
                    </View>
                    <View style={styles.createGroupTextContainer}>
                        <Text style={styles.createGroupTitle}>Create New Group</Text>
                        <Text style={styles.createGroupSubtitle}>Start a new split with friends</Text>
                    </View>
                    <Icon name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Your Groups */}
                <Text style={styles.sectionTitle}>Your Groups</Text>
                <View style={styles.groupsList}>
                    {groups.map(group => (
                        <TouchableOpacity key={group.id} style={styles.groupCard}>
                            <View style={styles.groupIconPlaceholder}>
                                {/* Mock Umbrella/Beach Icon */}
                                <Icon name="briefcase" size={24} color="#FFA500" />
                            </View>
                            <View style={styles.groupInfo}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                <Text style={[styles.groupStatus, { color: group.statusColor }]}>{group.status}</Text>
                            </View>
                            <Icon name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Friends */}
                <Text style={styles.sectionTitle}>Friends</Text>
                <View style={styles.friendsList}>
                    {friends.map(friend => (
                        <View key={friend.id} style={styles.friendCard}>
                            <View style={[styles.avatarCircle, { backgroundColor: friend.color }]}>
                                <Text style={styles.avatarInitial}>{friend.initial}</Text>
                            </View>
                            <View style={styles.friendInfo}>
                                <Text style={styles.friendName}>{friend.name}</Text>
                                <Text style={styles.friendStatus}>{friend.status}</Text>
                            </View>
                            <TouchableOpacity style={styles.addButton}>
                                <Icon name="add" size={20} color="#1F2937" />
                            </TouchableOpacity>
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
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    searchButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    createGroupBanner: {
        backgroundColor: '#FF7043',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    createIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    createGroupTextContainer: {
        flex: 1,
    },
    createGroupTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    createGroupSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    groupsList: {
        marginBottom: 32,
    },
    groupCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    groupIconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    groupStatus: {
        fontSize: 12,
        fontWeight: '500',
    },
    friendsList: {

    },
    friendCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24, // Circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: '#8B5CF6', // Purple Text
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    friendStatus: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6', // Light grey circle
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SplitBillScreen;
