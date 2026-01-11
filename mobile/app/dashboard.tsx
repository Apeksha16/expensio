import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const RADIUS = 70;
const STROKE_WIDTH = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// --- Mock Data ---
const TRANSACTIONS = [
    { id: 1, name: 'Puma Store', type: 'Bank Account', amount: '₹952', date: 'Fri, 05 April 2022', logo: 'shirt-outline', color: 'text-[#7B4DFF]' },
    { id: 2, name: 'Nike Super Store', type: 'Credit Card', amount: '₹475', date: 'Fri, 05 April 2022', logo: 'pricetag-outline', color: 'text-[#7B4DFF]' },
];

const ANALYTICS_DATA = [
    { label: 'Jan', value: 40, fullValue: '₹1,494' },
    { label: 'Feb', value: 60, fullValue: '₹1,664' },
    { label: 'Mar', value: 50, fullValue: '₹1,544' },
    { label: 'Apr', value: 85, active: true, fullValue: '₹2,972' },
    { label: 'May', value: 65, fullValue: '₹2,484' },
    { label: 'Jun', value: 75, fullValue: '₹2,364' },
    { label: 'Jul', value: 55, fullValue: '₹3,894' },
];

export default function Dashboard() {
    const router = useRouter();
    // Force re-render log
    console.log("Dashboard Loaded: Purple/Orange Theme Active");

    // Chart Data calculations
    const income = 8429;
    const spent = 3621; // Total is approx ~12000. 
    // Income is ~70%, Spent ~30%
    const incomeDash = CIRCUMFERENCE * 0.7;
    const spentDash = CIRCUMFERENCE * 0.3;

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* --- HEADER --- */}
                <View className="flex-row justify-between items-center px-6 py-4">
                    <View className="w-12 h-12 bg-[#9F7AF9] rounded-2xl items-center justify-center overflow-hidden">
                        <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                    <Text className="text-xl font-bold text-[#1E1E2D]">Home</Text>
                    <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm">
                        <Ionicons name="notifications-outline" size={24} color="#1E1E2D" />
                        <View className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* --- SUMMARY CARD (Income vs Spent) --- */}
                    <View className="mx-6 mt-4 bg-white rounded-[32px] p-6 shadow-sm flex-row justify-between items-center h-[220px]">

                        {/* Stats Column */}
                        <View className="justify-center space-y-8">
                            {/* Income - PURPLE */}
                            <View>
                                <View className="flex-row items-center mb-1">
                                    <View className="w-2 h-4 bg-[#7B4DFF] rounded-full mr-2" />
                                    <Text className="text-gray-400 font-medium">Income</Text>
                                </View>
                                <Text className="text-[#1E1E2D] text-3xl font-bold ml-4">₹8,429</Text>
                            </View>

                            {/* Spent - ORANGE */}
                            <View>
                                <View className="flex-row items-center mb-1">
                                    <View className="w-2 h-4 bg-[#FF6A3D] rounded-full mr-2" />
                                    <Text className="text-gray-400 font-medium">Spent</Text>
                                </View>
                                <Text className="text-[#1E1E2D] text-3xl font-bold ml-4">₹3,621</Text>
                            </View>
                        </View>

                        {/* Donut Chart */}
                        <View className="items-center justify-center">
                            <Svg height="160" width="160" viewBox="0 0 180 180">
                                <G rotation="-90" origin="90, 90">
                                    {/* Background Circle */}
                                    <Circle
                                        cx="90"
                                        cy="90"
                                        r={RADIUS}
                                        stroke="#F3F4F6"
                                        strokeWidth={STROKE_WIDTH}
                                        fill="transparent"
                                    />
                                    {/* Income Segment (Purple) */}
                                    <Circle
                                        cx="90"
                                        cy="90"
                                        r={RADIUS}
                                        stroke="#7B4DFF"
                                        strokeWidth={STROKE_WIDTH}
                                        fill="transparent"
                                        strokeDasharray={`${incomeDash} ${CIRCUMFERENCE}`}
                                        strokeLinecap="round"
                                    />
                                    {/* Spent Segment (Orange) - Rotated to start after Purple */}
                                    <Circle
                                        cx="90"
                                        cy="90"
                                        r={RADIUS}
                                        stroke="#FF6A3D"
                                        strokeWidth={STROKE_WIDTH}
                                        fill="transparent"
                                        strokeDasharray={`${spentDash} ${CIRCUMFERENCE}`}
                                        strokeDashoffset={-incomeDash} // Offset by income length
                                        strokeLinecap="round"
                                    />
                                </G>
                            </Svg>
                        </View>
                    </View>

                    {/* --- ANALYTICS --- */}
                    <View className="mx-6 mt-8">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-[#1E1E2D] font-bold text-xl">Analytics</Text>
                            <TouchableOpacity className="flex-row items-center bg-[#FF6A3D] px-4 py-2 rounded-xl">
                                <Text className="text-white font-bold text-sm mr-2">Year - 2022</Text>
                                <Ionicons name="chevron-down" size={12} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-white rounded-[32px] p-6 h-[280px] justify-end relative shadow-sm">
                            <View className="absolute top-6 left-6 right-6 bottom-10 justify-between opacity-10 pointer-events-none">
                                <View className="w-full h-[1px] bg-gray-400" />
                                <View className="w-full h-[1px] bg-gray-400" />
                                <View className="w-full h-[1px] bg-gray-400" />
                                <View className="w-full h-[1px] bg-gray-400" />
                            </View>

                            <View className="flex-row justify-between items-end h-[200px] px-2 w-full">
                                {ANALYTICS_DATA.map((item, index) => (
                                    <View key={index} className="items-center w-[12%] h-full justify-end relative">
                                        {item.active && (
                                            <View className="absolute -top-10 items-center w-[100px]">
                                                <Text className="text-[#8B5CF6] font-bold text-xs mb-1">{item.fullValue}</Text>
                                            </View>
                                        )}
                                        <View
                                            className={`w-full rounded-t-lg rounded-b-lg ${item.active ? 'bg-[#8B5CF6]' : 'bg-gray-100'}`}
                                            style={{ height: `${item.value}%` }}
                                        />
                                        {!item.active && (
                                            <Text className="absolute bottom-[105%] text-[10px] text-gray-400 text-center w-[100px] opacity-70">
                                                {item.fullValue}
                                            </Text>
                                        )}
                                        <Text
                                            className={`mt-3 text-xs font-medium ${item.active ? 'text-[#8B5CF6]' : 'text-gray-400'}`}
                                        >
                                            {item.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* --- TRANSACTIONS --- */}
                    <View className="mx-6 mt-8">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-[#1E1E2D] font-bold text-xl">Transactions</Text>
                            <TouchableOpacity>
                                <Text className="text-gray-400 text-sm font-medium">View All</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            {TRANSACTIONS.map((t) => (
                                <View key={t.id} className="flex-row items-center justify-between bg-white p-4 rounded-[24px] shadow-sm">
                                    <View className="flex-row items-center space-x-4 ml-2">
                                        <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center">
                                            <Ionicons name={t.logo as any} size={24} color="#1E1E2D" />
                                        </View>
                                        <View className="ml-2">
                                            <Text className="text-[#1E1E2D] font-bold text-lg">{t.name}</Text>
                                            <Text className="text-gray-400 text-xs mt-1">{t.type}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end mr-2">
                                        <Text className="text-[#22C55E] font-bold text-lg">{t.amount}</Text>
                                        <Text className="text-gray-400 text-xs mt-1">{t.date}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                </ScrollView>

                {/* --- CUSTOM BOTTOM NAVIGATION --- */}
                <View className="absolute bottom-0 left-0 right-0 h-[100px] bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex-row justify-evenly items-center px-2 pb-4">
                    <TouchableOpacity className="items-center justify-center w-14 h-14">
                        <Ionicons name="home" size={26} color="#FF6A3D" />
                        <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1" />
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center justify-center w-14 h-14">
                        <Ionicons name="card-outline" size={26} color="#9CA3AF" />
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
