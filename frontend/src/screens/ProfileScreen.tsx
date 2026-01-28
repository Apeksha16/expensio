import React from 'react';
import Header from '../components/Header';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Switch,
    useColorScheme,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../components/Toast';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const ProfileScreen = ({ navigation, onLogout }: { navigation: any; onLogout: () => void }) => {
    const { showToast } = useToast();
    const { user, setUser } = useUser();
    const { isDarkMode, toggleTheme } = useTheme();

    // Local toggle wrapper to match Switch's onValueChange signature
    const handleToggleTheme = (value: boolean) => {
        toggleTheme(value);
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: 'destructive',
                    onPress: () => {
                        showToast('Logged out successfully', 'success');
                        onLogout();
                    }
                }
            ]
        );
    };

    const bgStyle = { backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' };
    const textStyle = { color: isDarkMode ? '#F9FAFB' : '#1F2937' };
    const subTextStyle = { color: isDarkMode ? '#9CA3AF' : '#6B7280' };
    const cardStyle = { backgroundColor: isDarkMode ? '#1F2937' : '#fff' };
    const iconColor = isDarkMode ? '#F9FAFB' : '#1F2937';

    return (
        <SafeAreaView style={[styles.container, bgStyle]}>
            <Header
                title="My Profile"
                showBack={true}
                onBackPress={() => {
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    } else {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                        });
                    }
                }}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        {user?.photoURL ? (
                            <Image
                                source={{
                                    uri: user.photoURL,
                                    headers: { Referer: 'no-referrer' } // Fix for some Google Images
                                }}
                                style={{ width: 100, height: 100, borderRadius: 50 }}
                            />
                        ) : (
                            <Icon name="person" size={48} color="#8B5CF6" />
                        )}
                        <View style={styles.editBadge}>
                            <Icon name="pencil" size={12} color="#fff" />
                        </View>
                    </View>
                    <Text style={[styles.userName, textStyle]}>{user?.name || 'User'}</Text>
                    <Text style={[styles.userEmail, subTextStyle]}>{user?.email || 'No Email'}</Text>
                </View>

                {/* Stats Row */}
                <View style={[styles.statsCard, cardStyle]}>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => navigation.navigate('SetSalary', {
                            currentSalary: user?.salary,
                            userEmail: user?.email
                        })}
                    >
                        {user?.salary ? (
                            <Text
                                style={[styles.statValue, textStyle]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                            >
                                ₹{user.salary}
                            </Text>
                        ) : (
                            <Text style={[styles.statValue, { fontSize: 14, color: '#FF7043' }]}>Set</Text>
                        )}
                        <Text style={styles.statLabel}>Salary</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => navigation.navigate('Main', { screen: 'Goals' })}
                    >
                        {user?.goals ? (
                            <Text style={[styles.statValue, textStyle]}>{user.goals}</Text>
                        ) : (
                            <Text style={[styles.statValue, { fontSize: 14, color: '#FF7043' }]}>Not Set</Text>
                        )}
                        <Text style={styles.statLabel}>Goals</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, textStyle]}>4.8</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Account Section */}
                <Text style={[styles.sectionHeader, textStyle]}>Account</Text>
                <View style={[styles.menuContainer, cardStyle]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('MPIN')}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#374151' : '#F9FAFB' }]}>
                            <Icon name="lock-closed-outline" size={20} color={iconColor} />
                        </View>
                        <Text style={[styles.menuText, textStyle]}>Security</Text>
                        <Icon name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <Text style={[styles.sectionHeader, textStyle]}>Preferences</Text>
                <View style={[styles.menuContainer, cardStyle]}>
                    <View style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#374151' : '#F9FAFB' }]}>
                            <Icon name="moon-outline" size={20} color={iconColor} />
                        </View>
                        <Text style={[styles.menuText, textStyle]}>Dark Mode</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#8B5CF6" }}
                            value={isDarkMode}
                            onValueChange={handleToggleTheme}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        padding: 24,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF7043',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: '#F3F4F6',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 8,
        marginBottom: 32,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    menuValue: {
        fontSize: 14,
        color: '#9CA3AF',
        marginRight: 8,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 72, // offset for icon
    },
    logoutButton: {
        backgroundColor: '#FEF2F2', // Light Red
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ProfileScreen;
