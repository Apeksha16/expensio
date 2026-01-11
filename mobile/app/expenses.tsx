import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const WEEK_DAYS = [
    { day: 'M', date: '20' },
    { day: 'T', date: '21' },
    { day: 'W', date: '22' },
    { day: 'T', date: '23' },
    { day: 'F', date: '24', active: true },
    { day: 'S', date: '25' },
    { day: 'S', date: '26' },
];

export default function Expenses() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* --- HEADER --- */}
                <View className="flex-row justify-between items-center px-6 py-4">
                    <View className="w-12 h-12 bg-[#9F7AF9] rounded-2xl items-center justify-center overflow-hidden">
                        <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                    <Text className="text-xl font-bold text-[#1E1E2D]">Expenses</Text>
                    <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm">
                        <Ionicons name="notifications-outline" size={24} color="#1E1E2D" />
                        <View className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* --- CALENDAR STRIP --- */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm">
                        <View className="flex-row justify-between items-center mb-6">
                            <TouchableOpacity><Ionicons name="chevron-back" size={20} color="#1E1E2D" /></TouchableOpacity>
                            <Text className="text-lg font-bold text-[#1E1E2D]">April 2022</Text>
                            <TouchableOpacity><Ionicons name="chevron-forward" size={20} color="#1E1E2D" /></TouchableOpacity>
                        </View>
                        <View className="flex-row justify-between">
                            {WEEK_DAYS.map((item, index) => (
                                <View key={index} className="items-center space-y-4">
                                    <Text className="text-gray-400 font-medium text-xs">{item.day}</Text>
                                    <View
                                        className={`w-10 h-10 items-center justify-center rounded-xl ${item.active ? 'bg-[#FF6A3D] shadow-lg shadow-orange-500/30' : ''}`}
                                    >
                                        <Text className={`font-bold ${item.active ? 'text-white' : 'text-[#1E1E2D]'}`}>
                                            {item.date}
                                        </Text>
                                        {item.active && <View className="absolute -bottom-2 w-1 h-1 bg-white rounded-full opacity-50" />}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* --- SUMMARY CARDS ROW --- */}
                    <View className="flex-row justify-between mb-8">
                        {/* Total Salary Card (Purple) */}
                        <View className="bg-[#7B4DFF] w-[48%] rounded-[32px] p-5 h-[180px] justify-between shadow-lg shadow-purple-500/30">
                            <View className="flex-row justify-between items-start">
                                <Text className="text-white/80 font-medium text-xs">Total Salary</Text>
                                <Ionicons name="ellipsis-vertical" size={16} color="white" />
                            </View>

                            <Text className="text-white font-bold text-2xl">₹7,000.00</Text>

                            <View>
                                <View className="w-8 h-5 border border-white/30 rounded mb-2 relative overflow-hidden">
                                    <View className="absolute top-1 left-0 right-0 h-[1px] bg-white/30" />
                                </View>
                                <Text className="text-white/80 text-[10px]">Bank Account</Text>
                                <Text className="text-white text-[10px] opacity-60">**** **** 1965</Text>
                            </View>

                            {/* Decorative Background Pattern */}
                            <View className="absolute right-0 bottom-0 opacity-10">
                                <Ionicons name="wifi-outline" size={100} color="white" />
                            </View>
                        </View>

                        {/* Total Expense Card (Orange) */}
                        <View className="bg-[#FF6A3D] w-[48%] rounded-[32px] p-5 h-[180px] justify-between shadow-lg shadow-orange-500/30">
                            <View className="flex-row justify-between items-start">
                                <Text className="text-white/80 font-medium text-xs">Total Expense</Text>
                                <Ionicons name="ellipsis-vertical" size={16} color="white" />
                            </View>

                            <Text className="text-white font-bold text-2xl">₹4,543.98</Text>

                            <View>
                                <View className="w-8 h-5 border border-white/30 rounded mb-2 relative overflow-hidden bg-white/20">
                                    <View className="absolute top-1 left-0 right-0 h-[1px] bg-white/30" />
                                </View>
                                <Text className="text-white/80 text-[10px]">Bank Account</Text>
                                <Text className="text-white text-[10px] opacity-60">**** **** 1965</Text>
                            </View>

                            {/* Decorative Background Pattern */}
                            <View className="absolute right-0 bottom-0 opacity-10">
                                <Ionicons name="wifi-outline" size={100} color="white" />
                            </View>
                        </View>
                    </View>

                    {/* --- EXPENSES LIST --- */}
                    <View>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-[#1E1E2D] font-bold text-xl">Expenses</Text>
                            <TouchableOpacity onPress={() => router.push('/total-expense')}>
                                <Text className="text-gray-400 text-sm font-medium">View All</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Expense Item */}
                        <View className="bg-white rounded-[32px] p-5 shadow-sm">
                            <View className="flex-row justify-between items-start mb-6">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-orange-50 rounded-2xl items-center justify-center mr-4">
                                        <Ionicons name="cart" size={24} color="#FF6A3D" />
                                    </View>
                                    <View>
                                        <Text className="text-[#1E1E2D] font-bold text-lg">Food And Drinks</Text>
                                        <Text className="text-gray-400 text-xs mt-1">Credit Card</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-400 text-xs">April, 2022</Text>
                            </View>

                            <View className="flex-row justify-between items-end mb-2">
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">Total Spend</Text>
                                    <Text className="text-[#22C55E] font-bold text-lg">₹2,486</Text>
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">Total Budget</Text>
                                    <Text className="text-[#1E1E2D] font-bold text-lg">₹3,000</Text>
                                </View>
                                <Text className="text-[#22C55E] font-bold text-lg">75.78%</Text>
                            </View>

                            {/* Progress Bar */}
                            <View className="h-3 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                                <View className="h-full bg-[#7B4DFF] w-[75%] rounded-full" />
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* --- CUSTOM BOTTOM NAVIGATION --- */}
                <View className="absolute bottom-0 left-0 right-0 h-[100px] bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex-row justify-evenly items-center px-2 pb-4">
                    <TouchableOpacity
                        className="items-center justify-center w-14 h-14"
                        onPress={() => router.push('/dashboard')}
                    >
                        <Ionicons name="home-outline" size={26} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center justify-center w-14 h-14">
                        <Ionicons name="card" size={26} color="#FF6A3D" />
                        <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="w-16 h-16 bg-[#FF6A3D] rounded-full items-center justify-center shadow-lg shadow-orange-500/40 -mt-8"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={38} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center justify-center w-14 h-14">
                        <Ionicons name="calendar-outline" size={26} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center justify-center w-14 h-14">
                        <Ionicons name="settings-outline" size={26} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
