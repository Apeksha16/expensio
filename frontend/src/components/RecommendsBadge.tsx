import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Animated, Easing } from 'react-native';
import defaultAvatar from '../assets/onboarding/avatar.png';

interface RecommendsBadgeProps {
    name?: string;
    image?: any;
}

const RecommendsBadge: React.FC<RecommendsBadgeProps> = ({
    name = "Nikitin",
    image = defaultAvatar
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.avatarWrapper}>
                {/* Pulsing Outer Ring */}
                <Animated.View style={[
                    styles.pulseRing,
                    { transform: [{ scale: pulseAnim }] }
                ]} />

                {/* White Border Ring (Static) */}
                <View style={styles.borderRing}>
                    <Image source={image} style={styles.avatar} />
                </View>
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.nameText}>{name}</Text>
                <Text style={styles.subText}>recommends</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 100, // Fixed width to ensure centering doesn't jump
    },
    avatarWrapper: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    pulseRing: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        zIndex: 1,
    },
    borderRing: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        backgroundColor: 'transparent', // Ensure transparent background to show pulse if needed, or colored if specific
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    textContainer: {
        alignItems: 'center',
    },
    nameText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    subText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#4B5563',
        opacity: 0.8,
    },
});

export default RecommendsBadge;
