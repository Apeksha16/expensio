import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const RECENT_GROUPS = [
    { id: 1, name: 'Goa Trip', members: 4, owes: 'You owe ₹450' },
    { id: 2, name: 'Flatmates', members: 3, owes: 'You are owed ₹1,200' },
];

const FRIENDS = [
    { id: 1, name: 'Rahul', status: 'Owes you ₹500' },
    { id: 2, name: 'Priya', status: 'You owe ₹200' },
    { id: 3, name: 'Amit', status: 'Settled' },
    { id: 4, name: 'Sneha', status: 'Settled' },
];

export default function GroupSplits() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                            <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-[#1E1E2D] ml-4">Split Bill</Text>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="search-outline" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-4">

                    {/* Create New Action */}
                    <TouchableOpacity
                        onPress={() => router.push('/create-group')}
                        className="flex-row items-center bg-[#FF6A3D] p-4 rounded-[24px] shadow-lg shadow-orange-500/30 mb-8"
                    >
                        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                            <Ionicons name="people" size={24} color="white" />
                        </View>
                        <View className="ml-4">
                            <Text className="text-white font-bold text-lg">Create New Group</Text>
                            <Text className="text-white/80 text-xs">Start a new split with friends</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" className="ml-auto" />
                    </TouchableOpacity>

                    {/* Recent Groups */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Your Groups</Text>
                    <View className="gap-4 mb-8">
                        {RECENT_GROUPS.map((group) => (
                            <TouchableOpacity
                                key={group.id}
                                className="bg-white p-4 rounded-[24px] shadow-sm flex-row items-center justify-between"
                                onPress={() => router.push({ pathname: '/group-detail', params: { id: group.id } })}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center">
                                        <Text className="text-xl">🏖️</Text>
                                    </View>
                                    <View className="ml-4">
                                        <Text className="text-[#1E1E2D] font-bold text-base">{group.name}</Text>
                                        <Text className={`text-xs ${group.owes.includes('owe ₹') ? 'text-red-500' : 'text-green-500'}`}>{group.owes}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Recent Friends */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Friends</Text>
                    <View className="gap-4">
                        {FRIENDS.map((friend) => (
                            <TouchableOpacity
                                key={friend.id}
                                className="bg-white p-4 rounded-[24px] shadow-sm flex-row items-center justify-between"
                                onPress={() => router.push({ pathname: '/friend-detail', params: { id: friend.id } })}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-[#7B4DFF]/10 rounded-full items-center justify-center">
                                        <Text className="text-[#7B4DFF] font-bold">{friend.name[0]}</Text>
                                    </View>
                                    <View className="ml-4">
                                        <Text className="text-[#1E1E2D] font-bold text-base">{friend.name}</Text>
                                        <Text className="text-gray-400 text-xs">{friend.status}</Text>
                                    </View>
                                </View>
                                <View className="w-8 h-8 rounded-full border border-gray-200 items-center justify-center">
                                    <Ionicons name="add" size={20} color="#1E1E2D" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
