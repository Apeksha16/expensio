import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddTransfer() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView className="flex-1">
                <View className="flex-row items-center px-4 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <Ionicons name="chevron-back" size={24} color="#1E1E2D" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-[#1E1E2D] ml-4">Add Transfer</Text>
                </View>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-400">Add Transfer Screen</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}
