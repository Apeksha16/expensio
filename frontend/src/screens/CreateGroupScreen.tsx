import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const FRIENDS_DATA = [
    { id: '1', name: 'Rahul', initial: 'R', color: '#F3E8FF' },
    { id: '2', name: 'Priya', initial: 'P', color: '#F3E8FF' },
    { id: '3', name: 'Amit', initial: 'A', color: '#F3E8FF' },
    { id: '4', name: 'Sneha', initial: 'S', color: '#F3E8FF' },
    { id: '5', name: 'Vikram', initial: 'V', color: '#F3E8FF' },
];

const CreateGroupScreen = ({ navigation }: { navigation: any }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const toggleMember = (id: string) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(selectedMembers.filter(m => m !== id));
        } else {
            setSelectedMembers([...selectedMembers, id]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Group</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Group Name Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Group Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Goa Trip"
                        placeholderTextColor="#9CA3AF"
                        value={groupName}
                        onChangeText={setGroupName}
                        autoFocus
                    />
                </View>

                {/* Add Members Section */}
                <Text style={styles.sectionTitle}>Add Members</Text>
                <View style={styles.membersList}>
                    {FRIENDS_DATA.map((friend) => {
                        const isSelected = selectedMembers.includes(friend.id);
                        return (
                            <TouchableOpacity
                                key={friend.id}
                                style={[styles.memberCard, isSelected && styles.memberCardActive]}
                                onPress={() => toggleMember(friend.id)}
                            >
                                <View style={[styles.avatarCircle, { backgroundColor: friend.color }]}>
                                    <Text style={styles.avatarInitial}>{friend.initial}</Text>
                                </View>
                                <Text style={styles.memberName}>{friend.name}</Text>
                                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                    {isSelected && <Icon name="checkmark" size={14} color="#fff" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createButton, { opacity: groupName ? 1 : 0.6 }]}
                    disabled={!groupName}
                    onPress={() => {
                        // Logic to create group would go here
                        navigation.goBack();
                    }}
                >
                    <Text style={styles.createButtonText}>Create Group</Text>
                </TouchableOpacity>
            </View>
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
    content: {
        padding: 24,
    },
    inputContainer: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    membersList: {
        gap: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    memberCardActive: {
        borderColor: '#FF7043',
        backgroundColor: '#FFF7ED',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarInitial: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    memberName: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxActive: {
        backgroundColor: '#FF7043',
        borderColor: '#FF7043',
    },
    footer: {
        padding: 24,
        backgroundColor: '#F9FAFB',
    },
    createButton: {
        height: 56,
        backgroundColor: '#FF7043',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default CreateGroupScreen;
