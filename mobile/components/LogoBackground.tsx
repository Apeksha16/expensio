import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

export default function LogoBackground() {
    // Animation Values
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    const reverseSpinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Continuous Rotation
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 12000, // Slightly slower for elegance
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 2. Reverse Rotation
        Animated.loop(
            Animated.timing(reverseSpinValue, {
                toValue: 1,
                duration: 18000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 3. Pulsing Breathing Effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.15,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Interpolations
    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const reverseSpin = reverseSpinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg'],
    });

    return (
        <View className="absolute items-center justify-center pointer-events-none" style={{ width: 500, height: 500 }}>
            {/* 
         "The Reactor" - Expanded Version
         Rings and particles pushed outward to clear the 120px Logo Box.
       */}

            {/* 1. Core Glow (Pulsing) - Slightly larger */}
            <Animated.View
                style={{
                    width: 160, height: 160,
                    backgroundColor: '#7B4DFF',
                    borderRadius: 80,
                    opacity: 0.15,
                    transform: [{ scale: pulseValue }]
                }}
                className="absolute"
            />
            <Animated.View
                style={{
                    width: 120, height: 120,
                    backgroundColor: '#FF6A3D',
                    borderRadius: 60,
                    opacity: 0.15,
                    transform: [{ scale: pulseValue }]
                }}
                className="absolute"
            />

            {/* 2. Inner Dashed Ring (Rotating) - Expanded to 220px */}
            <Animated.View
                className="absolute border-[2px] rounded-full border-dashed"
                style={{
                    width: 220, height: 220,
                    borderColor: '#A78BFA', // Light Purple
                    opacity: 0.3,
                    transform: [{ rotate: spin }]
                }}
            />

            {/* 3. Outer Solid Ring with Gap (Reverse Rotating) - Expanded to 280px */}
            <Animated.View
                className="absolute border-[1.5px] rounded-full"
                style={{
                    width: 280, height: 280,
                    borderColor: '#FB923C', // Orange
                    opacity: 0.25,
                    borderRightWidth: 0,
                    transform: [{ rotate: reverseSpin }]
                }}
            />

            {/* 4. Fine Detail Ring (Static) - Expanded to 340px */}
            <View
                className="absolute border-[1px] rounded-full"
                style={{
                    width: 340, height: 340,
                    borderColor: 'rgba(255,255,255,0.08)',
                    transform: [{ rotate: '45deg' }, { scaleX: 1.05 }]
                }}
            />

            {/* 5. Orbiting "Planet" DOTS - Orbits expanded */}

            {/* Cyan Dot Orbit - 260px Diameter (Clear of logo) */}
            <Animated.View
                className="absolute w-[260px] h-[260px] items-center justify-start pointer-events-none"
                style={{ transform: [{ rotate: spin }] }}
            >
                <View className="w-4 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
            </Animated.View>

            {/* Purple Dot Orbit - 200px Diameter (Clear of logo) */}
            <Animated.View
                className="absolute w-[200px] h-[200px] items-center justify-end pointer-events-none"
                style={{ transform: [{ rotate: reverseSpin }] }}
            >
                <View className="w-3 h-3 bg-purple-400 rounded-full" />
            </Animated.View>

            {/* 6. Background Radial Decor (Static) - Pushed to corners */}
            <View className="absolute top-10 right-20 w-3 h-3 rounded-full border border-white opacity-20" />
            <View className="absolute bottom-20 left-20 w-2 h-2 rounded-full bg-white opacity-20" />
            <View className="absolute top-20 left-10 w-1.5 h-1.5 rounded-full bg-orange-500 opacity-60" />

        </View>
    );
}
