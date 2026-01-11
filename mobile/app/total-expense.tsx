import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, Line, Circle, Text as SvgText } from 'react-native-svg';

const WEEK_DAYS = [
    { day: 'M', date: '20' },
    { day: 'T', date: '21' },
    { day: 'W', date: '22' },
    { day: 'T', date: '23' },
    { day: 'F', date: '24', active: true },
    { day: 'S', date: '25' },
    { day: 'S', date: '26' },
];

export default function TotalExpense() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* --- HEADER --- */}
                <View className="flex-row items-center px-6 py-4 relative">
                    <TouchableOpacity
                        className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm z-10"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-[#1E1E2D] absolute left-0 right-0 text-center">Total Expense</Text>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* --- CALENDAR STRIP --- */}
                    <View className="bg-white rounded-[32px] p-6 mt-4 shadow-sm">
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

                    {/* --- SPEND SUMMARY --- */}
                    <View className="bg-white rounded-[32px] p-6 mt-6 shadow-sm">
                        <View className="flex-row justify-between items-start mb-4">
                            <View>
                                <Text className="text-[#1E1E2D] text-lg font-medium pr-10 leading-6">
                                    You have Spend <Text className="text-[#FF6A3D] font-bold">₹6,584</Text>{'\n'}this month.
                                </Text>
                            </View>
                            <Text className="text-gray-400 text-xs mt-1">April, 2022</Text>
                        </View>

                        <View className="flex-row justify-between items-center mb-2 mt-2">
                            <Text className="text-white font-bold text-lg px-2 py-1 bg-[#7B4DFF] rounded-lg overflow-hidden text-center">75.78%</Text>
                            <Text className="text-[#1E1E2D] font-bold text-lg">24.22%</Text>
                        </View>
                        <View className="h-3 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                            <View className="h-full bg-[#7B4DFF] w-[75.78%] rounded-full" />
                        </View>
                    </View>

                    {/* --- ANALYTICS --- */}
                    <View className="mt-8">
                        <View className="flex-row justify-between items-center mb-0">
                            <Text className="text-[#1E1E2D] font-bold text-xl">Analytics</Text>
                            <TouchableOpacity>
                                <Text className="text-gray-400 text-sm font-medium">View All</Text>
                            </TouchableOpacity>
                        </View>

                        {/* CHART CONTAINER */}
                        <View className="h-[450px] items-center justify-center relative bg-transparent mt-4">

                            <Svg height="400" width="360" viewBox="0 0 360 400">
                                <G origin="180, 200">
                                    {/* 
                                      PIE SLICES 
                                      Center: 180, 200
                                      Radius: 80
                                      Stroke: #F9FAFB (Gray-50 background color) to create "gap"
                                    */}

                                    {/* 1. Food (Dark 35%) 
                                        Start: 0 deg (180, 120)
                                        End: 126 deg (244.7, 247)
                                    */}
                                    <Path
                                        d="M 180 200 L 180 120 A 80 80 0 0 1 244.7 247 Z"
                                        fill="#1E1E2D"
                                        stroke="#F9FAFB"
                                        strokeWidth="5"
                                    />

                                    {/* 2. Healthcare (Purple 20%) 
                                        Start: 126 deg (244.7, 247)
                                        End: 198 deg (155.3, 276)
                                    */}
                                    <Path
                                        d="M 180 200 L 244.7 247 A 80 80 0 0 1 155.3 276 Z"
                                        fill="#8B5CF6"
                                        stroke="#F9FAFB"
                                        strokeWidth="5"
                                    />

                                    {/* 3. Shopping (Orange 45%) 
                                        Start: 198 deg (155.3, 276)
                                        End: 360/0 deg (180, 120)
                                    */}
                                    <Path
                                        d="M 180 200 L 155.3 276 A 80 80 0 0 1 180 120 Z"
                                        fill="#FF6A3D"
                                        stroke="#F9FAFB"
                                        strokeWidth="5"
                                    />

                                    {/* --- LABELS ON PIE (Centered in Wedge) --- */}

                                    {/* 35% (Angle 63 deg) -> R=50 -> x=224, y=177 */}
                                    <SvgText x="224" y="182" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">35%</SvgText>

                                    {/* 20% (Angle 162 deg) -> R=50 -> x=195, y=247 */}
                                    <SvgText x="195" y="247" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">20%</SvgText>

                                    {/* 45% (Angle 279/-81 deg) -> R=50 -> x=130, y=192 */}
                                    <SvgText x="130" y="198" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">45%</SvgText>


                                    {/* --- CONNECTING LINES & OUTER LABELS --- */}

                                    {/* 1. Food (Top) */}
                                    {/* Line starts from top of Dark wedge (180, 120) going UP */}
                                    <Line x1="180" y1="120" x2="180" y2="80" stroke="#1E1E2D" strokeWidth="2" />
                                    <SvgText x="180" y="65" fill="#1E1E2D" fontSize="18" fontWeight="bold" textAnchor="middle">Food And Drinks</SvgText>
                                    <SvgText x="180" y="85" fill="#9CA3AF" fontSize="14" textAnchor="middle">₹4,672</SvgText>

                                    {/* 2. Shopping (Bottom Left) */}
                                    {/* Line from middle of Orange arc edge ~279 deg? NO. 
                                        Target image shows line coming from roughly 240 degrees (8 o'clock position).
                                        240 deg coords (r=80): x=180+80*sin(240)=110, y=200-80*cos(240)=240.
                                        Line extending down-left.
                                    */}
                                    <Line x1="110" y1="240" x2="80" y2="280" stroke="#FF6A3D" strokeWidth="2" />
                                    <SvgText x="70" y="300" fill="#1E1E2D" fontSize="16" fontWeight="bold" textAnchor="middle">Shopping</SvgText>
                                    <SvgText x="70" y="320" fill="#9CA3AF" fontSize="12" textAnchor="middle">₹3,762</SvgText>

                                    {/* 3. Healthcare (Bottom Right) */}
                                    {/* Line from middle of Purple arc edge (162 deg).
                                        162 coords (r=80): x=204, y=276.
                                        Line extending down-right.
                                    */}
                                    <Line x1="204" y1="276" x2="230" y2="310" stroke="#8B5CF6" strokeWidth="2" />
                                    <SvgText x="250" y="330" fill="#1E1E2D" fontSize="16" fontWeight="bold" textAnchor="middle">Healthcare</SvgText>
                                    <SvgText x="250" y="350" fill="#9CA3AF" fontSize="12" textAnchor="middle">₹2,917</SvgText>

                                </G>
                            </Svg>

                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
