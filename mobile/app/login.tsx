import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// Components
import AuthBackground from '../components/AuthBackground';
import LogoBackground from '../components/LogoBackground';
// Assets
import logo from '../assets/logoOnboarding.png';

export default function Login() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        if (phoneNumber.length >= 10) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                // Navigate to OTP
                console.log('Login with:', countryCode, phoneNumber);
                router.push('/verify-otp');
            }, 1000);
        }
    };

    return (
        <AuthBackground variant="login">
            {/* Ignore bottom safe area so white sheet hits the edge */}
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        bounces={false}
                        overScrollMode="never"
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false} // Strictly disable scrolling
                    >
                        <View className="flex-1 w-full max-w-[500px] self-center justify-between">

                            {/* Logo Area */}
                            <View className="flex-1 items-center justify-center py-10 relative">
                                {/* Decoration Behind Logo */}
                                <LogoBackground />

                                <View className="bg-white p-6 rounded-3xl items-center justify-center shadow-lg w-[120px] h-[120px]">
                                    <Image source={logo} className="w-[60px] h-[60px]" resizeMode="contain" />
                                </View>
                            </View>

                            {/* Bottom Sheet Container */}
                            <View
                                className="bg-white rounded-t-[32px] px-8 pt-10 shadow-2xl items-center w-full"
                                style={{ paddingBottom: 40 + insets.bottom }}
                            >
                                <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-6" />

                                <Text className="text-2xl font-bold text-dark mb-2">Welcome Back</Text>
                                <Text className="text-sm text-gray-500 mb-8">Login to manage your finances</Text>

                                {/* Form */}
                                <View className="w-full gap-4">
                                    <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 h-[60px] border border-gray-100 focus:border-orange-500 w-full">
                                        {/* Simplified Country Selector */}
                                        <Text className="text-dark font-medium mr-3 pr-3 border-r border-gray-300 text-lg">{countryCode}</Text>
                                        <TextInput
                                            className="flex-1 text-dark text-lg font-medium"
                                            placeholder="Phone Number"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="phone-pad"
                                            value={phoneNumber}
                                            onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
                                            maxLength={15}
                                            style={{
                                                includeFontPadding: false,
                                                paddingTop: 0,
                                                paddingBottom: 0
                                            }}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        className={`w-full h-[60px] bg-orange-500 rounded-2xl items-center justify-center mt-4 shadow-orange-500/30 shadow-lg ${phoneNumber.length < 10 ? 'opacity-50' : ''}`}
                                        onPress={handleLogin}
                                        disabled={phoneNumber.length < 10 || isLoading}
                                    >
                                        <Text className="text-white font-bold text-lg">
                                            {isLoading ? 'Loading...' : 'Get OTP'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="mt-8 flex-row">
                                    <Text className="text-gray-500 text-sm">New here? </Text>
                                    <Link href="/signup" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-orange-500 font-bold text-sm">Create Account</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AuthBackground>
    );
}
