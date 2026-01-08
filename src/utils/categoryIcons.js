import { Coffee, Car, ShoppingBag, Wallet, Film, Receipt, HeartPulse, Gift, TrendingUp, Zap } from 'lucide-react';

export const CategoryIcons = {
    // Expenses
    'Food': Coffee,
    'Transport': Car,
    'Shopping': ShoppingBag,
    'Health': HeartPulse,
    'Bills': Receipt,
    'Movie': Film,
    
    // Income
    'Salary': Wallet,
    'Rewards': Gift,
    'Refund': Receipt,
    'Gift': Gift,
    'Investment': TrendingUp,
    
    // Default
    'Other': Zap,
    'Income': Wallet
};

export const getIcon = (category) => {
    return CategoryIcons[category] || CategoryIcons['Other'];
};
