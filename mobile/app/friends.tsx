import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Friends() {
    const router = useRouter();
    // Start with minimal mock data or empty to show the "No friends" state first as requested
    // For demonstration, I'll start with empty and allow adding.
    const [friends, setFriends] = useState<any[]>([]);

    const addMockFriend = () => {
        const newFriend = {
            id: friends.length + 1,
            name: `Friend ${friends.length + 1}`,
            status: 'Settled',
            initial: String.fromCharCode(65 + friends.length) // A, B, C...
        };
        setFriends([...friends, newFriend]);
    };

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <Text className="text-2xl font-bold text-[#1E1E2D]">Friends</Text>
                    <TouchableOpacity
                        className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm"
                        onPress={addMockFriend} // Quick way to demo "adding" for now
                    >
                        <Ionicons name="person-add-outline" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-4">

                    {friends.length === 0 ? (
                        /* EMPTY STATE */
                        <View className="flex-1 items-center justify-center mt-20">
                            <View className="w-40 h-40 bg-gray-100 rounded-full items-center justify-center mb-6">
                                <Ionicons name="people-outline" size={80} color="#9CA3AF" />
                            </View>
                            <Text className="text-xl font-bold text-[#1E1E2D] mb-2">No Friends Yet</Text>
                            <Text className="text-gray-400 text-center mb-8 px-8">
                                Add friends to split bills and track expenses together.
                            </Text>
                            <TouchableOpacity
                                className="bg-[#FF6A3D] px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/30 w-full"
                                onPress={addMockFriend}
                            >
                                <Text className="text-white font-bold text-center text-lg">Add a Friend</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* POPULATED LIST */
                        <View className="gap-4 pb-24">
                            {/* Friend Request / Pending placeholder could go here */}

                            <Text className="text-lg font-bold text-[#1E1E2D] mb-2">My Friends ({friends.length})</Text>

                            {friends.map((friend) => (
                                <TouchableOpacity
                                    key={friend.id}
                                    className="bg-white p-4 rounded-[24px] shadow-sm flex-row items-center justify-between"
                                    onPress={() => router.push({ pathname: '/friend-detail', params: { id: friend.id } })}
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-[#7B4DFF]/10 rounded-full items-center justify-center">
                                            <Text className="text-[#7B4DFF] font-bold text-lg">{friend.initial}</Text>
                                        </View>
                                        <View className="ml-4">
                                            <Text className="text-[#1E1E2D] font-bold text-base">{friend.name}</Text>
                                            <Text className="text-gray-400 text-xs">{friend.status}</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                </ScrollView>

                {/* --- CUSTOM BOTTOM NAVIGATION (Replicated) --- */}
                <View className="absolute bottom-0 left-0 right-0 h-[100px] bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex-row justify-evenly items-center px-2 pb-4">
                    <TouchableOpacity
                        className="items-center justify-center w-14 h-14"
                        onPress={() => router.push('/dashboard')}
                    >
                        <Ionicons name="home-outline" size={26} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="items-center justify-center w-14 h-14"
                        onPress={() => router.push('/expenses')}
                    >
                        <Ionicons name="card-outline" size={26} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="w-16 h-16 bg-[#FF6A3D] rounded-full items-center justify-center shadow-lg shadow-orange-500/40 -mt-8"
                        activeOpacity={0.8}
                    // FAB is generic here, assumes dashboard-like or quick add
                    >
                        <Ionicons name="add" size={38} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="items-center justify-center w-14 h-14"
                        onPress={() => router.push('/savings')}
                    >
                        <Ionicons name="calendar-outline" size={26} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center justify-center w-14 h-14">
                        <Ionicons name="people" size={26} color="#FF6A3D" />
                        <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1" />
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
