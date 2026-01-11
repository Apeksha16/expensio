import { View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Colors
const BG_DARK = '#1E1E2D';
const LIGHT_VIOLET_GLOW = 'rgba(123, 77, 255, 0.05)';

type AuthBackgroundProps = {
    children: React.ReactNode;
    variant?: 'login' | 'signup';
};

export default function AuthBackground({ children, variant = 'login' }: AuthBackgroundProps) {
    return (
        <View className="flex-1 bg-[#1E1E2D]">
            {/* 
        Clean Dark Canvas
        Removed complex geometric clusters to focus on the LogoBackground.
      */}

            {/* Very subtle ambient glow to prevent feeling flat, but extremely minimal */}
            <View
                className="absolute -top-40 -right-40 rounded-full"
                style={{ width: width * 1.5, height: width * 1.5, backgroundColor: LIGHT_VIOLET_GLOW }}
            />

            {/* Content Layer */}
            <View className="flex-1">
                {children}
            </View>
        </View>
    );
}
