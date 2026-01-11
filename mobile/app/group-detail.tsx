import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GROUP_EXPENSES = [
    { id: 1, title: 'Dinner at Britto\'s', amount: '₹2,400', paidBy: 'You', date: 'Yesterday' },
    { id: 2, title: 'Cab to Airport', amount: '₹800', paidBy: 'Rahul', date: '2 days ago' },
    { id: 3, title: 'Drinks', amount: '₹1,500', paidBy: 'Amit', date: '3 days ago' },
];

export default function GroupDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4 bg-white shadow-sm rounded-b-[32px] z-10">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-xl font-bold text-[#1E1E2D]">Goa Trip</Text>
                        <Text className="text-gray-400 text-xs">4 members</Text>
                    </View>
                    <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
                        <Ionicons name="settings-outline" size={20} color="#1E1E2D" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-6">

                    {/* Balance Card */}
                    <View className="bg-[#1E1E2D] p-6 rounded-[32px] mb-8 shadow-lg shadow-black/20">
                        <Text className="text-gray-400 text-sm mb-1">Your Total Share</Text>
                        <Text className="text-white font-bold text-3xl mb-4">₹4,500</Text>
                        <View className="h-[1px] bg-white/10 w-full mb-4" />
                        <View className="flex-row justify-between">
                            <View>
                                <Text className="text-gray-400 text-xs">You paid</Text>
                                <Text className="text-[#22C55E] font-bold text-lg">₹6,000</Text>
                            </View>
                            <View>
                                <Text className="text-gray-400 text-xs">You owe</Text>
                                <Text className="text-[#EF4444] font-bold text-lg">₹0</Text>
                            </View>
                            <View>
                                <Text className="text-gray-400 text-xs">Owed to you</Text>
                                <Text className="text-[#22C55E] font-bold text-lg">₹1,500</Text>
                            </View>
                        </View>
                    </View>

                    {/* Expenses List */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Expenses</Text>
                    <View className="gap-4 pb-20">
                        {GROUP_EXPENSES.map((expense) => (
                            <View key={expense.id} className="bg-white p-4 rounded-[24px] shadow-sm flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center">
                                        <Ionicons name="receipt-outline" size={20} color="#FF6A3D" />
                                    </View>
                                    <View className="ml-4">
                                        <Text className="text-[#1E1E2D] font-bold text-base">{expense.title}</Text>
                                        <Text className="text-gray-400 text-xs">Paid by {expense.paidBy}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[#1E1E2D] font-bold text-base">{expense.amount}</Text>
                                    <Text className="text-gray-400 text-[10px]">{expense.date}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                </ScrollView>

                {/* Add Expense Button */}
                <View className="absolute bottom-8 right-6">
                    <TouchableOpacity
                        className="w-16 h-16 bg-[#FF6A3D] rounded-full items-center justify-center shadow-lg shadow-orange-500/40"
                        onPress={() => router.push({ pathname: '/add-group-expense', params: { id, groupName: 'Goa Trip' } })}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
