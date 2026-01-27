// Web-compatible mock for react-native-vector-icons
// This avoids JSX processing issues during PWA build
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style, ...props }) => {
    // Return a simple text-based icon for web
    // You can enhance this to use actual icon fonts or SVGs
    return (
        <Text
            style={[
                styles.icon,
                { fontSize: size, color },
                style,
            ]}
            {...props}
        >
            {getIconChar(name)}
        </Text>
    );
};

// Simple mapping of common icon names to unicode characters
function getIconChar(name: string): string {
    const iconMap: Record<string, string> = {
        'arrow-back': '←',
        'arrow-forward': '→',
        'close': '×',
        'checkmark': '✓',
        'add': '+',
        'remove': '−',
        'menu': '☰',
        'search': '🔍',
        'heart': '♥',
        'star': '★',
        'home': '⌂',
        'settings': '⚙',
        'person': '👤',
        'mail': '✉',
        'lock': '🔒',
    };
    
    // Try to find icon by name (case-insensitive)
    const key = Object.keys(iconMap).find(k => 
        name.toLowerCase().includes(k.toLowerCase())
    );
    
    return key ? iconMap[key] : '•';
}

const styles = StyleSheet.create({
    icon: {
        fontFamily: 'system-ui',
        textAlign: 'center',
    },
});

export default Icon;
