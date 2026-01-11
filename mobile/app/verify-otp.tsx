import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// Components
import AuthBackground from '../components/AuthBackground';
import LogoBackground from '../components/LogoBackground';
// Assets
import logo from '../assets/logoOnboarding.png';

export default function VerifyOTP() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleOtpChange = (text: string, index: number) => {
        // Only allow numbers
        if (text && !/^\d+$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        // Auto-focus previous input on backspace handled in onKeyPress

        // Check for auto-submit
        if (text && index === 5) {
            // Last digit entered
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                Keyboard.dismiss();
                triggerVerification(fullOtp);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = ''; // Clear previous box too for smoother feel
                setOtp(newOtp);
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const triggerVerification = (otpValue: string) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            console.log('Verified OTP:', otpValue);
            router.push('/dashboard');
        }, 2000); // 2 second dummy loader
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
                        scrollEnabled={false}
                    >
                        <View className="flex-1 w-full max-w-[500px] self-center justify-between">

                            {/* Logo Area */}
                            <View className="flex-1 items-center justify-center py-10 relative">
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

                                <Text className="text-2xl font-bold text-dark mb-2">Verification Code</Text>
                                <Text className="text-sm text-gray-500 mb-8 max-w-[80%] text-center">
                                    We have sent the verification code to your mobile number
                                </Text>

                                {/* Loading State OR OTP Inputs */}
                                {isLoading ? (
                                    <View className="h-[100px] items-center justify-center w-full mb-8">
                                        <ActivityIndicator size="large" color="#FF6A3D" />
                                        <Text className="text-gray-500 font-medium mt-4">Verifying...</Text>
                                    </View>
                                ) : (
                                    /* OTP Inputs */
                                    <View className="flex-row gap-2 mb-8 w-full justify-center">
                                        {otp.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => inputRefs.current[index] = ref}
                                                className={`w-[45px] h-[60px] rounded-xl text-center text-xl font-bold bg-gray-50 border ${digit ? 'border-orange-500 text-orange-500' : 'border-gray-200 text-dark'}`}
                                                maxLength={1}
                                                keyboardType="number-pad"
                                                value={digit}
                                                onChangeText={(text) => handleOtpChange(text, index)}
                                                onKeyPress={(e) => handleKeyPress(e, index)}
                                                style={{
                                                    includeFontPadding: false,
                                                    textAlignVertical: 'center'
                                                }}
                                            />
                                        ))}
                                    </View>
                                )}

                                {/* No Login Button - Just Resend Link */}
                                <View className="flex-row">
                                    <Text className="text-gray-500 text-sm">Didn't receive code? </Text>
                                    <TouchableOpacity disabled={isLoading}>
                                        <Text className={`text-orange-500 font-bold text-sm ${isLoading ? 'opacity-50' : ''}`}>Resend Again</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Spacer to maintain height if needed, though button removal simplifies layout */}
                                <View className="h-4" />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AuthBackground>
    );
}
