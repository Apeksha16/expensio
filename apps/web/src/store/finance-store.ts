import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FinanceState {
  isAddExpenseOpen: boolean;
  isAddBudgetOpen: boolean;
  isNotificationsOpen: boolean;
  isProfileOpen: boolean;
  isExpensesSelectionActive: boolean;
  isCalendarFilterOpen: boolean;
  selectedPeriod: string;
  customStartDate: string | null;
  customEndDate: string | null;

  // Actions
  setIsAddExpenseOpen: (isOpen: boolean) => void;
  setIsAddBudgetOpen: (isOpen: boolean) => void;
  setIsNotificationsOpen: (isOpen: boolean) => void;
  setIsProfileOpen: (isOpen: boolean) => void;
  setIsExpensesSelectionActive: (active: boolean) => void;
  setIsCalendarFilterOpen: (isOpen: boolean) => void;
  setCustomDateRange: (start: string | null, end: string | null) => void;
  setSelectedPeriod: (period: string) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      isAddExpenseOpen: false,
      isAddBudgetOpen: false,
      isNotificationsOpen: false,
      isProfileOpen: false,
      isExpensesSelectionActive: false,
      isCalendarFilterOpen: false,
      selectedPeriod: 'This Month',
      customStartDate: null,
      customEndDate: null,

      setIsAddExpenseOpen: (isOpen) => set({ isAddExpenseOpen: isOpen }),
      setIsAddBudgetOpen: (isOpen) => set({ isAddBudgetOpen: isOpen }),
      setIsNotificationsOpen: (isOpen) => set({ isNotificationsOpen: isOpen }),
      setIsProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
      setIsExpensesSelectionActive: (active) => set({ isExpensesSelectionActive: active }),
      setIsCalendarFilterOpen: (isOpen) => set({ isCalendarFilterOpen: isOpen }),
      setCustomDateRange: (start, end) => set({ customStartDate: start, customEndDate: end }),
      setSelectedPeriod: (period) => set({ selectedPeriod: period }),
    }),
    {
      name: 'expensio-finance-store-v4',
      skipHydration: false,
    }
  )
);
