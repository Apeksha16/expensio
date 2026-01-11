import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import DateTimePicker from '@react-native-community/datetimepicker';

const ICONS = ['camera', 'laptop', 'airplane', 'car', 'home', 'gift'];

export default function AddGoal() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('camera');

    // Date Picker State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-[#1E1E2D] ml-4">New Savings Goal</Text>
                </View>

                <ScrollView className="flex-1 px-6 pt-6">

                    {/* Goal Title */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Goal Name</Text>
                    <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                        <TextInput
                            className="text-[#1E1E2D] text-base"
                            placeholder="e.g. GoPro Camera"
                            value={title}
                            onChangeText={setTitle}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Target Amount */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Target Amount</Text>
                    <View className="bg-white rounded-[32px] p-8 items-center shadow-sm mb-6">
                        <View className="flex-row items-center">
                            <Text className="text-4xl font-bold text-[#1E1E2D] mr-2">₹</Text>
                            <TextInput
                                className="text-5xl font-bold text-[#1E1E2D] min-w-[100px] text-center"
                                placeholder="0"
                                keyboardType="numeric"
                                value={targetAmount}
                                onChangeText={setTargetAmount}
                                placeholderTextColor="#E5E7EB"
                            />
                        </View>
                    </View>

                    {/* Deadline */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Target Date</Text>
                    <TouchableOpacity
                        className="bg-white rounded-2xl p-4 shadow-sm mb-8 flex-row items-center justify-between"
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text className="text-[#1E1E2D] text-base font-medium">
                            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                        <Ionicons name="calendar-outline" size={24} color="#7B4DFF" />
                    </TouchableOpacity>

                    {/* Date Picker Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showDatePicker}
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-[32px] p-6 pb-10">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-xl font-bold text-[#1E1E2D]">Select Date</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text className="text-[#FF6A3D] font-bold text-lg">Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="inline"
                                    onChange={onChangeDate}
                                    style={{ height: 320 }}
                                    themeVariant="light"
                                />
                            </View>
                        </View>
                    </Modal>

                    {/* Icon Selection */}
                    <Text className="text-lg font-bold text-[#1E1E2D] mb-4">Choose Icon</Text>
                    <View className="flex-row justify-between mb-8">
                        {ICONS.map((icon) => (
                            <TouchableOpacity
                                key={icon}
                                onPress={() => setSelectedIcon(icon)}
                                className={`w-12 h-12 rounded-2xl items-center justify-center ${selectedIcon === icon ? 'bg-[#7B4DFF]' : 'bg-white'}`}
                            >
                                <Ionicons name={icon as any} size={24} color={selectedIcon === icon ? 'white' : '#9CA3AF'} />
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>

                {/* Create Button */}
                <View className="p-6 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <TouchableOpacity
                        className="w-full bg-[#1E1E2D] h-14 rounded-[20px] items-center justify-center shadow-lg shadow-black/20"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-bold text-lg">Create Goal</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
