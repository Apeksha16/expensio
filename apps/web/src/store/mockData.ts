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
  isOffline?: boolean;
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
