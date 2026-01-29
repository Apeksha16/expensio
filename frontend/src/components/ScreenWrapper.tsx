import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header, { HeaderProps } from './Header';

interface ScreenWrapperProps extends HeaderProps {
    children: React.ReactNode;
    contentContainerStyle?: ViewStyle;
    backgroundColor?: string;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    contentContainerStyle,
    backgroundColor = '#F9FAFB',
    ...headerProps
}) => {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <Header {...headerProps} />
            <View style={[styles.content, contentContainerStyle]}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    }
});

export default ScreenWrapper;
