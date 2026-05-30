import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  paidBy: 'me' | string; // 'me' or friend name
  splitWith?: string[]; // friend names
  splitType?: 'equal' | 'percentage' | 'custom';
  splitPercentages?: Record<string, number>; // friend names -> percentages
  groupId?: string; // associated group if split in group
  paymentMethod?: string; // Credit Card, Cash, etc.
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number; // positive: they owe me, negative: I owe them
  online?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string; // Tailwind gradient classes
  coverUrl?: string; // High-resolution photography cover URL!
  members: string[]; // friend names
}

interface FinanceState {
  expenses: Expense[];
  budgets: Budget[];
  friends: Friend[];
  groups: Group[];
  isAddExpenseOpen: boolean;
  isNotificationsOpen: boolean;
  isProfileOpen: boolean;
  
  // Actions
  setIsAddExpenseOpen: (isOpen: boolean) => void;
  setIsNotificationsOpen: (isOpen: boolean) => void;
  setIsProfileOpen: (isOpen: boolean) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (id: string, updated: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  batchDeleteExpenses: (ids: string[]) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  editBudget: (id: string, updated: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addFriend: (friend: Omit<Friend, 'id' | 'balance'>) => void;
  settleWithFriend: (friendId: string) => void;
  addGroup: (group: Omit<Group, 'id'>) => void;
}

// Initial mockup-aligned dark fintech data
const initialExpenses: Expense[] = [
  { id: '1', title: "McDonald's", amount: 25.50, category: 'Food', date: '2026-05-26', paidBy: 'me', paymentMethod: 'Credit Card', note: 'Lunch with friends' },
  { id: '2', title: 'Starbucks', amount: 4.25, category: 'Food', date: '2026-05-26', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '3', title: 'Fuel', amount: 35.20, category: 'Transport', date: '2026-05-25', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '4', title: 'Uber', amount: 12.40, category: 'Transport', date: '2026-05-25', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '5', title: 'Amazon', amount: 45.00, category: 'Shopping', date: '2026-05-24', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '6', title: 'Netflix', amount: 15.99, category: 'Entertainment', date: '2026-05-24', paidBy: 'me', paymentMethod: 'Credit Card' },
  // Historical transactions to match exact spent sum breakdowns in budgets
  { id: '7', title: 'Trattoria Italian Dinner', amount: 125.25, category: 'Food', date: '2026-05-18', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '8', title: 'Zara Apparel', amount: 75.00, category: 'Shopping', date: '2026-05-15', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '9', title: 'Train Ticket', amount: 20.60, category: 'Transport', date: '2026-05-12', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '10', title: 'Movie Tickets', amount: 30.00, category: 'Entertainment', date: '2026-05-10', paidBy: 'me', paymentMethod: 'Credit Card' },
  { id: '11', title: 'Mobile Bill', amount: 35.00, category: 'Utilities', date: '2026-05-08', paidBy: 'me', paymentMethod: 'Credit Card' },
  // Group shared transaction representing Trip to Goa splits, mathematically summing to exactly ₹1,248.75 (Your share: ₹208.12)
  { id: '12', title: 'Hotel Booking', amount: 600.00, category: 'Travel', date: '2026-05-25', paidBy: 'Rahul Sharma', splitWith: ['me', 'Amit Verma', 'Pranav Singh', 'Neha Kapoor', 'Sarthak Jain'], splitType: 'equal', groupId: 'g1' },
  { id: '13', title: 'Dinner at Cafe 1947', amount: 120.50, category: 'Food', date: '2026-05-25', paidBy: 'me', splitWith: ['Rahul Sharma', 'Amit Verma', 'Pranav Singh', 'Neha Kapoor', 'Sarthak Jain'], splitType: 'equal', groupId: 'g1' },
  { id: '14', title: 'Cab to Hotel', amount: 80.00, category: 'Travel', date: '2026-05-25', paidBy: 'Amit Verma', splitWith: ['me', 'Rahul Sharma', 'Pranav Singh', 'Neha Kapoor', 'Sarthak Jain'], splitType: 'equal', groupId: 'g1' },
  { id: '15', title: 'Goa Flights Booking', amount: 448.25, category: 'Travel', date: '2026-05-24', paidBy: 'Rahul Sharma', splitWith: ['me', 'Amit Verma', 'Pranav Singh', 'Neha Kapoor', 'Sarthak Jain'], splitType: 'equal', groupId: 'g1' }
];

const initialBudgets: Budget[] = [
  { id: 'b1', category: 'Food', limitAmount: 400 },
  { id: 'b2', category: 'Shopping', limitAmount: 300 },
  { id: 'b3', category: 'Transport', limitAmount: 200 },
  { id: 'b4', category: 'Entertainment', limitAmount: 150 },
  { id: 'b5', category: 'Utilities', limitAmount: 100 }
];

const initialFriends: Friend[] = [
  { id: 'f1', name: 'Rahul Sharma', username: 'rahuls', avatar: 'RS', balance: 37.50, online: true }, // Rahul owes me ₹37.50
  { id: 'f2', name: 'Amit Verma', username: 'amitv', avatar: 'AV', balance: 120.00, online: true }, // Amit owes me ₹120.00
  { id: 'f3', name: 'Pranav Singh', username: 'pranavs', avatar: 'PS', balance: -20.00, online: true }, // I owe Pranav ₹20.00
  { id: 'f4', name: 'Neha Kapoor', username: 'nehak', avatar: 'NK', balance: 0.00, online: false }, // Settled
  { id: 'f5', name: 'Sarthak Jain', username: 'sarthakj', avatar: 'SJ', balance: 0.00, online: false }  // Settled
];

const initialGroups: Group[] = [
  { id: 'g1', name: 'Trip to Goa 🏖️', description: '6 members • Created by You', coverImage: 'from-indigo-600 via-purple-600 to-cyan-500', coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', members: ['Rahul Sharma', 'Amit Verma', 'Pranav Singh', 'Neha Kapoor', 'Sarthak Jain'] },
  { id: 'g2', name: 'Weekend Dinner', description: '4 members', coverImage: 'from-violet-600 to-pink-500', coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', members: ['Rahul Sharma', 'Amit Verma', 'Pranav Singh'] },
  { id: 'g3', name: 'Office Team', description: '12 members', coverImage: 'from-blue-600 to-teal-500', coverUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', members: ['Rahul Sharma', 'Amit Verma', 'Pranav Singh', 'Neha Kapoor', 'Sarthak Jain'] }
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      expenses: initialExpenses,
      budgets: initialBudgets,
      friends: initialFriends,
      groups: initialGroups,
      isAddExpenseOpen: false,
      isNotificationsOpen: false,
      isProfileOpen: false,

      setIsAddExpenseOpen: (isOpen) => set({ isAddExpenseOpen: isOpen }),
      setIsNotificationsOpen: (isOpen) => set({ isNotificationsOpen: isOpen }),
      setIsProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),

      addExpense: (expense) => set((state) => {
        const newExpense: Expense = {
          ...expense,
          id: Math.random().toString(36).substring(2, 9)
        };

        // If split is configured, update corresponding friends' balances
        let updatedFriends = [...state.friends];
        if (newExpense.splitWith && newExpense.splitWith.length > 0) {
          if (newExpense.splitType === 'percentage' && newExpense.splitPercentages) {
            // Percentage split custom calculations
            if (newExpense.paidBy === 'me') {
              updatedFriends = state.friends.map(friend => {
                if (newExpense.splitWith?.includes(friend.name)) {
                  const pct = newExpense.splitPercentages?.[friend.name] || 0;
                  const shareAmount = Number((newExpense.amount * (pct / 100)).toFixed(2));
                  return { ...friend, balance: Number((friend.balance + shareAmount).toFixed(2)) };
                }
                return friend;
              });
            } else {
              updatedFriends = state.friends.map(friend => {
                if (friend.name === newExpense.paidBy) {
                  const myPct = newExpense.splitPercentages?.['me'] || 0;
                  const myShare = Number((newExpense.amount * (myPct / 100)).toFixed(2));
                  return { ...friend, balance: Number((friend.balance - myShare).toFixed(2)) };
                }
                return friend;
              });
            }
          } else {
            // Default equal split calculations
            const splitCount = newExpense.splitWith.length + 1; // friends + me
            const shareAmount = Number((newExpense.amount / splitCount).toFixed(2));
            
            if (newExpense.paidBy === 'me') {
              updatedFriends = state.friends.map(friend => {
                if (newExpense.splitWith?.includes(friend.name)) {
                  return { ...friend, balance: Number((friend.balance + shareAmount).toFixed(2)) };
                }
                return friend;
              });
            } else {
              updatedFriends = state.friends.map(friend => {
                if (friend.name === newExpense.paidBy) {
                  const myShare = Number((newExpense.amount / splitCount).toFixed(2));
                  return { ...friend, balance: Number((friend.balance - myShare).toFixed(2)) };
                }
                return friend;
              });
            }
          }
        }

        return {
          expenses: [newExpense, ...state.expenses],
          friends: updatedFriends
        };
      }),

      editExpense: (id, updated) => set((state) => {
        const oldExpense = state.expenses.find(e => e.id === id);
        if (!oldExpense) return {};

        let revertedFriends = [...state.friends];
        if (oldExpense.splitWith && oldExpense.splitWith.length > 0) {
          const splitCount = oldExpense.splitWith.length + 1;
          const shareAmount = Number((oldExpense.amount / splitCount).toFixed(2));

          if (oldExpense.paidBy === 'me') {
            revertedFriends = state.friends.map(friend => {
              if (oldExpense.splitWith?.includes(friend.name)) {
                return { ...friend, balance: Number((friend.balance - shareAmount).toFixed(2)) };
              }
              return friend;
            });
          } else {
            revertedFriends = state.friends.map(friend => {
              if (friend.name === oldExpense.paidBy) {
                const myShare = Number((oldExpense.amount / splitCount).toFixed(2));
                return { ...friend, balance: Number((friend.balance + myShare).toFixed(2)) };
              }
              return friend;
            });
          }
        }

        const updatedExpense: Expense = {
          ...oldExpense,
          ...updated
        };

        let updatedFriends = [...revertedFriends];
        if (updatedExpense.splitWith && updatedExpense.splitWith.length > 0) {
          const splitCount = updatedExpense.splitWith.length + 1;
          const shareAmount = Number((updatedExpense.amount / splitCount).toFixed(2));

          if (updatedExpense.paidBy === 'me') {
            updatedFriends = revertedFriends.map(friend => {
              if (updatedExpense.splitWith?.includes(friend.name)) {
                return { ...friend, balance: Number((friend.balance + shareAmount).toFixed(2)) };
              }
              return friend;
            });
          } else {
            updatedFriends = revertedFriends.map(friend => {
              if (friend.name === updatedExpense.paidBy) {
                const myShare = Number((updatedExpense.amount / splitCount).toFixed(2));
                return { ...friend, balance: Number((friend.balance - myShare).toFixed(2)) };
              }
              return friend;
            });
          }
        }

        return {
          expenses: state.expenses.map(e => e.id === id ? updatedExpense : e),
          friends: updatedFriends
        };
      }),

      deleteExpense: (id) => set((state) => {
        const expenseToDelete = state.expenses.find(e => e.id === id);
        if (!expenseToDelete) return {};

        let updatedFriends = [...state.friends];
        if (expenseToDelete.splitWith && expenseToDelete.splitWith.length > 0) {
          if (expenseToDelete.splitType === 'percentage' && expenseToDelete.splitPercentages) {
            // Revert percentage splits custom calculations
            if (expenseToDelete.paidBy === 'me') {
              updatedFriends = state.friends.map(friend => {
                if (expenseToDelete.splitWith?.includes(friend.name)) {
                  const pct = expenseToDelete.splitPercentages?.[friend.name] || 0;
                  const shareAmount = Number((expenseToDelete.amount * (pct / 100)).toFixed(2));
                  return { ...friend, balance: Number((friend.balance - shareAmount).toFixed(2)) };
                }
                return friend;
              });
            } else {
              updatedFriends = state.friends.map(friend => {
                if (friend.name === expenseToDelete.paidBy) {
                  const myPct = expenseToDelete.splitPercentages?.['me'] || 0;
                  const myShare = Number((expenseToDelete.amount * (myPct / 100)).toFixed(2));
                  return { ...friend, balance: Number((friend.balance + myShare).toFixed(2)) };
                }
                return friend;
              });
            }
          } else {
            // Revert default equal split calculations
            const splitCount = expenseToDelete.splitWith.length + 1;
            const shareAmount = Number((expenseToDelete.amount / splitCount).toFixed(2));
            
            if (expenseToDelete.paidBy === 'me') {
              updatedFriends = state.friends.map(friend => {
                if (expenseToDelete.splitWith?.includes(friend.name)) {
                  return { ...friend, balance: Number((friend.balance - shareAmount).toFixed(2)) };
                }
                return friend;
              });
            } else {
              updatedFriends = state.friends.map(friend => {
                if (friend.name === expenseToDelete.paidBy) {
                  const myShare = Number((expenseToDelete.amount / splitCount).toFixed(2));
                  return { ...friend, balance: Number((friend.balance + myShare).toFixed(2)) };
                }
                return friend;
              });
            }
          }
        }

        return {
          expenses: state.expenses.filter((e) => e.id !== id),
          friends: updatedFriends
        };
      }),

      batchDeleteExpenses: (ids) => set((state) => {
        let updatedExpenses = [...state.expenses];
        let updatedFriends = [...state.friends];

        ids.forEach(id => {
          const expenseToDelete = updatedExpenses.find(e => e.id === id);
          if (!expenseToDelete) return;

          if (expenseToDelete.splitWith && expenseToDelete.splitWith.length > 0) {
            const splitCount = expenseToDelete.splitWith.length + 1;
            const shareAmount = Number((expenseToDelete.amount / splitCount).toFixed(2));

            if (expenseToDelete.paidBy === 'me') {
              updatedFriends = updatedFriends.map(friend => {
                if (expenseToDelete.splitWith?.includes(friend.name)) {
                  return { ...friend, balance: Number((friend.balance - shareAmount).toFixed(2)) };
                }
                return friend;
              });
            } else {
              updatedFriends = updatedFriends.map(friend => {
                if (friend.name === expenseToDelete.paidBy) {
                  const myShare = Number((expenseToDelete.amount / splitCount).toFixed(2));
                  return { ...friend, balance: Number((friend.balance + myShare).toFixed(2)) };
                }
                return friend;
              });
            }
          }

          updatedExpenses = updatedExpenses.filter(e => e.id !== id);
        });

        return {
          expenses: updatedExpenses,
          friends: updatedFriends
        };
      }),

      addBudget: (budget) => set((state) => ({
        budgets: [...state.budgets, { ...budget, id: Math.random().toString(36).substring(2, 9) }]
      })),

      editBudget: (id, updated) => set((state) => ({
        budgets: state.budgets.map((b) => b.id === id ? { ...b, ...updated } : b)
      })),

      deleteBudget: (id) => set((state) => ({
        budgets: state.budgets.filter((b) => b.id !== id)
      })),

      addFriend: (friend) => set((state) => ({
        friends: [...state.friends, { ...friend, id: Math.random().toString(36).substring(2, 9), balance: 0.00 }]
      })),

      settleWithFriend: (friendId) => set((state) => ({
        friends: state.friends.map((f) => f.id === friendId ? { ...f, balance: 0.00 } : f)
      })),

      addGroup: (group) => set((state) => ({
        groups: [...state.groups, { ...group, id: Math.random().toString(36).substring(2, 9) }]
      }))
    }),
    {
      name: 'expensio-finance-store-v4',
      skipHydration: false
    }
  )
);
