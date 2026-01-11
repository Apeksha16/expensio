import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
    const router = useRouter();

    const SETTINGS_SECTIONS = [
        {
            title: 'Account',
            items: [
                { icon: 'person-outline', label: 'Edit Profile', type: 'link' },
                { icon: 'notifications-outline', label: 'Notifications', type: 'link' },
                { icon: 'lock-closed-outline', label: 'Security', type: 'link' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'language-outline', label: 'Language', value: 'English', type: 'value' },
                { icon: 'moon-outline', label: 'Dark Mode', value: true, type: 'switch' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle-outline', label: 'Help & Support', type: 'link' },
                { icon: 'information-circle-outline', label: 'About eXpensio', type: 'link' },
            ]
        }
    ];

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-[#1E1E2D]">My Profile</Text>
                    <TouchableOpacity className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                        <Ionicons name="settings-outline" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-2">

                    {/* Profile Card */}
                    <View className="items-center mb-8">
                        <View className="w-28 h-28 bg-[#7B4DFF]/10 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
                            <Ionicons name="person" size={50} color="#7B4DFF" />
                            <View className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF6A3D] rounded-full items-center justify-center border-2 border-white">
                                <Ionicons name="pencil" size={14} color="white" />
                            </View>
                        </View>
                        <Text className="text-2xl font-bold text-[#1E1E2D]">Apeksha Verma</Text>
                        <Text className="text-gray-400 font-medium">apeksha@example.com</Text>
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row justify-between mb-8 bg-white p-4 rounded-[24px] shadow-sm">
                        <View className="flex-1 items-center border-r border-gray-100">
                            <Text className="text-[#1E1E2D] font-bold text-lg">₹15k</Text>
                            <Text className="text-gray-400 text-xs">Saved</Text>
                        </View>
                        <View className="flex-1 items-center border-r border-gray-100">
                            <Text className="text-[#1E1E2D] font-bold text-lg">12</Text>
                            <Text className="text-gray-400 text-xs">Goals</Text>
                        </View>
                        <View className="flex-1 items-center">
                            <Text className="text-[#1E1E2D] font-bold text-lg">4.8</Text>
                            <Text className="text-gray-400 text-xs">Rating</Text>
                        </View>
                    </View>

                    {/* Settings Sections */}
                    <View className="gap-6 pb-10">
                        {SETTINGS_SECTIONS.map((section, index) => (
                            <View key={index}>
                                <Text className="text-gray-900 font-bold text-lg mb-3 ml-1">{section.title}</Text>
                                <View className="bg-white rounded-[24px] shadow-sm overflow-hidden">
                                    {section.items.map((item: any, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            className={`flex-row items-center justify-between p-4 ${idx !== section.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-row items-center">
                                                <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4">
                                                    <Ionicons name={item.icon} size={20} color="#1E1E2D" />
                                                </View>
                                                <Text className="text-[#1E1E2D] font-medium text-base">{item.label}</Text>
                                            </View>

                                            {item.type === 'link' && (
                                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                            )}
                                            {item.type === 'value' && (
                                                <View className="flex-row items-center">
                                                    <Text className="text-gray-400 font-medium mr-2">{item.value}</Text>
                                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                                </View>
                                            )}
                                            {item.type === 'switch' && (
                                                <Switch
                                                    value={item.value}
                                                    trackColor={{ false: "#E5E7EB", true: "#7B4DFF" }}
                                                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF'}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity className="flex-row items-center justify-center p-4 rounded-[24px] border-2 border-red-100 bg-red-50 mt-2 mb-8">
                            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                            <Text className="text-[#EF4444] font-bold text-lg ml-2">Log Out</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// Helper to avoid Typescript Platform error if needed, though usually standard import works.
import { Platform } from 'react-native';
