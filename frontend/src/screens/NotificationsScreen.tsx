import React, { useState } from 'react';
import Header from '../components/Header';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { Swipeable } from 'react-native-gesture-handler';

// Mock Data
const INITIAL_NOTIFICATIONS = [
    {
        id: '1',
        type: 'payment',
        title: 'Payment Received',
        message: 'Rahul paid you ₹500 for Dinner',
        time: '2 mins ago',
        read: false,
    },
    {
        id: '2',
        type: 'split',
        title: 'New Split Added',
        message: 'Amit added "Goa Trip" expenses',
        time: '2 hours ago',
        read: true,
    },
    {
        id: '3',
        type: 'reminder',
        title: 'Bill Reminder',
        message: 'Electricity bill of ₹1200 is due tomorrow',
        time: '1 day ago',
        read: true,
    },
];

const NotificationItem = ({ item, onDelete, onRead }: { item: any, onDelete: (id: string) => void, onRead: (id: string) => void }) => {
    const swipeableRef = React.useRef<Swipeable>(null);

    const close = () => {
        swipeableRef.current?.close();
    };

    const handleRead = () => {
        close();
        // Wait for animation to finish
        setTimeout(() => {
            onRead(item.id);
        }, 300);
    };

    const handleDelete = () => {
        close();
        // Wait for animation to finish before removing
        setTimeout(() => {
            onDelete(item.id);
        }, 300);
    };

    const renderRightActions = (progress: any, dragX: any) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });
        return (
            <TouchableOpacity onPress={handleDelete} style={styles.rightAction}>
                <Animated.View style={[styles.actionIcon, { transform: [{ scale: trans }] }]}>
                    <Icon name="trash-outline" size={24} color="#fff" />
                    <Text style={styles.actionText}>Delete</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderLeftActions = (progress: any, dragX: any) => {
        const trans = dragX.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });
        return (
            <TouchableOpacity onPress={handleRead} style={styles.leftAction}>
                <Animated.View style={[styles.actionIcon, { transform: [{ scale: trans }] }]}>
                    <Icon name="checkmark-done-outline" size={24} color="#fff" />
                    <Text style={styles.actionText}>Read</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    let iconName = 'notifications';
    let iconColor = '#FF7043';
    let bgColor = '#FFF3E0';

    switch (item.type) {
        case 'payment':
            iconName = 'cash-outline';
            iconColor = '#4CAF50';
            bgColor = '#E8F5E9';
            break;
        case 'split':
            iconName = 'people-outline';
            iconColor = '#2196F3';
            bgColor = '#E3F2FD';
            break;
        case 'reminder':
            iconName = 'alert-circle-outline';
            iconColor = '#FF9800';
            bgColor = '#FFF3E0';
            break;
    }

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            renderLeftActions={renderLeftActions}
        >
            <View style={[styles.card, !item.read && styles.unreadCard]}>
                <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                    <Icon name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
            </View>
        </Swipeable>
    );
};

const NotificationsScreen = ({ navigation }: { navigation: any }) => {
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Notifications"
                showBack={true}
            />

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <NotificationItem
                        item={item}
                        onDelete={deleteNotification}
                        onRead={markAsRead}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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
        marginBottom: 8,
    },
    backButton: {
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
    listContent: {
        padding: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    unreadCard: {
        backgroundColor: '#F0F9FF', // Slight highlight
        borderLeftWidth: 4,
        borderLeftColor: '#FF7043',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    message: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
    },
    time: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF7043',
        marginLeft: 8,
    },
    // Swipe Actions
    rightAction: {
        backgroundColor: '#EF4444', // Red
        justifyContent: 'center',
        alignItems: 'flex-end',
        borderRadius: 16,
        marginBottom: 12,
        paddingHorizontal: 20,
        width: '100%',
    },
    leftAction: {
        backgroundColor: '#3B82F6', // Blue
        justifyContent: 'center',
        alignItems: 'flex-start',
        borderRadius: 16,
        marginBottom: 12,
        paddingHorizontal: 20,
        width: '100%',
    },
    actionIcon: {
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
        marginTop: 4,
    },
});

export default NotificationsScreen;
