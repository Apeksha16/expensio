import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddFriendExpense() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState('lent'); // 'lent' or 'borrowed'

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <View className="ml-4">
                        <Text className="text-xl font-bold text-[#1E1E2D]">Add Transaction</Text>
                        <Text className="text-gray-400 text-xs">with Rahul</Text>
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

                    {/* Type Toggle */}
                    <View className="flex-row bg-white rounded-2xl p-1 mb-8 shadow-sm">
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-xl items-center ${type === 'lent' ? 'bg-[#FF6A3D]' : 'bg-transparent'}`}
                            onPress={() => setType('lent')}
                        >
                            <Text className={`font-bold ${type === 'lent' ? 'text-white' : 'text-gray-400'}`}>You lent</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-xl items-center ${type === 'borrowed' ? 'bg-[#EF4444]' : 'bg-transparent'}`}
                            onPress={() => setType('borrowed')}
                        >
                            <Text className={`font-bold ${type === 'borrowed' ? 'text-white' : 'text-gray-400'}`}>You borrowed</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Note Input */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Note</Text>
                    <View className="bg-white rounded-2xl p-4 shadow-sm mb-8">
                        <TextInput
                            className="text-[#1E1E2D] text-base"
                            placeholder="What was this for?"
                            value={note}
                            onChangeText={setNote}
                            placeholderTextColor="#9CA3AF"
                            multiline
                        />
                    </View>

                </ScrollView>

                {/* Save Button */}
                <View className="p-6 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <TouchableOpacity
                        className={`w-full h-14 rounded-[20px] items-center justify-center shadow-lg ${type === 'lent' ? 'bg-[#FF6A3D] shadow-orange-500/20' : 'bg-[#EF4444] shadow-red-500/20'}`}
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-bold text-lg">Save Transaction</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
