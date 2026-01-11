import { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Assets
import vector1 from '../assets/vector1.png';
import vector2 from '../assets/vector2.png';
import vector3 from '../assets/vector3.png';
import logo from '../assets/logoOnboarding.png';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: 1,
        image: vector1,
        title: "Control Your Money",
        subtitle: "Effortlessly track every penny and take charge of your financial tracking journey.",
    },
    {
        id: 2,
        image: vector2,
        title: "Smart Analytics",
        subtitle: "Gain powerful insights into your spending habits with our intuitive glass displays.",
    },
    {
        id: 3,
        image: vector3,
        title: "Reach Your Goals",
        subtitle: "Set targets, save more, and watch your wealth take off to new heights.",
    },
];

export default function Onboarding() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.replace('/login');
        }
    };

    const handleSkip = () => {
        router.replace('/login');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">

                {/* Header / Skip */}
                <View className="flex-row justify-between items-center px-6 pt-2">
                    <View className="flex-row items-center">
                        <Image source={logo} className="w-8 h-8 mr-2" resizeMode="contain" />
                        <Text className="text-xl font-bold text-dark">eXpensio</Text>
                    </View>
                    <TouchableOpacity onPress={handleSkip}>
                        <Text className="text-gray-500 font-medium text-base">Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Slides */}
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={({ item }) => (
                        <View style={{ width, alignItems: 'center', paddingHorizontal: 20 }}>
                            <View className="flex-1 justify-center items-center py-10">
                                <Image
                                    source={item.image}
                                    style={{ width: width * 0.9, height: width * 0.7 }}
                                    resizeMode="contain"
                                />
                            </View>
                            <View className="pb-24 items-center">
                                <Text className="text-3xl font-bold text-dark text-center mb-4 leading-tight">
                                    {item.title}
                                </Text>
                                <Text className="text-gray-500 text-center text-base px-4 leading-6">
                                    {item.subtitle}
                                </Text>
                            </View>
                        </View>
                    )}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                />

                {/* Footer Navigation */}
                <View className="absolute bottom-12 left-0 right-0 px-8 flex-row justify-between items-center bg-white/0">
                    {/* Pagination Dots */}
                    <View className="flex-row space-x-2">
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 rounded-full transition-all ${currentIndex === index ? 'w-8 bg-orange-500' : 'w-2 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity
                        onPress={handleNext}
                        className="w-16 h-16 bg-orange-500 rounded-full items-center justify-center shadow-lg shadow-orange-500/40"
                    >
                        <Text className="text-white text-2xl font-bold">
                            {currentIndex === slides.length - 1 ? "GO" : "➜"}
                        </Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
