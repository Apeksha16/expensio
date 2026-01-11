import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FRIEND_TRANSACTIONS = [
    { id: 1, title: 'Lunch', amount: '₹350', type: 'owe', date: 'Yesterday' },
    { id: 2, title: 'Movie Ticket', amount: '₹250', type: 'lent', date: 'Last Week' },
];

export default function FriendDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-[#1E1E2D]">Rahul</Text>
                    <TouchableOpacity className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="ellipsis-horizontal" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-6">

                    {/* Profile & Status */}
                    <View className="items-center mb-8">
                        <View className="w-24 h-24 bg-[#7B4DFF]/10 rounded-full items-center justify-center mb-4">
                            <Text className="text-[#7B4DFF] text-4xl font-bold">R</Text>
                        </View>
                        <Text className="text-gray-400 text-sm mb-1">Total Balance</Text>
                        <Text className="text-[#EF4444] font-bold text-3xl">You owe ₹500</Text>
                    </View>

                    {/* Actions */}
                    <View className="flex-row justify-center space-x-4 mb-8">
                        <TouchableOpacity className="bg-[#1E1E2D] px-6 py-3 rounded-xl shadow-lg shadow-black/20">
                            <Text className="text-white font-bold">Settle Up</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-white px-6 py-3 rounded-xl shadow-sm">
                            <Text className="text-[#1E1E2D] font-bold">Remind</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Transactions */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Transactions</Text>
                    <View className="gap-4">
                        {FRIEND_TRANSACTIONS.map((t) => (
                            <View key={t.id} className="bg-white p-4 rounded-[24px] shadow-sm flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center ${t.type === 'owe' ? 'bg-red-50' : 'bg-green-50'}`}>
                                        <Ionicons
                                            name={t.type === 'owe' ? 'arrow-down' : 'arrow-up'}
                                            size={20}
                                            color={t.type === 'owe' ? '#EF4444' : '#22C55E'}
                                        />
                                    </View>
                                    <View className="ml-4">
                                        <Text className="text-[#1E1E2D] font-bold text-base">{t.title}</Text>
                                        <Text className="text-gray-400 text-xs">{t.date}</Text>
                                    </View>
                                </View>
                                <Text className={`font-bold text-lg ${t.type === 'owe' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                                    {t.type === 'owe' ? '-' : '+'}{t.amount}
                                </Text>
                            </View>
                        ))}
                    </View>

                </ScrollView>

                {/* Add Transaction Button */}
                <View className="absolute bottom-8 right-6">
                    <TouchableOpacity
                        className="w-16 h-16 bg-[#FF6A3D] rounded-full items-center justify-center shadow-lg shadow-orange-500/40"
                        onPress={() => router.push({ pathname: '/add-friend-expense', params: { id } })}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
