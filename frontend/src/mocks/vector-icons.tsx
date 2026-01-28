import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import glyphMap from '@expo/vector-icons/glyphmaps/Ionicons.json';

interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 30, color = '#000', style, ...props }) => {
    let glyph = (glyphMap as any)[name];

    // Handle outline/sharp variants if exact match not found (optional, but good for safety)
    if (!glyph) {
        // Fallback or log? For now, we'll try to just show nothing or a placeholder
        // If it's a critical icon, it should exist in the map.
        console.warn(`Icon ${name} not found in Ionicons glyphmap`);
        return null;
    }

    const iconChar = String.fromCharCode(glyph);

    return (
        <Text style={[styles.icon, { fontSize: size, color }, style]} {...props}>
            {iconChar}
        </Text>
    );
};

const styles = StyleSheet.create({
    icon: {
        fontFamily: 'Ionicons',
        fontWeight: 'normal',
        fontStyle: 'normal',
    },
});

export default Icon;
