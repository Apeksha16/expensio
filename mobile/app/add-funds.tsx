import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddFunds() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [amount, setAmount] = useState('');

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <View className="ml-4">
                        <Text className="text-xl font-bold text-[#1E1E2D]">Add Funds</Text>
                        <Text className="text-gray-400 text-xs">to Savings Goal</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 pt-6">

                    {/* Amount Input */}
                    <View className="bg-white rounded-[32px] p-8 items-center shadow-sm mb-6">
                        <Text className="text-gray-400 font-medium mb-2">Enter Amount</Text>
                        <View className="flex-row items-center">
                            <Text className="text-4xl font-bold text-[#1E1E2D] mr-2">₹</Text>
                            <TextInput
                                className="text-5xl font-bold text-[#1E1E2D] min-w-[100px] text-center"
                                placeholder="0"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                placeholderTextColor="#E5E7EB"
                            />
                        </View>
                    </View>

                    {/* Payment Method Placeholder */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Payment Method</Text>
                    <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm mb-8 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="card-outline" size={20} color="#1E1E2D" />
                            </View>
                            <Text className="text-[#1E1E2D] font-bold text-base">Main Account</Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                </ScrollView>

                {/* Confirm Button */}
                <View className="p-6 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <TouchableOpacity
                        className="w-full bg-[#1E1E2D] h-14 rounded-[20px] items-center justify-center shadow-lg shadow-black/20"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-bold text-lg">Confirm Transfer</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
