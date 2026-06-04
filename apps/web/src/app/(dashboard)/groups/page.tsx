'use client';

import React, { useState } from 'react';
import { Friend, Group, Expense, useFinanceStore } from '../../../store/finance-store';
import GroupCard from '../../../components/shared/GroupCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import {
  Plus,
  ArrowLeft,
  Users,
  FolderOpen,
  Share2,
  Menu,
  Bell,
  Search,
  ChevronRight,
  Calendar,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Trash2,
  Edit2,
  Sliders,
  Check,
  Clock,
  Utensils,
  Briefcase,
  Home,
  Car,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to compute user's net balance in a specific group
function getGroupUserBalance(group: Group, expenses: Expense[]) {
  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  let netBalance = 0;

  groupExpenses.forEach((exp) => {
    const shareCount = group.members.length + 1;
    const shareAmount = exp.amount / shareCount;

    if (exp.paidBy === 'me') {
      netBalance += shareAmount * (shareCount - 1);
    } else {
      netBalance -= shareAmount;
    }
  });

  return Number(netBalance.toFixed(2));
}

// Helper to get category icons for recent expenses
const getExpenseCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('food') || c.includes('dinner') || c.includes('meals')) {
    return {
      icon: Utensils,
      bg: 'bg-pink-50 dark:bg-pink-950/20',
      text: 'text-pink-650 dark:text-pink-400',
    };
  }
  if (c.includes('travel') || c.includes('stay') || c.includes('hotel')) {
    return {
      icon: Home,
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      text: 'text-indigo-650 dark:text-indigo-400',
    };
  }
  if (c.includes('entertainment') || c.includes('scuba') || c.includes('activity')) {
    return {
      icon: FolderOpen,
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-655 dark:text-emerald-450',
    };
  }
  if (c.includes('transport') || c.includes('cab') || c.includes('taxi')) {
    return {
      icon: Car,
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-650 dark:text-purple-400',
    };
  }
  return {
    icon: Briefcase,
    bg: 'bg-zinc-50 dark:bg-zinc-950/20',
    text: 'text-zinc-650 dark:text-zinc-400',
  };
};

export default function GroupsPage() {
  const { groups, addGroup, friends, expenses, addExpense, deleteExpense, settleWithFriend } =
    useFinanceStore();

  // Navigation state: selected group ID
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Sub-tab selection inside Group Detail screen
  const [activeDetailTab, setActiveDetailTab] = useState<
    'overview' | 'expenses' | 'members' | 'settlements'
  >('overview');

  // Search queries & modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverIndex, setCoverIndex] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // List filter tab state: 'all' | 'owe-you' | 'you-owe'
  const [filterTab, setFilterTab] = useState<'all' | 'owe-you' | 'you-owe'>('all');

  // Add group expense states
  const [isAddGroupExpenseOpen, setIsAddGroupExpenseOpen] = useState(false);
  const [groupExpenseAmount, setGroupExpenseAmount] = useState('');
  const [groupExpenseTitle, setGroupExpenseTitle] = useState('');
  const [groupExpenseCategory, setGroupExpenseCategory] = useState('Food');
  const [groupExpenseDate, setGroupExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupExpenseNote, setGroupExpenseNote] = useState('');

  // Settle member overlay state
  const [activeSettleMemberName, setActiveSettleMemberName] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const gradientCovers = [
    'from-indigo-600 to-cyan-500',
    'from-emerald-500 to-teal-400',
    'from-orange-500 to-rose-500',
    'from-pink-500 to-indigo-600',
    'from-violet-600 to-fuchsia-500',
  ];

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    addGroup({
      name,
      description,
      coverImage: gradientCovers[coverIndex],
      members: selectedMembers,
    });

    setName('');
    setDescription('');
    setCoverIndex(0);
    setSelectedMembers([]);
    setIsAddGroupOpen(false);
  };

  const handleMemberToggle = (friendName: string) => {
    if (selectedMembers.includes(friendName)) {
      setSelectedMembers(selectedMembers.filter((name) => name !== friendName));
    } else {
      setSelectedMembers([...selectedMembers, friendName]);
    }
  };

  const handleAddGroupExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedGroupId ||
      !groupExpenseAmount ||
      isNaN(Number(groupExpenseAmount)) ||
      !groupExpenseTitle
    )
      return;

    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    addExpense({
      title: groupExpenseTitle,
      amount: Number(groupExpenseAmount),
      category: groupExpenseCategory,
      date: groupExpenseDate,
      note: groupExpenseNote,
      paidBy: 'me',
      splitWith: group.members,
      splitType: 'equal',
      groupId: selectedGroupId,
    });

    setGroupExpenseAmount('');
    setGroupExpenseTitle('');
    setGroupExpenseCategory('Food');
    setGroupExpenseDate(new Date().toISOString().split('T')[0]);
    setGroupExpenseNote('');
    setIsAddGroupExpenseOpen(false);
  };

  const handleSettleMember = (memberName: string, amount: number) => {
    setActiveSettleMemberName(memberName);
    setSettleAmount(amount);
  };

  const executeMemberSettlement = () => {
    if (!selectedGroupId || !activeSettleMemberName) return;

    // Create a virtual expense representing a settlement in the group
    // To settle, if they owed me, they pay me. If I owed them, I pay them.
    const isUserReceiving = settleAmount > 0;
    const absAmount = Math.abs(settleAmount);

    addExpense({
      title: `Settlement: ${isUserReceiving ? activeSettleMemberName : 'Me'} -> ${isUserReceiving ? 'Me' : activeSettleMemberName}`,
      amount: absAmount,
      category: 'Others',
      date: new Date().toISOString().split('T')[0],
      paidBy: isUserReceiving ? activeSettleMemberName : 'me',
      splitWith: [isUserReceiving ? 'me' : activeSettleMemberName],
      splitType: 'custom',
      groupId: selectedGroupId,
      note: `Direct group balance squared up.`,
    });

    setShowSuccessOverlay(true);
    setTimeout(() => {
      setShowSuccessOverlay(false);
      setActiveSettleMemberName(null);
    }, 1250);
  };

  // Find active group object if selected
  const activeGroup = groups.find((g) => g.id === selectedGroupId);

  // Group-specific computations
  const activeGroupExpenses = expenses.filter((e) => e.groupId === selectedGroupId);
  const activeGroupTotalSpend = activeGroupExpenses.reduce((sum, e) => sum + e.amount, 0);
  const activeGroupPaidByMe = activeGroupExpenses
    .filter((e) => e.paidBy === 'me')
    .reduce((sum, e) => sum + e.amount, 0);

  // User balance in active group
  const activeGroupUserBalance = activeGroup ? getGroupUserBalance(activeGroup, expenses) : 0;

  // Filter groups for main list
  const displayedGroups = groups.filter((group) => {
    if (groupSearchQuery.trim().length > 0) {
      const q = groupSearchQuery.toLowerCase();
      if (!group.name.toLowerCase().includes(q) && !group.description.toLowerCase().includes(q)) {
        return false;
      }
    }

    const bal = getGroupUserBalance(group, expenses);
    if (filterTab === 'owe-you' && bal <= 0) return false;
    if (filterTab === 'you-owe' && bal >= 0) return false;

    return true;
  });

  // Aggregate stats across all groups
  const netAggregateOwed = groups
    .map((g) => getGroupUserBalance(g, expenses))
    .filter((bal) => bal > 0)
    .reduce((sum, bal) => sum + bal, 0);

  const netAggregateOwe = groups
    .map((g) => getGroupUserBalance(g, expenses))
    .filter((bal) => bal < 0)
    .reduce((sum, bal) => sum + Math.abs(bal), 0);

  return (
    <div className="space-y-6 pb-6 select-none relative">
      {activeGroup ? (
        /* ========================================================================= */
        /* ==================== 2. DETAILED GROUP OVERVIEW VIEW ==================== */
        /* ========================================================================= */
        <div className="space-y-6 animate-fade-in pb-20">
          {/* Header row with back icon */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => {
                setSelectedGroupId(null);
                setActiveDetailTab('overview');
              }}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-theme-text active:scale-95 transition-all cursor-pointer"
              aria-label="Back to Groups"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
            </button>
            <button className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-theme-text cursor-pointer">
              <span className="text-[10px] font-black tracking-widest text-theme-secondary">
                •••
              </span>
            </button>
          </div>

          {/* Group details identity cards */}
          <div className="flex flex-col items-center justify-center text-center gap-3">
            {/* Center Folder Icon squircle */}
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <FolderOpen className="w-6.5 h-6.5 stroke-[2.25]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight text-theme-text">
                {activeGroup.name}
              </h2>
              <p className="text-[10px] text-theme-secondary uppercase font-black tracking-wider leading-none">
                {activeGroup.members.length + 1} members • Created by You
              </p>
            </div>

            {/* Overlapping member circles stack */}
            <div className="flex items-center justify-center -space-x-2 pt-1">
              <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[8.5px] font-extrabold text-white">
                Me
              </div>
              {activeGroup.members.slice(0, 4).map((member, idx) => {
                const colors = ['bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500'];
                const initials = member
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2);
                return (
                  <div
                    key={member}
                    className={`w-7 h-7 rounded-full ${colors[idx % colors.length]} border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[8.5px] font-extrabold text-white`}
                  >
                    {initials}
                  </div>
                );
              })}
              {activeGroup.members.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[8px] font-black text-theme-secondary">
                  +{activeGroup.members.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Sub Tab Navigation Selection Row */}
          <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-800/80 px-1 pt-1.5">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'expenses', label: 'Expenses' },
              { id: 'members', label: 'Members' },
              { id: 'settlements', label: 'Settlements' },
            ].map((tab) => {
              const isSelected = activeDetailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`pb-3 text-[10px] font-black uppercase tracking-wider relative cursor-pointer outline-none border-0 bg-transparent ${
                    isSelected
                      ? 'text-indigo-650 dark:text-indigo-400'
                      : 'text-theme-secondary hover:text-theme-text'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isSelected && (
                    <motion.div
                      layoutId="activeGroupDetailTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab contents wrapper */}
          <div className="space-y-6">
            {activeDetailTab === 'overview' && (
              <>
                {/* 1. Spend Summary aggregates card (Navy/Dark card) */}
                <div className="p-5 rounded-[28px] bg-zinc-950 dark:bg-zinc-900/60 border border-zinc-850 flex flex-col gap-4.5 shadow-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                        Total Expenses
                      </span>
                      <span className="text-xl font-extrabold text-zinc-100 mt-1">
                        ₹
                        {activeGroupTotalSpend.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      {activeGroupUserBalance > 0 ? (
                        <>
                          <span className="text-[8.5px] font-black text-emerald-450 uppercase tracking-widest leading-none">
                            You are owed
                          </span>
                          <span className="text-xl font-extrabold text-emerald-450 mt-1">
                            ₹
                            {activeGroupUserBalance.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      ) : activeGroupUserBalance < 0 ? (
                        <>
                          <span className="text-[8.5px] font-black text-rose-455 uppercase tracking-widest leading-none">
                            You owe
                          </span>
                          <span className="text-xl font-extrabold text-rose-455 mt-1">
                            ₹
                            {Math.abs(activeGroupUserBalance).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[8.5px] font-black text-zinc-550 uppercase tracking-widest leading-none">
                            You owe
                          </span>
                          <span className="text-xl font-extrabold text-zinc-350 mt-1">₹0.00</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  {activeGroupTotalSpend > 0 && (
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-zinc-900 dark:bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 dark:bg-emerald-450 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (activeGroupPaidByMe / activeGroupTotalSpend) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-black text-zinc-500 uppercase tracking-wider">
                        <span>
                          You paid ₹{activeGroupPaidByMe.toFixed(0)} (
                          {((activeGroupPaidByMe / activeGroupTotalSpend) * 100).toFixed(0)}%)
                        </span>
                        <span>{activeGroupExpenses.length} expenses</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Next settlement info card */}
                <div className="p-4 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850/80 shadow-xs flex items-center justify-between gap-3 select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-450 flex items-center justify-center shrink-0">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-theme-text leading-none">
                          Next settlement
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[7.5px] font-black bg-orange-500/15 text-orange-600 dark:text-orange-450 border border-orange-500/20 uppercase tracking-widest leading-none scale-90">
                          Pending
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-theme-secondary">
                        {activeGroupUserBalance > 0
                          ? `${activeGroup.members[0]} owes you ₹${Math.abs(Math.round(activeGroupUserBalance))}.00`
                          : activeGroupUserBalance < 0
                            ? `You owe ${activeGroup.members[0]} ₹${Math.abs(Math.round(activeGroupUserBalance))}.00`
                            : 'All settled up inside this group!'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 text-zinc-450 shrink-0" />
                </div>

                {/* 3. Recent expenses list section */}
                <div className="space-y-3 px-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-theme-secondary">
                      Recent expenses
                    </h3>
                    <button
                      onClick={() => setActiveDetailTab('expenses')}
                      className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {activeGroupExpenses.length === 0 ? (
                      <div className="p-10 rounded-3xl border border-zinc-150 dark:border-zinc-850/60 bg-white dark:bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-850 text-zinc-400">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-theme-text">
                          No Transactions Yet
                        </span>
                      </div>
                    ) : (
                      activeGroupExpenses.slice(0, 4).map((exp) => {
                        const iconMeta = getExpenseCategoryIcon(exp.category);
                        const IconComponent = iconMeta.icon;
                        const isPaidByMe = exp.paidBy === 'me';
                        return (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between gap-3 border-b border-zinc-100/40 dark:border-zinc-850/30 pb-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-2xl border ${iconMeta.bg} ${iconMeta.text} flex items-center justify-center shrink-0`}
                              >
                                <IconComponent className="w-4.5 h-4.5 stroke-[2.25]" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[12px] font-black text-theme-text leading-tight truncate">
                                  {exp.title}
                                </h4>
                                <span className="text-[9.5px] font-bold text-theme-secondary mt-0.5 block">
                                  {new Date(exp.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}{' '}
                                  • Paid by {isPaidByMe ? 'You' : exp.paidBy.split(' ')[0]}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                              <span className="text-[12px] font-black text-theme-text leading-none">
                                ₹{exp.amount.toFixed(2)}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider border leading-none scale-90 ${
                                  isPaidByMe
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-650 dark:text-indigo-400'
                                }`}
                              >
                                {isPaidByMe ? 'You Paid' : 'Split'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={() => setIsAddGroupExpenseOpen(true)}
                    className="w-full py-3.5 rounded-2xl bg-indigo-650/5 hover:bg-indigo-650/10 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-650 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest cursor-pointer mt-1 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Expense</span>
                  </button>
                </div>

                {/* 4. Balance Illustration Card */}
                <div className="p-5 rounded-[28px] bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/10 shadow-xs flex items-center justify-between gap-5 relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">
                      Your balance in this group
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {activeGroupUserBalance > 0 ? (
                        <>
                          <span className="text-[9px] font-bold text-theme-secondary uppercase">
                            You are owed
                          </span>
                          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-450">
                            ₹
                            {activeGroupUserBalance.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      ) : activeGroupUserBalance < 0 ? (
                        <>
                          <span className="text-[9px] font-bold text-theme-secondary uppercase">
                            You owe
                          </span>
                          <span className="text-xl font-extrabold text-rose-600 dark:text-rose-455">
                            ₹
                            {Math.abs(activeGroupUserBalance).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold text-theme-secondary uppercase">
                            Squared Up
                          </span>
                          <span className="text-xl font-extrabold text-theme-secondary">₹0.00</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Beautiful custom vector illustration of a wallet in SVG/CSS */}
                  <div className="w-24 h-24 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full max-h-[80px]">
                      {/* Floating Coins */}
                      <circle cx="35" cy="22" r="7" className="fill-amber-400" />
                      <path
                        d="M35,18 L35,26 M32,22 L38,22"
                        stroke="white"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                      <circle cx="20" cy="35" r="5" className="fill-amber-400 opacity-80" />

                      {/* Main Wallet Base */}
                      <rect
                        x="15"
                        y="40"
                        width="70"
                        height="46"
                        rx="14"
                        className="fill-indigo-600 dark:fill-indigo-700"
                      />
                      {/* Wallet Front Pocket */}
                      <path
                        d="M15,50 L85,50 L85,76 C85,82 80,86 74,86 L26,86 C20,86 15,82 15,76 Z"
                        className="fill-indigo-500 dark:fill-indigo-600"
                      />

                      {/* Folded Cash bills sticking out */}
                      <rect
                        x="30"
                        y="28"
                        width="40"
                        height="20"
                        rx="3"
                        className="fill-emerald-450 rotate-[5deg] origin-bottom-left"
                      />
                      <rect
                        x="30"
                        y="28"
                        width="40"
                        height="20"
                        rx="3"
                        className="fill-emerald-500 opacity-90 rotate-[-5deg] origin-bottom-left"
                      />

                      {/* Wallet Flap Closer */}
                      <path
                        d="M68,54 L84,54 C87,54 89,56 89,59 L89,63 C89,66 87,68 84,68 L68,68 Z"
                        className="fill-indigo-700 dark:fill-indigo-850"
                      />
                      <circle cx="80" cy="61" r="3.5" className="fill-amber-400 animate-pulse" />
                    </svg>
                  </div>
                </div>
              </>
            )}

            {activeDetailTab === 'expenses' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search group expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-xs font-bold text-theme-text focus:outline-none"
                  />
                </div>

                <div className="space-y-3.5">
                  {activeGroupExpenses
                    .filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((exp) => {
                      const iconMeta = getExpenseCategoryIcon(exp.category);
                      const IconComponent = iconMeta.icon;
                      const isPaidByMe = exp.paidBy === 'me';
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850/80 rounded-2xl shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-2xl border ${iconMeta.bg} ${iconMeta.text} flex items-center justify-center shrink-0`}
                            >
                              <IconComponent className="w-4.5 h-4.5 stroke-[2.25]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[12px] font-black text-theme-text leading-tight truncate">
                                {exp.title}
                              </h4>
                              <span className="text-[9px] font-bold text-theme-secondary mt-0.5 block">
                                {exp.date} • Paid by {isPaidByMe ? 'You' : exp.paidBy.split(' ')[0]}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-black text-theme-text">
                              ₹{exp.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => deleteExpense(exp.id)}
                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 transition-all cursor-pointer border-0 bg-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {activeDetailTab === 'members' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/10 text-[10px] font-bold text-indigo-650 dark:text-indigo-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Click settle next to any member to record direct cash settlement inside this
                    group.
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Me row */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-indigo-500/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-650 text-white font-black text-xs flex items-center justify-center">
                        Me
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-theme-text leading-none">
                          Me (You)
                        </h4>
                        <span className="text-[9px] font-bold text-theme-secondary mt-1 block">
                          Group Creator
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      You
                    </span>
                  </div>

                  {/* Other members */}
                  {activeGroup.members.map((member) => {
                    // Compute balance specifically with this member
                    let balanceWithMember = 0;
                    activeGroupExpenses.forEach((exp) => {
                      const shareCount = activeGroup.members.length + 1;
                      const shareAmount = exp.amount / shareCount;

                      if (exp.paidBy === 'me' && exp.splitWith?.includes(member)) {
                        balanceWithMember += shareAmount;
                      } else if (exp.paidBy === member && exp.splitWith?.includes('me')) {
                        balanceWithMember -= shareAmount;
                      }
                    });

                    const roundedBal = Number(balanceWithMember.toFixed(2));
                    const initials = member
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2);

                    return (
                      <div
                        key={member}
                        className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850/80 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 font-black text-xs text-theme-secondary flex items-center justify-center">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-theme-text leading-none">
                              {member}
                            </h4>
                            <span className="text-[9px] font-bold text-theme-secondary mt-1 block">
                              {roundedBal > 0
                                ? `owes you ₹${roundedBal.toFixed(2)}`
                                : roundedBal < 0
                                  ? `you owe ₹${Math.abs(roundedBal).toFixed(2)}`
                                  : 'settled'}
                            </span>
                          </div>
                        </div>

                        {roundedBal !== 0 && (
                          <button
                            onClick={() => handleSettleMember(member, roundedBal)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider cursor-pointer border border-indigo-500/20 active:scale-95 transition-all"
                          >
                            Settle
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeDetailTab === 'settlements' && (
              <div className="space-y-4">
                {activeGroupExpenses.filter((e) => e.title.includes('Settlement:')).length === 0 ? (
                  <div className="p-12 rounded-3xl border border-zinc-150 dark:border-zinc-850/60 bg-white dark:bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-850 text-zinc-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-theme-text">
                        No Settlements Recorded
                      </span>
                      <p className="text-[10px] text-theme-secondary leading-relaxed">
                        Settle balances to keep a history of cash settlements here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeGroupExpenses
                      .filter((e) => e.title.includes('Settlement:'))
                      .map((settle) => (
                        <div
                          key={settle.id}
                          className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between gap-3 animate-fade-in"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-theme-text leading-none">
                                {settle.title.replace('Settlement: ', '')}
                              </h4>
                              <span className="text-[9.5px] font-bold text-theme-secondary mt-1 block">
                                {settle.date} • Confirmed
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-450">
                            ₹{settle.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Docked Action Buttons Footer */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-150 dark:border-zinc-850/60 flex items-center justify-center gap-4 z-40 max-w-md mx-auto">
            <button
              onClick={() => {
                if (activeGroup.members.length > 0) {
                  handleSettleMember(activeGroup.members[0], activeGroupUserBalance);
                }
              }}
              className="flex-1 py-3.5 rounded-2xl bg-zinc-550/10 hover:bg-zinc-550/15 border border-zinc-200 dark:border-zinc-850 text-theme-text font-black text-xs uppercase tracking-widest cursor-pointer active:scale-[0.98] transition-all"
            >
              Request Payment
            </button>
            <button
              onClick={() => {
                if (activeGroup.members.length > 0) {
                  handleSettleMember(activeGroup.members[0], activeGroupUserBalance);
                }
              }}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-md shadow-indigo-500/10 active:scale-[0.98] transition-all border-0 flex items-center justify-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              <span>Settle Up</span>
            </button>
          </div>
        </div>
      ) : (
        /* ======================================================================= */
        /* ==================== 1. MAIN GROUPS LIST SHELL SCREEN ================== */
        /* ======================================================================= */
        <div className="space-y-6 animate-fade-in pb-6">
          {/* Header row layout */}
          <div className="flex items-center justify-between px-1">
            <button className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-theme-text cursor-pointer">
              <Menu className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
            <div className="relative">
              <button className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-theme-text cursor-pointer">
                <Bell className="w-4.5 h-4.5 stroke-[2.5]" />
              </button>
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[7.5px] font-black flex items-center justify-center border-2 border-white dark:border-zinc-950">
                2
              </span>
            </div>
          </div>

          {/* Title & subtitle info */}
          <div className="px-1 space-y-0.5">
            <h2 className="text-xl font-extrabold tracking-tight text-theme-text">Groups</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Manage and settle shared expenses
            </p>
          </div>

          {/* Hero balance overview banner card */}
          <div className="p-5.5 rounded-3xl bg-linear-to-br from-violet-600 via-indigo-650 to-indigo-500 border border-indigo-400/20 text-white relative overflow-hidden shadow-lg select-none flex flex-col gap-6">
            <div className="absolute top-[-30%] right-[-10%] w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            {/* Dotted paths SVG network graphic (no images) */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center pointer-events-none select-none z-0">
              <svg viewBox="0 0 160 120" className="w-full h-full opacity-80 max-h-[100px]">
                {/* Dotted curve paths connecting nodes */}
                <path
                  d="M20,95 Q50,75 80,60 T140,25"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
                <path
                  d="M40,95 Q80,95 110,60 T140,40"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />

                {/* Node 1: Me */}
                <g transform="translate(80, 60)">
                  <circle
                    cx="0"
                    cy="0"
                    r="11"
                    fill="rgba(255,255,255,0.15)"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill="white"
                    fontSize="9"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    Me
                  </text>
                </g>

                {/* Node 2: RS */}
                <g transform="translate(20, 95)">
                  <circle
                    cx="0"
                    cy="0"
                    r="10"
                    fill="#ec4899"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                  />
                  <text x="0" y="3" fill="white" fontSize="8" fontWeight="800" textAnchor="middle">
                    RS
                  </text>
                </g>

                {/* Node 3: AV */}
                <g transform="translate(140, 25)">
                  <circle
                    cx="0"
                    cy="0"
                    r="10"
                    fill="#10b981"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                  />
                  <text x="0" y="3" fill="white" fontSize="8" fontWeight="800" textAnchor="middle">
                    AV
                  </text>
                </g>

                {/* Node 4: NK */}
                <g transform="translate(140, 75)">
                  <circle
                    cx="0"
                    cy="0"
                    r="9"
                    fill="#f59e0b"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="2.5"
                    fill="white"
                    fontSize="7.5"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    NK
                  </text>
                </g>
              </svg>
            </div>

            <div className="space-y-4 z-10">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8.5px] font-black uppercase text-indigo-150 tracking-widest">
                  Total you owe
                </span>
                <span className="text-xl font-extrabold text-white">
                  ₹{netAggregateOwe.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[8.5px] font-black uppercase text-indigo-150 tracking-widest">
                  Total you are owed
                </span>
                <span className="text-xl font-extrabold text-emerald-450">
                  ₹{netAggregateOwed.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills Tab Row Selector */}
          <div className="flex gap-2 px-1">
            {[
              { id: 'all', label: 'All', count: groups.length, color: 'bg-indigo-650' },
              {
                id: 'owe-you',
                label: 'Owe you',
                count: groups.filter((g) => getGroupUserBalance(g, expenses) > 0).length,
                color: 'bg-emerald-500',
              },
              {
                id: 'you-owe',
                label: 'You owe',
                count: groups.filter((g) => getGroupUserBalance(g, expenses) < 0).length,
                color: 'bg-rose-500',
              },
            ].map((tab) => {
              const isSelected = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 outline-none cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/10 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 text-theme-secondary hover:text-theme-text'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-black leading-none ${
                      isSelected
                        ? 'bg-indigo-650 text-white dark:bg-indigo-500'
                        : 'bg-zinc-100 dark:bg-zinc-850 text-theme-secondary'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search groups bar with filter slider icon */}
          <div className="flex items-center gap-2 px-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search groups..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-xs font-bold text-theme-text placeholder-zinc-400 focus:outline-none"
              />
            </div>
            <button className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-theme-secondary hover:text-theme-text cursor-pointer shrink-0">
              <Sliders className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Groups list cards section */}
          <div className="space-y-4 px-1 pb-16">
            {displayedGroups.length === 0 ? (
              <div className="p-12 rounded-3xl border border-zinc-150 dark:border-zinc-850/65 bg-white dark:bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-200/60 dark:border-zinc-850">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-theme-text">No groups found</p>
                  <p className="text-xs text-theme-secondary">
                    Adjust your filters or search keywords.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayedGroups.map((group) => (
                  <div key={group.id} onClick={() => setSelectedGroupId(group.id)}>
                    <GroupCard group={group} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAB button in bottom right */}
          <button
            onClick={() => setIsAddGroupOpen(true)}
            className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-linear-to-br from-indigo-400 via-violet-500 to-cyan-500 flex items-center justify-center text-zinc-950 shadow-[0_8px_32px_rgba(99,102,241,0.35)] active:scale-90 hover:scale-105 transition-all duration-300 border border-indigo-300/50 z-40 cursor-pointer"
            aria-label="Add Group"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* ==================== 3. MODAL DRAWER SHEETS ============= */}
      {/* ========================================================== */}

      {/* Add Group Drawer Sheet */}
      <BottomSheet
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
        title="Create Group"
      >
        <form onSubmit={handleAddGroupSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Flatmates 402"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-sm font-semibold text-theme-text placeholder-zinc-400 focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Description
            </label>
            <input
              type="text"
              placeholder="Rent, utilities, groceries splits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-sm font-semibold text-theme-text placeholder-zinc-400 focus:outline-none"
              required
            />
          </div>

          {/* Select Banner Style (gradients, NO images) */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Select Banner Style
            </label>
            <div className="flex gap-2.5 pb-1 overflow-x-auto scrollbar-none">
              {gradientCovers.map((cov, idx) => {
                const isSelected = coverIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverIndex(idx)}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cov} border transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 scale-105 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                        : 'border-transparent opacity-50'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Group Member Selection Checklist */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Add Group Members
            </label>
            {friends.length === 0 ? (
              <span className="text-xs text-zinc-550 italic">
                No friend contacts found. Add friends first!
              </span>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
                {friends.map((friend: Friend) => {
                  const isChecked = selectedMembers.includes(friend.name);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleMemberToggle(friend.name)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all shrink-0 cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/30'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800 text-zinc-550'
                      }`}
                    >
                      <span>{friend.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4.5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer border border-indigo-500/20"
          >
            Create Shared Group
          </button>
        </form>
      </BottomSheet>

      {/* Add Group Expense Drawer Sheet */}
      <BottomSheet
        isOpen={isAddGroupExpenseOpen}
        onClose={() => setIsAddGroupExpenseOpen(false)}
        title="Add Group Bill"
      >
        <form onSubmit={handleAddGroupExpenseSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-1.5 py-4 border-b border-zinc-100 dark:border-zinc-850/60">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Bill Amount
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={groupExpenseAmount}
                onChange={(e) => setGroupExpenseAmount(e.target.value)}
                className="text-4xl font-black text-theme-text bg-transparent text-center focus:outline-none w-48"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Bill Description
            </label>
            <input
              type="text"
              placeholder="Rent booking, hotel stay, team lunch..."
              value={groupExpenseTitle}
              onChange={(e) => setGroupExpenseTitle(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-sm font-semibold text-theme-text focus:outline-none placeholder-zinc-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Category
              </label>
              <select
                value={groupExpenseCategory}
                onChange={(e) => setGroupExpenseCategory(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-xs font-semibold text-theme-text focus:outline-none focus:border-indigo-500/40"
              >
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Utilities">Utilities</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Bill Date
              </label>
              <input
                type="date"
                value={groupExpenseDate}
                onChange={(e) => setGroupExpenseDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-xs font-semibold text-theme-text focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Memo Details
            </label>
            <input
              type="text"
              placeholder="e.g. Split equally among members"
              value={groupExpenseNote}
              onChange={(e) => setGroupExpenseNote(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-sm font-semibold text-theme-text focus:outline-none placeholder-zinc-400"
            />
          </div>

          {activeGroup && (
            <div className="p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between text-xs text-theme-secondary font-semibold">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-550 dark:text-indigo-400" />
                <span>Split Equally Between:</span>
              </div>
              <span className="text-theme-text">{activeGroup.members.length + 1} Members</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4.5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer border border-indigo-500/20"
          >
            Distribute Bill Splits
          </button>
        </form>
      </BottomSheet>

      {/* Direct Member Settlement Invoice Sheet */}
      <BottomSheet
        isOpen={activeSettleMemberName !== null}
        onClose={() => setActiveSettleMemberName(null)}
        title="Group Settle Balance"
      >
        {activeSettleMemberName && (
          <div className="space-y-6 relative">
            {showSuccessOverlay && (
              <div className="absolute inset-0 z-50 bg-white/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center gap-3.5 text-center animate-fade-in rounded-3xl">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base font-black text-theme-text">Settled Successfully!</h4>
                  <p className="text-xs text-theme-secondary">Group balance is now squared up.</p>
                </div>
              </div>
            )}

            <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 flex flex-col gap-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-550 dark:text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-secondary">
                    Group Settlement Invoice
                  </span>
                </div>
                <span className="text-[8px] font-black uppercase bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-850 text-theme-secondary">
                  Ready
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Settlement Sum
                </span>
                <span
                  className={`text-4xl font-extrabold tracking-tight ${settleAmount > 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}
                >
                  ₹{Math.abs(settleAmount).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-150 dark:border-zinc-850">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    Sender Payer
                  </span>
                  <span className="font-extrabold text-theme-text">
                    {settleAmount > 0 ? activeSettleMemberName : 'Me (You)'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-zinc-150 dark:border-zinc-850">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    Recipient Receiver
                  </span>
                  <span className="font-extrabold text-theme-text">
                    {settleAmount > 0 ? 'Me (You)' : activeSettleMemberName}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    Group Reference
                  </span>
                  <span className="font-extrabold text-theme-text">{activeGroup?.name}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={executeMemberSettlement}
                className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
                <span>Execute</span>
              </button>
              <button
                onClick={() => setActiveSettleMemberName(null)}
                className="py-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-theme-text font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
