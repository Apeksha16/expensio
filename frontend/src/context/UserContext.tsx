
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, logout as apiLogout } from '../services/auth';

export interface User {
    email: string;
    name?: string;
    photoURL?: string;
    id?: string;
    saved?: string;
    goals?: number;
    theme?: 'light' | 'dark' | 'system';
    salary?: string;
    createdAt?: string;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    hasOnboarded: boolean;
    setUser: (user: User | null) => void;
    updateUser: (updates: Partial<User>) => Promise<void>;
    login: (user: User) => Promise<void>;
    logout: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState(false);

    // Initial load
    useEffect(() => {
        const init = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                const storedOnboarding = await AsyncStorage.getItem('hasOnboarded');

                if (storedOnboarding) setHasOnboarded(true);

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUserState(parsedUser);

                    // Silent refetch
                    if (parsedUser.email) {
                        try {
                            const freshUser = await getUserProfile(parsedUser.email);
                            const merged = { ...parsedUser, ...freshUser };
                            setUserState(merged);
                            await AsyncStorage.setItem('user', JSON.stringify(merged));
                        } catch (err) {
                            console.error('Background profile sync failed', err);
                        }
                    }
                }
            } catch (e) {
                console.error('UserContext init error', e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const login = async (userData: User) => {
        setUserState(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('hasOnboarded', 'true');
        setHasOnboarded(true);
    };

    const logout = async () => {
        await apiLogout();
        setUserState(null);
        await AsyncStorage.removeItem('user');
    };

    const completeOnboarding = async () => {
        setHasOnboarded(true);
        await AsyncStorage.setItem('hasOnboarded', 'true');
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...updates };
        setUserState(updated);
        await AsyncStorage.setItem('user', JSON.stringify(updated));
    };

    const setUser = (newUser: User | null) => {
        setUserState(newUser);
        if (newUser) {
            AsyncStorage.setItem('user', JSON.stringify(newUser));
        } else {
            AsyncStorage.removeItem('user');
        }
    }

    return (
        <UserContext.Provider value={{
            user,
            loading,
            hasOnboarded,
            setUser,
            updateUser,
            login,
            logout,
            completeOnboarding
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
