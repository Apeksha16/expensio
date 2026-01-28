
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserTheme } from '../services/auth';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    isDarkMode: boolean;
    toggleTheme: (value: boolean) => Promise<void>;
    setThemeFromUser: (userTheme?: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children, userEmail }: { children: React.ReactNode, userEmail?: string }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');

    // Load saved theme on mount
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setTheme(savedTheme as Theme);
            } else {
                setTheme(systemScheme === 'dark' ? 'dark' : 'light');
            }
        };
        loadTheme();
    }, [systemScheme]);

    const toggleTheme = async (isDark: boolean) => {
        const newTheme = isDark ? 'dark' : 'light';
        setTheme(newTheme);
        await AsyncStorage.setItem('theme', newTheme);

        if (userEmail) {
            // Fire and forget backend update
            updateUserTheme(userEmail, newTheme).catch(err => console.error('Failed to sync theme', err));
        }
    };

    const setThemeFromUser = (userTheme?: 'light' | 'dark' | 'system') => {
        if (!userTheme || userTheme === 'system') {
            // Keep current or system
            return;
        }
        setTheme(userTheme);
        AsyncStorage.setItem('theme', userTheme);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            isDarkMode: theme === 'dark',
            toggleTheme,
            setThemeFromUser
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
