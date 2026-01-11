import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SAVING_GOALS = [
    {
        id: 1,
        title: 'GoPro Camera',
        targetAmount: 50000,
        savedAmount: 15000,
        deadline: '16 Jul 2023',
        icon: 'camera',
        color: '#FF6A3D'
    },
    {
        id: 2,
        title: 'MacBook Pro',
        targetAmount: 200000,
        savedAmount: 45000,
        deadline: '25 Dec 2023',
        icon: 'laptop',
        color: '#7B4DFF'
    },
    {
        id: 3,
        title: 'Bali Trip',
        targetAmount: 80000,
        savedAmount: 80000,
        deadline: '10 Aug 2023',
        icon: 'airplane',
        color: '#10B981'
    }
];

export default function Savings() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <Text className="text-2xl font-bold text-[#1E1E2D]">Savings Goals</Text>
                    <TouchableOpacity className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="notifications-outline" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-2">

                    {/* Total Savings Card */}
                    <View className="bg-[#1E1E2D] p-6 rounded-[32px] mb-8 shadow-lg shadow-black/20">
                        <Text className="text-gray-400 text-sm mb-1">Total Saved</Text>
                        <Text className="text-white font-bold text-4xl mb-6">₹1,40,000</Text>

                        <View className="flex-row justify-between items-center bg-white/10 p-4 rounded-2xl">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-[#22C55E]/20 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="trending-up" size={16} color="#22C55E" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold">+ ₹12,000</Text>
                                    <Text className="text-gray-400 text-[10px]">This Month</Text>
                                </View>
                            </View>
                            <TouchableOpacity className="bg-white px-4 py-2 rounded-xl">
                                <Text className="text-[#1E1E2D] font-bold text-xs">Add Funds</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Goals List */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-[#1E1E2D]">Your Goals</Text>
                        <TouchableOpacity onPress={() => router.push('/add-goal')}>
                            <Text className="text-[#FF6A3D] font-bold text-sm">+ Add New</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="gap-4 pb-24">
                        {SAVING_GOALS.map((goal) => {
                            const progress = (goal.savedAmount / goal.targetAmount) * 100;
                            const remaining = goal.targetAmount - goal.savedAmount;

                            return (
                                <TouchableOpacity
                                    key={goal.id}
                                    className="bg-white p-5 rounded-[24px] shadow-sm"
                                    onPress={() => router.push({ pathname: '/goal-detail', params: { id: goal.id } })}
                                >
                                    <View className="flex-row justify-between items-start mb-4">
                                        <View className="flex-row items-center">
                                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4`} style={{ backgroundColor: `${goal.color}20` }}>
                                                <Ionicons name={goal.icon as any} size={24} color={goal.color} />
                                            </View>
                                            <View>
                                                <Text className="text-[#1E1E2D] font-bold text-lg">{goal.title}</Text>
                                                <Text className="text-gray-400 text-xs">Target: {goal.deadline}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-[#1E1E2D] font-bold text-lg">₹{goal.targetAmount.toLocaleString()}</Text>
                                    </View>

                                    <View className="mb-2">
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-400 text-xs">Saved: ₹{goal.savedAmount.toLocaleString()}</Text>
                                            <Text className="text-gray-400 text-xs">{Math.round(progress)}%</Text>
                                        </View>
                                        <View className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <View
                                                className="h-full rounded-full"
                                                style={{ width: `${progress}%`, backgroundColor: goal.color }}
                                            />
                                        </View>
                                    </View>

                                    {remaining > 0 ? (
                                        <Text className="text-gray-400 text-xs mt-2">
                                            Save <Text className="font-bold text-[#1E1E2D]">₹{remaining.toLocaleString()}</Text> more to reach your goal
                                        </Text>
                                    ) : (
                                        <Text className="text-[#22C55E] text-xs font-bold mt-2">Goal Completed! 🎉</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </ScrollView>

                {/* --- CUSTOM BOTTOM NAVIGATION (Replicated for context) --- */}
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
                    >
                        <Ionicons name="add" size={38} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center justify-center w-14 h-14">
                        <Ionicons name="calendar" size={26} color="#FF6A3D" />
                        <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="items-center justify-center w-14 h-14"
                        onPress={() => router.push('/friends')}
                    >
                        <Ionicons name="people-outline" size={26} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
