import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SUGGESTED_FRIENDS = [
    { id: 1, name: 'Rahul', selected: false },
    { id: 2, name: 'Priya', selected: false },
    { id: 3, name: 'Amit', selected: false },
    { id: 4, name: 'Sneha', selected: false },
    { id: 5, name: 'Vikram', selected: false },
];

export default function CreateGroup() {
    const router = useRouter();
    const [groupName, setGroupName] = useState('');
    const [friends, setFriends] = useState(SUGGESTED_FRIENDS);

    const toggleFriend = (id: number) => {
        setFriends(friends.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
    };

    const selectedCount = friends.filter(f => f.selected).length;

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-[#1E1E2D] ml-4">New Group</Text>
                </View>

                <ScrollView className="flex-1 px-6 pt-6">

                    {/* Group Icon Placeholder */}
                    <View className="items-center mb-8">
                        <View className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-sm border border-dashed border-gray-300">
                            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                        </View>
                        <Text className="text-[#FF6A3D] font-medium mt-3">Upload Cover Photo</Text>
                    </View>

                    {/* Group Name Input */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Group Name</Text>
                    <View className="bg-white rounded-2xl p-4 shadow-sm mb-8">
                        <TextInput
                            className="text-[#1E1E2D] text-base"
                            placeholder="e.g. Goa Trip 2023"
                            value={groupName}
                            onChangeText={setGroupName}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Add Members */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-[#1E1E2D]">Add Members</Text>
                        <Text className="text-gray-400 text-sm">{selectedCount} selected</Text>
                    </View>

                    <View className="gap-3 mb-8">
                        {friends.map((friend) => (
                            <TouchableOpacity
                                key={friend.id}
                                className={`flex-row items-center justify-between p-4 rounded-2xl border ${friend.selected ? 'bg-white border-[#FF6A3D] shadow-sm' : 'bg-white border-transparent'}`}
                                onPress={() => toggleFriend(friend.id)}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                        <Text className="text-gray-600 font-bold">{friend.name[0]}</Text>
                                    </View>
                                    <Text className="text-[#1E1E2D] font-medium ml-3">{friend.name}</Text>
                                </View>
                                <View className={`w-6 h-6 rounded-full border items-center justify-center ${friend.selected ? 'bg-[#FF6A3D] border-[#FF6A3D]' : 'border-gray-300'}`}>
                                    {friend.selected && <Ionicons name="checkmark" size={16} color="white" />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Create Button */}
                <View className="p-6 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <TouchableOpacity
                        className="w-full bg-[#1E1E2D] h-14 rounded-[20px] items-center justify-center shadow-lg shadow-black/20"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-bold text-lg">Create Group</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
