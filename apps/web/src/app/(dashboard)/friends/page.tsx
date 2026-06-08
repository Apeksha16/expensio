'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../../store/finance-store';
import {
  useFriends,
  useCreateFriend,
  usePendingRequests,
  useRespondRequest,
  useSettleWithFriend,
  useFriendHistory,
  Friend,
} from '../../../hooks/useFriends';
import { useSearchUser } from '../../../hooks/useUser';
import { useAuthStore } from '../../../store/auth-store';
import FriendCard from '../../../components/shared/FriendCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import {
  UserPlus,
  Search,
  Check,
  Sparkles,
  Receipt,
  Clock,
  UserCheck,
  Users,
  QrCode,
  Scan,
  Loader2,
  Handshake,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';

const presetSearchUsers = [
  { name: 'Rahul Sharma', username: 'rahuls', avatar: 'RS' },
  { name: 'Amit Verma', username: 'amitv', avatar: 'AV' },
  { name: 'Pranav Singh', username: 'pranavs', avatar: 'PS' },
  { name: 'Neha Kapoor', username: 'nehak', avatar: 'NK' },
  { name: 'Sarthak Jain', username: 'sarthakj', avatar: 'SJ' },
];

function FriendHistoryContent({ friend, onSettleUp }: { friend: Friend; onSettleUp: () => void }) {
  const { data: history, isLoading } = useFriendHistory(friend.id);

  return (
    <div className="space-y-6 pb-6 select-none">
      {/* Profile Header */}
      <div className="flex items-center gap-4 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 font-black text-sm flex items-center justify-center shrink-0">
          {friend.avatarUrl ? (
            <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            friend.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="text-sm font-black text-theme-text leading-tight truncate">
            {friend.name}
          </h4>
          <span className="text-xs font-bold text-theme-secondary">@{friend.username}</span>
        </div>
      </div>

      {/* Balance & Settle Call to Action */}
      <div className="p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 flex items-center justify-between shadow-xs">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-theme-secondary tracking-widest">
            {friend.balance > 0 ? 'Owes You' : friend.balance < 0 ? 'You Owe' : 'Status'}
          </span>
          <span
            className={`text-2xl font-black ${friend.balance > 0 ? 'text-emerald-600 dark:text-emerald-455' : friend.balance < 0 ? 'text-rose-600 dark:text-rose-455' : 'text-zinc-550'}`}
          >
            ₹{Math.abs(friend.balance).toFixed(2)}
          </span>
        </div>
        {friend.balance !== 0 && (
          <button
            onClick={onSettleUp}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/10 border-0"
          >
            Settle Balance
          </button>
        )}
      </div>

      {/* Activity History Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-theme-secondary px-1">
          Activity History
        </h4>
        <div className="max-h-[40vh] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Loading history...
              </span>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-555 font-bold bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-[24px]">
              No shared transactions yet.
            </div>
          ) : (
            history.map((item) => {
              const isSplit = item.type === 'split';
              const dateStr = new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-100/50 dark:border-zinc-850/50 bg-white dark:bg-zinc-950/20 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        isSplit
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-650 dark:text-indigo-405'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                      } shrink-0`}
                    >
                      {isSplit ? (
                        <Receipt className="w-4.5 h-4.5" />
                      ) : (
                        <Handshake className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-extrabold text-theme-text truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-bold text-theme-secondary">{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-xs font-black tracking-tight ${
                        isSplit
                          ? item.whoPaid === 'you'
                            ? 'text-emerald-600 dark:text-emerald-455'
                            : 'text-rose-600 dark:text-rose-455'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {isSplit ? (item.whoPaid === 'you' ? '+' : '-') : ''}₹
                      {isSplit ? item.splitAmount?.toFixed(2) : item.amount.toFixed(2)}
                    </span>
                    <span
                      className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none border ${
                        item.status === 'settled'
                          ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-450'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-450'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const { data: friendsData } = useFriends();
  const friends = friendsData || [];
  const createFriendMutation = useCreateFriend();
  const settleMutation = useSettleWithFriend();
  const { data: pendingRequestsData } = usePendingRequests();
  const inboundRequests = pendingRequestsData?.inbound || [];
  const outboundRequests = pendingRequestsData?.outbound || [];
  const respondRequestMutation = useRespondRequest();
  const user = useAuthStore((state) => state.user);

  // Greeting based on time of day
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 12 && hours < 17) {
      setGreeting('Good afternoon');
    } else if (hours >= 17 || hours < 5) {
      setGreeting('Good evening');
    } else {
      setGreeting('Good morning');
    }
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Apeksha';

  // Search query & modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [debouncedModalSearchQuery, setDebouncedModalSearchQuery] = useState('');

  // Debounce search query inside modal
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedModalSearchQuery(modalSearchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [modalSearchQuery]);

  // Search hook calling backend
  const {
    data: searchResult,
    isLoading: isSearching,
    error: searchError,
  } = useSearchUser(debouncedModalSearchQuery);

  // Success state for friend request sent
  const [requestSentUsername, setRequestSentUsername] = useState<string | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'owed' | 'owe'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Active filter tab: 'all' | 'online' | 'requests'
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'requests'>('all');

  // Settlement dialog states
  const [activeSettleFriend, setActiveSettleFriend] = useState<Friend | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [activeHistoryFriend, setActiveHistoryFriend] = useState<Friend | null>(null);

  const handleAcceptRequest = (requestId: string) => {
    respondRequestMutation.mutate({ id: requestId, status: 'accepted' });
  };

  const handleDeclineRequest = (requestId: string) => {
    respondRequestMutation.mutate({ id: requestId, status: 'rejected' });
  };

  const handleTriggerSettle = (friend: Friend) => {
    setActiveSettleFriend(friend);
  };

  const handleConfirmSettle = () => {
    if (!activeSettleFriend) return;

    settleMutation.mutate(
      {
        receiverId: activeSettleFriend.id,
        amount: Math.abs(activeSettleFriend.balance),
      },
      {
        onSuccess: () => {
          setShowSuccessOverlay(true);
          setTimeout(() => {
            setShowSuccessOverlay(false);
            setActiveSettleFriend(null);
          }, 3000);
        },
      }
    );
    setShowSuccessOverlay(true);

    setTimeout(() => {
      setShowSuccessOverlay(false);
      setActiveSettleFriend(null);
    }, 1250);
  };

  // Filter friends list based on active tab AND search queries
  const displayedFriends = friends.filter((friend) => {
    if (activeTab === 'online' && !friend.online) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().replace('@', '');
      return friend.name.toLowerCase().includes(q) || friend.username.toLowerCase().includes(q);
    }

    return true;
  });

  // Sort friends list based on sortBy state
  const sortedFriends = [...displayedFriends].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'owed') {
      // Show highest positive balance first (they owe me)
      return b.balance - a.balance;
    }
    if (sortBy === 'owe') {
      // Show highest negative balance first (I owe them)
      return a.balance - b.balance;
    }
    // 'recent' uses the default order from store
    return 0;
  });

  const totalYouAreOwed = friends
    .filter((f: Friend) => f.balance > 0)
    .reduce((sum: number, f: Friend) => sum + f.balance, 0);

  const totalYouOwe = friends
    .filter((f: Friend) => f.balance < 0)
    .reduce((sum: number, f: Friend) => sum + Math.abs(f.balance), 0);

  return (
    <div className="space-y-6 pb-6 select-none relative">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-extrabold tracking-tight text-theme-text">Friends</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Track and settle split balances
          </p>
        </div>
        <button
          onClick={() => {
            setSearchQuery('');
            setIsAddFriendOpen(true);
          }}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold active:scale-95 hover:scale-105 transition-all shadow-md shadow-indigo-600/15 cursor-pointer border border-indigo-500/20"
          aria-label="Add Friend"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Aggregate Debt balances & High Five Illustration Card */}
      <div className="grid grid-cols-3 gap-3 px-1">
        {/* Card 1: You are owed */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 shadow-xs flex flex-col gap-1 min-w-0">
          <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest leading-none">
            You are owed
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-450 mt-1 tracking-tight leading-none">
            ₹
            {totalYouAreOwed.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[7.5px] font-bold text-zinc-550 dark:text-zinc-500 mt-1.5 leading-none">
            Across {friends.filter((f) => f.balance > 0).length} friends
          </span>
        </div>

        {/* Card 2: You owe */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 shadow-xs flex flex-col gap-1 min-w-0">
          <span className="text-[8.5px] font-black text-zinc-550 uppercase tracking-widest leading-none">
            You owe
          </span>
          <span className="text-sm font-black text-rose-600 dark:text-rose-455 mt-1 tracking-tight leading-none">
            ₹
            {totalYouOwe.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[7.5px] font-bold text-zinc-550 dark:text-zinc-500 mt-1.5 leading-none">
            To {friends.filter((f) => f.balance < 0).length}{' '}
            {friends.filter((f) => f.balance < 0).length === 1 ? 'friend' : 'friends'}
          </span>
        </div>

        {/* Card 3: Net Balance Summary Card */}
        {(() => {
          const netBalance = totalYouAreOwed - totalYouOwe;
          const isOwedNet = netBalance > 0;
          const isOweNet = netBalance < 0;
          const isBalanced = netBalance === 0;

          return (
            <div
              className={`p-3.5 rounded-2xl border shadow-xs flex flex-col gap-1 min-w-0 justify-between transition-all duration-350 ${
                isOwedNet
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 dark:border-emerald-500/10'
                  : isOweNet
                    ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/15 dark:border-rose-500/10'
                    : 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/15 dark:border-indigo-500/10'
              }`}
            >
              <span
                className={`text-[8.5px] font-black uppercase tracking-widest leading-none ${
                  isOwedNet
                    ? 'text-emerald-600 dark:text-emerald-450'
                    : isOweNet
                      ? 'text-rose-600 dark:text-rose-455'
                      : 'text-indigo-650 dark:text-indigo-400'
                }`}
              >
                Net Balance
              </span>
              <span
                className={`text-sm font-black mt-1 tracking-tight leading-none truncate ${
                  isOwedNet
                    ? 'text-emerald-600 dark:text-emerald-455'
                    : isOweNet
                      ? 'text-rose-600 dark:text-rose-455'
                      : 'text-indigo-650 dark:text-indigo-400'
                }`}
              >
                {isBalanced
                  ? 'Balanced'
                  : `₹${Math.abs(netBalance).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </span>
              <span className="text-[7.5px] font-bold text-zinc-550 dark:text-zinc-500 mt-1.5 leading-none flex items-center gap-1">
                {isOwedNet ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Net Receivable</span>
                  </>
                ) : isOweNet ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Net Payable</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                    <span>All Squared Up!</span>
                  </>
                )}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Filter Navigation Tab Pills */}
      <div className="flex gap-2 px-1">
        {/* Tab 1: All */}
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 outline-none cursor-pointer ${
            activeTab === 'all'
              ? 'border-indigo-600 bg-indigo-50/10 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 shadow-[0_2px_8px_rgba(99,102,241,0.06)]'
              : 'border-zinc-200 dark:border-zinc-800 text-theme-secondary hover:text-theme-text'
          }`}
        >
          <span>All</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-black leading-none ${
              activeTab === 'all'
                ? 'bg-indigo-650 text-white dark:bg-indigo-500'
                : 'bg-zinc-100 dark:bg-zinc-850 text-theme-secondary border border-zinc-200/40 dark:border-zinc-800/40'
            }`}
          >
            {friends.length}
          </span>
        </button>

        {/* Tab 2: Online */}
        <button
          onClick={() => setActiveTab('online')}
          className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 outline-none cursor-pointer ${
            activeTab === 'online'
              ? 'border-indigo-600 bg-indigo-50/10 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 shadow-[0_2px_8px_rgba(99,102,241,0.06)]'
              : 'border-zinc-200 dark:border-zinc-800 text-theme-secondary hover:text-theme-text'
          }`}
        >
          <span>Online</span>
          <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black leading-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450">
            {friends.filter((f) => f.online).length}
          </span>
        </button>

        {/* Tab 3: Requests */}
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 outline-none cursor-pointer ${
            activeTab === 'requests'
              ? 'border-indigo-600 bg-indigo-50/10 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 shadow-[0_2px_8px_rgba(99,102,241,0.06)]'
              : 'border-zinc-200 dark:border-zinc-800 text-theme-secondary hover:text-theme-text'
          }`}
        >
          <span>Requests</span>
          <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black leading-none bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455">
            {inboundRequests.length}
          </span>
        </button>
      </div>

      {/* Search Input and Filter Slider */}
      <div className="flex items-center gap-2 px-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search friends, @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-xs font-bold text-theme-text placeholder-zinc-400 focus:outline-none focus:border-indigo-500/40 transition-colors"
          />
        </div>
        <button
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 text-theme-secondary hover:text-theme-text active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
          aria-label="Filter options"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4.5 h-4.5"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between px-1 relative">
        <h3 className="text-xs font-black uppercase tracking-widest text-theme-secondary">
          People you've settled with
        </h3>
        <div className="relative">
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="text-[10px] font-extrabold text-theme-secondary hover:text-theme-text flex items-center gap-0.5 bg-transparent border-0 cursor-pointer outline-none capitalize"
          >
            <span>{sortBy}</span>
            <span className="text-[8px] leading-none">▼</span>
          </button>

          <AnimatePresence>
            {isSortDropdownOpen && (
              <>
                {/* Backdrop overlay for closing */}
                <div className="fixed inset-0 z-30" onClick={() => setIsSortDropdownOpen(false)} />

                {/* Dropdown container */}
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-32 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 shadow-lg py-1.5 z-40 flex flex-col gap-0.5"
                >
                  {[
                    { value: 'recent', label: 'Recent' },
                    { value: 'name', label: 'Name' },
                    { value: 'owed', label: 'Owed' },
                    { value: 'owe', label: 'Owe' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value as any);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer w-full flex items-center justify-between border-none outline-none bg-transparent ${
                        sortBy === option.value
                          ? 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/20'
                          : 'text-theme-secondary hover:text-theme-text hover:bg-zinc-50 dark:hover:bg-zinc-850/40'
                      }`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Friends list feeds based on active tabs */}
      <div className="space-y-3.5 px-1">
        <AnimatePresence mode="popLayout">
          {activeTab === 'requests' ? (
            inboundRequests.length === 0 && outboundRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-12 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-550 border border-zinc-200/60 dark:border-zinc-800/60">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-theme-text">No Pending Requests</span>
                  <p className="text-[10px] text-theme-secondary leading-relaxed">
                    Incoming and outgoing friend split requests will appear here.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Received Requests */}
                {inboundRequests.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 pl-1">
                      Received Requests ({inboundRequests.length})
                    </span>
                    {inboundRequests.map((req: any) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-3xl border border-zinc-150 dark:border-zinc-850/80 bg-white dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                            {req.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={req.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : req.name ? (
                              req.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()
                            ) : (
                              '@'
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <h4 className="text-xs font-black text-theme-text leading-tight truncate">
                              {req.name || 'Expensio User'}
                            </h4>
                            <span className="text-[10px] font-bold text-theme-secondary">
                              @{req.username}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            disabled={respondRequestMutation.isPending}
                            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase hover:scale-102 active:scale-95 transition-all cursor-pointer border border-indigo-500/20 shadow-sm disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            disabled={respondRequestMutation.isPending}
                            className="px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 text-theme-text text-[9px] font-black uppercase active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            Ignore
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Sent Requests */}
                {outboundRequests.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 pl-1">
                      Sent Requests ({outboundRequests.length})
                    </span>
                    {outboundRequests.map((req: any) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-3xl border border-zinc-150 dark:border-zinc-850/80 bg-white dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between group opacity-85"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 font-black text-xs flex items-center justify-center shrink-0">
                            {req.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={req.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : req.name ? (
                              req.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()
                            ) : (
                              '@'
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <h4 className="text-xs font-black text-theme-text leading-tight truncate">
                              {req.name || 'Expensio User'}
                            </h4>
                            <span className="text-[10px] font-bold text-theme-secondary">
                              @{req.username}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1.5 rounded-lg bg-zinc-150 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850/50 text-[8.5px] font-extrabold uppercase text-theme-secondary tracking-wider">
                          Pending Response
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : sortedFriends.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-12 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-550 border border-zinc-200/60 dark:border-zinc-800/60">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-theme-text">No friends matches</p>
                <p className="text-xs text-theme-secondary leading-relaxed">
                  Try adjusting your filters or search keywords.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {sortedFriends.map((friend: Friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onClick={(f) => setActiveHistoryFriend(f)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      {/* Add Friend Sheet */}
      <BottomSheet
        isOpen={isAddFriendOpen}
        onClose={() => {
          setIsAddFriendOpen(false);
          setModalSearchQuery('');
          setDebouncedModalSearchQuery('');
          setRequestSentUsername(null);
        }}
        title="Add Friend"
      >
        <div className="space-y-6 pb-6 select-none">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-550">
              Friend's Username
            </label>
            <div className="relative">
              <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 font-mono">
                @
              </span>
              <input
                type="text"
                placeholder="Type username (e.g. rahuls)"
                value={modalSearchQuery}
                onChange={(e) => {
                  setModalSearchQuery(e.target.value);
                  setRequestSentUsername(null);
                  createFriendMutation.reset();
                }}
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 focus:border-indigo-500/40 text-xs font-bold text-theme-text placeholder-zinc-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status Display Area */}
          <div className="space-y-4">
            {/* 1. Searching Loader */}
            {isSearching && (
              <div className="flex items-center gap-2.5 text-zinc-550 dark:text-zinc-500 py-2">
                <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold">Searching user database...</span>
              </div>
            )}

            {/* 2. Success message */}
            {requestSentUsername && (
              <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex flex-col gap-1 items-center text-center animate-fade-in">
                <span className="text-[11px]">
                  Friend request sent successfully to @{requestSentUsername}!
                </span>
              </div>
            )}

            {/* Mutation Error */}
            {createFriendMutation.error && (
              <div className="text-red-500 dark:text-red-450 text-[10.5px] font-bold flex items-center gap-1.5 py-1 px-1">
                <span>{(createFriendMutation.error as Error).message}</span>
              </div>
            )}

            {/* 3. Validation and Search Errors */}
            {!isSearching && debouncedModalSearchQuery.trim().length >= 3 && (
              <>
                {/* A. Search error (Not Found) */}
                {searchError && !requestSentUsername && (
                  <div className="text-red-500 dark:text-red-450 text-[10.5px] font-bold flex items-center gap-1.5 py-1 px-1">
                    <span>friend not found/ or username doesnt exist</span>
                  </div>
                )}

                {/* B. Self-search error */}
                {user?.username &&
                  debouncedModalSearchQuery.trim().toLowerCase() ===
                    user.username.toLowerCase() && (
                    <div className="text-red-500 dark:text-red-450 text-[10.5px] font-bold flex items-center gap-1.5 py-1 px-1">
                      <span>Cannot send request to yourself</span>
                    </div>
                  )}

                {/* C. Already friends */}
                {friends.some(
                  (f) =>
                    f.username?.toLowerCase() === debouncedModalSearchQuery.trim().toLowerCase()
                ) && (
                  <div className="text-amber-500 dark:text-amber-450 text-[10.5px] font-bold flex items-center gap-1.5 py-1 px-1">
                    <span>
                      You are already friends with @{debouncedModalSearchQuery.trim().toLowerCase()}
                    </span>
                  </div>
                )}

                {/* D. Found user result card */}
                {searchResult &&
                  !(
                    user?.username &&
                    debouncedModalSearchQuery.trim().toLowerCase() === user.username.toLowerCase()
                  ) &&
                  !friends.some(
                    (f) =>
                      f.username?.toLowerCase() === debouncedModalSearchQuery.trim().toLowerCase()
                  ) &&
                  !requestSentUsername && (
                    <div className="p-4.5 rounded-3xl border border-indigo-500/10 bg-indigo-500/[0.02] dark:bg-indigo-950/5 flex items-center justify-between group animate-fade-in">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                          {searchResult.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={searchResult.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : searchResult.name ? (
                            searchResult.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          ) : (
                            '@'
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-black text-theme-text leading-tight truncate">
                            {searchResult.name || 'Expensio User'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-theme-secondary">
                            @{searchResult.username}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          createFriendMutation.mutate(searchResult.username, {
                            onSuccess: () => {
                              setRequestSentUsername(searchResult.username);
                              setModalSearchQuery('');
                              setDebouncedModalSearchQuery('');
                            },
                          });
                        }}
                        disabled={createFriendMutation.isPending}
                        className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 border-0"
                      >
                        {createFriendMutation.isPending ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Settle Up Receipt Invoice Dialog Modal */}
      <BottomSheet
        isOpen={activeSettleFriend !== null}
        onClose={() => setActiveSettleFriend(null)}
        title="Settle Outstanding"
      >
        {activeSettleFriend && (
          <div className="space-y-6 relative">
            {showSuccessOverlay && (
              <div className="absolute inset-0 z-50 bg-white/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center gap-3.5 text-center animate-fade-in rounded-3xl">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base font-black text-theme-text">Settled Successfully!</h4>
                  <p className="text-xs text-theme-secondary">Balance is now fully squared up.</p>
                </div>
              </div>
            )}

            <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 backdrop-blur-md relative overflow-hidden flex flex-col gap-5 shadow-xs">
              <div className="absolute top-[-30%] right-[-20%] w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-550 dark:text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-secondary">
                    Payment Invoice
                  </span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-850 text-theme-secondary">
                  Confirmed
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Settlement Sum
                </span>
                <span
                  className={`text-4xl font-extrabold tracking-tight ${activeSettleFriend.balance > 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}
                >
                  ₹{Math.abs(activeSettleFriend.balance).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-150 dark:border-zinc-850">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    Sender Payer
                  </span>
                  <span className="font-extrabold text-theme-text">
                    {activeSettleFriend.balance > 0 ? activeSettleFriend.name : 'Me (You)'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-zinc-150 dark:border-zinc-850">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    Recipient Receiver
                  </span>
                  <span className="font-extrabold text-theme-text">
                    {activeSettleFriend.balance > 0 ? 'Me (You)' : activeSettleFriend.name}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    Settle Date
                  </span>
                  <span className="font-extrabold text-theme-text">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleConfirmSettle}
                className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
                <span>Execute</span>
              </button>
              <button
                onClick={() => setActiveSettleFriend(null)}
                className="py-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-theme-text font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 4. Friend Details & History bottom sheet */}
      <BottomSheet
        isOpen={activeHistoryFriend !== null}
        onClose={() => setActiveHistoryFriend(null)}
        title="Friend Details"
      >
        {activeHistoryFriend && (
          <FriendHistoryContent
            friend={activeHistoryFriend}
            onSettleUp={() => {
              const f = activeHistoryFriend;
              setActiveHistoryFriend(null);
              // Wait slightly for the previous modal animation to clear
              setTimeout(() => {
                handleTriggerSettle(f);
              }, 300);
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}
