export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  paidBy: 'me' | string;
  splitWith?: string[];
  splitType?: 'equal' | 'percentage' | 'custom';
  splitPercentages?: Record<string, number>;
  groupId?: string;
  paymentMethod?: string;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number;
  online?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  coverUrl?: string;
  members: string[];
}

const getRelativeDateString = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
};

export const initialExpenses: Expense[] = [
  {
    id: '1',
    title: 'Starbucks Coffee',
    amount: 450.0,
    category: 'Food',
    date: getRelativeDateString(0),
    paidBy: 'me',
    paymentMethod: 'UPI - HDFC Bank',
    note: 'Morning coffee with team ☕',
  },
  {
    id: '2',
    title: 'Uber Ride',
    amount: 280.0,
    category: 'Transport',
    date: getRelativeDateString(0),
    paidBy: 'me',
    paymentMethod: 'Cash',
  },
  {
    id: '3',
    title: 'Amazon Shopping',
    amount: 1249.0,
    category: 'Shopping',
    date: getRelativeDateString(1),
    paidBy: 'me',
    paymentMethod: 'Credit Card',
  },
];

export const initialFriends: Friend[] = [
  { id: 'f1', name: 'Rahul Sharma', username: 'rahuls', avatar: 'RS', balance: 37.5, online: true },
  { id: 'f2', name: 'Amit Verma', username: 'amitv', avatar: 'AV', balance: 120.0, online: true },
  {
    id: 'f3',
    name: 'Pranav Singh',
    username: 'pranavs',
    avatar: 'PS',
    balance: -20.0,
    online: true,
  },
  { id: 'f4', name: 'Neha Kapoor', username: 'nehak', avatar: 'NK', balance: 0.0, online: false },
  {
    id: 'f5',
    name: 'Sarthak Jain',
    username: 'sarthakj',
    avatar: 'SJ',
    balance: 0.0,
    online: false,
  },
];

export const initialGroups: Group[] = [
  {
    id: 'g1',
    name: 'Trip to Goa 🏖️',
    description: '6 members • Created by You',
    coverImage: 'from-indigo-600 via-purple-600 to-cyan-500',
    members: ['f1', 'f2', 'f3', 'f4', 'f5'],
  },
  {
    id: 'g2',
    name: 'Weekend Dinner',
    description: '4 members',
    coverImage: 'from-violet-600 to-pink-500',
    members: ['f1', 'f2', 'f3'],
  },
  {
    id: 'g3',
    name: 'Office Team',
    description: '12 members',
    coverImage: 'from-blue-600 to-teal-500',
    members: ['f1', 'f2', 'f3', 'f4', 'f5'],
  },
];
