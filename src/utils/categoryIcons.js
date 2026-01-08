import { 
    Coffee, Car, ShoppingBag, Home, FileText, 
    Smartphone, Wifi, HeartPulse, TrendingUp, 
    GraduationCap, Wallet, MoreHorizontal, Film 
} from 'lucide-react';

export const getIcon = (category) => {
    switch (category) {
        case 'Food': return Coffee;
        case 'Travel': return Car;
        case 'Transport': return Car;
        case 'Shopping': return ShoppingBag;
        case 'Rent': return Home;
        case 'Bills': return FileText;
        case 'Mobile Recharge': return Smartphone;
        case 'Wifi': return Wifi;
        case 'Medicines': return HeartPulse;
        case 'Health': return HeartPulse;
        case 'Investment': return TrendingUp;
        case 'Education': return GraduationCap;
        case 'Salary': return Wallet;
        case 'Entertainment': return Film;
        case 'Movie': return Film;
        default: return MoreHorizontal;
    }
};
