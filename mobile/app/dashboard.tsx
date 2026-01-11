import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// Icons (using simple text or images for now, or vector-icons if installed)
// import { Ionicons } from '@expo/vector-icons'; 

export default function Dashboard() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 pt-4 mb-6">
                        <View className="flex-row items-center space-x-3">
                            <View className="w-10 h-10 bg-indigo-100 rounded-xl items-center justify-center">
                                <Text className="text-xl">👤</Text>
                            </View>
                            <View>
                                <Text className="text-gray-500 text-xs">Welcome back,</Text>
                                <Text className="text-dark font-bold text-lg">Apeksha</Text>
                            </View>
                        </View>
                        <TouchableOpacity className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                            <Text>🔔</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Credit Card */}
                    <View className="mx-6 h-[200] bg-dark rounded-3xl p-6 justify-between shadow-xl shadow-indigo-500/30">
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-gray-400 text-sm mb-1">Total Balance</Text>
                                <Text className="text-white text-3xl font-bold">$24,562.00</Text>
                            </View>
                            <Text className="text-white opacity-50 text-xl font-mono">...</Text>
                        </View>

                        <View className="flex-row justify-between items-end">
                            <Text className="text-gray-400 text-base font-mono tracking-widest">**** **** **** 4532</Text>
                            <View className="flex-row -space-x-2">
                                <View className="w-8 h-8 rounded-full bg-red-500 opacity-80" />
                                <View className="w-8 h-8 rounded-full bg-yellow-500 opacity-80" />
                            </View>
                        </View>
                    </View>

                    {/* Analytics (Simple Bar Chart) */}
                    <View className="mx-6 mt-8 bg-white rounded-3xl p-6 shadow-sm">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-dark font-bold text-lg">Analytics</Text>
                            <TouchableOpacity className="bg-orange-500 px-3 py-1 rounded-full">
                                <Text className="text-white text-xs font-bold">Year - 2023</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-between items-end h-[150] px-2">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month, index) => (
                                <View key={month} className="items-center space-y-2">
                                    <View className="w-3 h-full bg-gray-100 rounded-full justify-end overflow-hidden">
                                        <View
                                            className={`w-full rounded-full ${index === 2 ? 'bg-purple-600' : 'bg-gray-300'}`}
                                            style={{ height: `${[40, 60, 85, 55, 70][index]}%` }}
                                        />
                                    </View>
                                    <Text className={`text-xs ${index === 2 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>{month}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Transactions */}
                    <View className="mx-6 mt-8">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-dark font-bold text-lg">Transaction</Text>
                            <TouchableOpacity><Text className="text-gray-400 text-sm">View all</Text></TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            {[1, 2, 3].map((i) => (
                                <View key={i} className="flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
                                    <View className="flex-row items-center space-x-3">
                                        <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center">
                                            <Text>🍔</Text>
                                        </View>
                                        <View>
                                            <Text className="text-dark font-bold">Burger King</Text>
                                            <Text className="text-gray-400 text-xs">Food</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-red-500 font-bold">-$45.00</Text>
                                        <Text className="text-gray-400 text-[10px]">10:00 AM</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
