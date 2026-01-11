import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SAVINGS_HISTORY = [
    { id: 1, amount: '₹5,000', date: 'Yesterday' },
    { id: 2, amount: '₹2,500', date: '01 July 2023' },
    { id: 3, amount: '₹7,500', date: '25 June 2023' },
];

export default function GoalDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    // Mock data for display
    const goal = {
        title: 'GoPro Camera',
        targetAmount: 50000,
        savedAmount: 15000,
        deadline: '16 Jul 2023',
        color: '#FF6A3D'
    };

    const progress = (goal.savedAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.savedAmount;

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="ellipsis-horizontal" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-4">

                    {/* Hero Icon */}
                    <View className="items-center mb-6">
                        <View className="w-24 h-24 rounded-[32px] items-center justify-center mb-4" style={{ backgroundColor: `${goal.color}20` }}>
                            <Ionicons name="camera" size={48} color={goal.color} />
                        </View>
                        <Text className="text-2xl font-bold text-[#1E1E2D] mb-1">{goal.title}</Text>
                        <Text className="text-gray-400 font-medium">by {goal.deadline}</Text>
                    </View>

                    {/* Progress Card */}
                    <View className="bg-white p-6 rounded-[32px] shadow-sm mb-8">
                        <View className="flex-row justify-between items-end mb-4">
                            <View>
                                <Text className="text-gray-400 text-xs mb-1">Total Saved</Text>
                                <Text className="text-[#1E1E2D] font-bold text-3xl">₹{goal.savedAmount.toLocaleString()}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-400 text-xs mb-1">Target</Text>
                                <Text className="text-[#1E1E2D] font-bold text-xl opacity-60">₹{goal.targetAmount.toLocaleString()}</Text>
                            </View>
                        </View>

                        <View className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                            <View
                                className="h-full rounded-full"
                                style={{ width: `${progress}%`, backgroundColor: goal.color }}
                            />
                        </View>
                        <Text className="text-[#1E1E2D] text-xs font-medium text-center">{Math.round(progress)}% Completed</Text>
                    </View>

                    {/* History */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Savings History</Text>
                    <View className="gap-4 mb-20">
                        {SAVINGS_HISTORY.map((item) => (
                            <View key={item.id} className="bg-white p-4 rounded-[24px] shadow-sm flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-[#22C55E]/10 rounded-full items-center justify-center">
                                        <Ionicons name="arrow-up" size={20} color="#22C55E" />
                                    </View>
                                    <View className="ml-4">
                                        <Text className="text-[#1E1E2D] font-bold text-base">Added Funds</Text>
                                        <Text className="text-gray-400 text-xs">{item.date}</Text>
                                    </View>
                                </View>
                                <Text className="text-[#22C55E] font-bold text-lg">+{item.amount}</Text>
                            </View>
                        ))}
                    </View>

                </ScrollView>

                {/* Add Funds Button */}
                <View className="absolute bottom-8 right-6 left-6">
                    <TouchableOpacity
                        className="w-full bg-[#1E1E2D] h-16 rounded-[24px] flex-row items-center justify-center shadow-lg shadow-black/20"
                        onPress={() => router.push({ pathname: '/add-funds', params: { id } })}
                    >
                        <Ionicons name="wallet-outline" size={24} color="white" />
                        <Text className="text-white font-bold text-lg ml-3">Add Funds</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
