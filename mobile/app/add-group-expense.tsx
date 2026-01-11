import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
    { id: 1, name: 'Food', icon: 'fast-food-outline', color: '#FF6A3D' },
    { id: 2, name: 'Shopping', icon: 'cart-outline', color: '#7B4DFF' },
    { id: 3, name: 'Transport', icon: 'bus-outline', color: '#F59E0B' },
    { id: 4, name: 'Stay', icon: 'bed-outline', color: '#EF4444' },
    { id: 5, name: 'Activity', icon: 'ticket-outline', color: '#10B981' },
    { id: 6, name: 'Other', icon: 'options-outline', color: '#6B7280' },
];

export default function AddGroupExpense() {
    const router = useRouter();
    const { id, groupName } = useLocalSearchParams();
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(1);
    const [note, setNote] = useState('');
    const [paidBy, setPaidBy] = useState('You');
    const [splitType, setSplitType] = useState('Equally');

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <View className="ml-4">
                        <Text className="text-xl font-bold text-[#1E1E2D]">Add Expense</Text>
                        <Text className="text-gray-400 text-xs">to {groupName || 'Group'}</Text>
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

                    {/* Split Settings */}
                    <View className="flex-row justify-between mb-8">
                        <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm mr-2 flex-row justify-between items-center">
                            <View>
                                <Text className="text-gray-400 text-xs text-left">Paid by</Text>
                                <Text className="text-[#1E1E2D] font-bold">{paidBy}</Text>
                            </View>
                            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm ml-2 flex-row justify-between items-center">
                            <View>
                                <Text className="text-gray-400 text-xs text-left">Split</Text>
                                <Text className="text-[#1E1E2D] font-bold text-left">{splitType}</Text>
                            </View>
                            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Categories */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Category</Text>
                    <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(cat.id)}
                                className={`w-[30%] items-center justify-center p-4 rounded-2xl border ${selectedCategory === cat.id ? 'bg-white border-[#FF6A3D] shadow-sm' : 'bg-white border-transparent'}`}
                            >
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                                    style={{ backgroundColor: selectedCategory === cat.id ? cat.color : '#F3F4F6' }}
                                >
                                    <Ionicons name={cat.icon as any} size={20} color={selectedCategory === cat.id ? '#FFF' : '#9CA3AF'} />
                                </View>
                                <Text className={`text-xs font-medium ${selectedCategory === cat.id ? 'text-[#1E1E2D]' : 'text-gray-400'}`}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
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
                        className="w-full bg-[#1E1E2D] h-14 rounded-[20px] items-center justify-center shadow-lg shadow-black/20"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-bold text-lg">Add Group Expense</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
