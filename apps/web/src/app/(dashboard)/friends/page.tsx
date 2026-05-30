'use client';

import React, { useState } from 'react';
import { Friend, useFinanceStore } from '../../../store/finance-store';
import FriendCard from '../../../components/shared/FriendCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import { UserPlus, Users, Search, Check, Sparkles, Receipt, Clock, UserCheck } from 'lucide-react';

const presetSearchUsers = [
  { name: 'Divya Sharma', username: 'divyas', avatar: 'DS' },
  { name: 'Aditya Goel', username: 'adityag', avatar: 'AG' },
  { name: 'Meera Nair', username: 'meeran', avatar: 'MN' },
  { name: 'Ishan Malhotra', username: 'ishanm', avatar: 'IM' }
];

export default function FriendsPage() {
  const { friends, addFriend, settleWithFriend } = useFinanceStore();
  
  // Search query & modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUsername, setCustomUsername] = useState('');

  // Active filter tab: 'all' | 'online' | 'requests'
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'requests'>('all');

  // Settlement dialog states
  const [activeSettleFriend, setActiveSettleFriend] = useState<Friend | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Simulated requests list
  const [requests, setRequests] = useState([
    { id: 'req_1', name: 'Divya Sharma', username: 'divyas', avatar: 'DS', time: '1h ago' },
    { id: 'req_2', name: 'Aditya Goel', username: 'adityag', avatar: 'AG', time: '3h ago' }
  ]);

  const handleAddPresetFriend = (user: typeof presetSearchUsers[0]) => {
    addFriend({
      name: user.name,
      username: user.username,
      avatar: user.avatar
    });
    setIsAddFriendOpen(false);
  };

  const handleAddCustomFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customUsername) return;

    const initials = customName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    addFriend({
      name: customName,
      username: customUsername.toLowerCase().replace('@', ''),
      avatar: initials
    });

    setCustomName('');
    setCustomUsername('');
    setIsAddFriendOpen(false);
  };

  const handleAcceptRequest = (req: typeof requests[0]) => {
    // Add to friends store
    addFriend({
      name: req.name,
      username: req.username,
      avatar: req.avatar
    });
    // Remove from requests list
    setRequests(requests.filter(r => r.id !== req.id));
  };

  const handleDeclineRequest = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const searchedPresetUsers = presetSearchUsers.filter(user => {
    const isAlreadyFriend = friends.some(f => f.username === user.username);
    if (isAlreadyFriend) return false;
    
    return searchQuery.length > 0 && (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleTriggerSettle = (friend: Friend) => {
    setActiveSettleFriend(friend);
  };

  const handleConfirmSettle = () => {
    if (!activeSettleFriend) return;
    
    settleWithFriend(activeSettleFriend.id);
    setShowSuccessOverlay(true);
    
    setTimeout(() => {
      setShowSuccessOverlay(false);
      setActiveSettleFriend(null);
    }, 1850);
  };

  // Filter friends list based on selected tab
  const displayedFriends = friends.filter(friend => {
    if (activeTab === 'online') return friend.online;
    return true; // 'all'
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
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Friends balances</h2>
          <p className="text-xs text-zinc-400">Track and settle individual balances.</p>
        </div>
        <button
          onClick={() => {
            setSearchQuery('');
            setIsAddFriendOpen(true);
          }}
          className="p-2.5 rounded-xl bg-indigo-600 text-zinc-950 font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
          aria-label="Add Friend"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Aggregate Debt balances */}
      <div className="grid grid-cols-2 gap-4 px-1">
        <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-xl flex flex-col gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">You are owed</span>
          <span className="text-xl font-black text-cyan-400 tracking-tight">₹{totalYouAreOwed.toFixed(2)}</span>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-xl flex flex-col gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">You owe</span>
          <span className="text-xl font-black text-rose-400 tracking-tight">₹{totalYouOwe.toFixed(2)}</span>
        </div>
      </div>

      {/* Mockup-Exact Filter Navigation Tabs */}
      <div className="px-1">
        <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-2xl justify-between items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2.5 px-1.5 flex items-center justify-center gap-1.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer outline-none ${
              activeTab === 'all'
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] scale-[1.02]'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <span>All</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal transition-colors ${
              activeTab === 'all'
                ? 'bg-zinc-850 text-zinc-300 border border-zinc-800'
                : 'bg-zinc-900/60 text-zinc-500 border border-zinc-850/40'
            }`}>
              {friends.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2.5 px-1.5 flex items-center justify-center gap-1.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer outline-none ${
              activeTab === 'online'
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] scale-[1.02]'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <span>Online</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal transition-colors ${
              activeTab === 'online'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/25'
                : 'bg-cyan-500/5 text-cyan-500/60 border border-cyan-500/10'
            }`}>
              {friends.filter(f => f.online).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 px-1.5 flex items-center justify-center gap-1.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer outline-none ${
              activeTab === 'requests'
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] scale-[1.02]'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <span>Requests</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-normal transition-colors ${
              activeTab === 'requests'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/25'
                : 'bg-rose-500/10 text-rose-400/80 border border-rose-500/15'
            }`}>
              {requests.length}
            </span>
          </button>
        </div>
      </div>

      {/* Friends list feeds based on active tabs */}
      <div className="space-y-3.5 px-1">
        {activeTab === 'requests' ? (
          /* ==================== REQUESTS TAB VIEW ==================== */
          requests.length === 0 ? (
            <div className="p-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-300">No Pending Requests</span>
                <p className="text-[10px] text-zinc-500">Incoming friend split invites will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                      {req.avatar}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold text-zinc-100">{req.name}</h4>
                      <span className="text-[10px] text-zinc-500">@{req.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-zinc-950 text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase active:scale-95 transition-all cursor-pointer"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ==================== ALL / ONLINE TAB VIEW ==================== */
          displayedFriends.length === 0 ? (
            <div className="p-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-300">No friends matches</p>
                <p className="text-xs text-zinc-500">Try adjusting your filters or search keywords.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedFriends.map((friend: Friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onSettle={() => handleTriggerSettle(friend)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Add Friend Sheet */}
      <BottomSheet
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        title="Add Friend"
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Search User Database</label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4.5 top-3.5" />
              <input
                type="text"
                placeholder="Search @username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {searchedPresetUsers.length > 0 && (
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Query Matches</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchedPresetUsers.map((user) => (
                  <div
                    key={user.username}
                    onClick={() => handleAddPresetFriend(user)}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 cursor-pointer flex items-center justify-between group active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold text-xs text-zinc-400">
                        {user.avatar}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-200">{user.name}</span>
                        <span className="text-[9px] text-zinc-500">@{user.username}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-zinc-950 text-[10px] font-black uppercase group-hover:scale-105 active:scale-95 transition-all">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-900 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Manual Add Contact</span>
            
            <form onSubmit={handleAddCustomFriendSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-zinc-400">Friend's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Divya Sharma"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500/40 text-xs font-semibold text-zinc-100 placeholder-zinc-650 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-zinc-400">Username</label>
                <input
                  type="text"
                  placeholder="divyas"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500/40 text-xs font-semibold text-zinc-100 placeholder-zinc-650 focus:outline-none transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-zinc-950 font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs"
              >
                Add Friend Contact
              </button>
            </form>
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
              <div className="absolute inset-0 z-50 bg-[#09090b]/95 flex flex-col items-center justify-center gap-3.5 text-center animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base font-black text-zinc-100">Settled Successfully!</h4>
                  <p className="text-xs text-zinc-500">Balance is now fully squared up.</p>
                </div>
              </div>
            )}

            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden flex flex-col gap-5">
              <div className="absolute top-[-30%] right-[-20%] w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Payment Invoice</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                  Confirmed
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Settlement Sum</span>
                <span className={`text-4xl font-extrabold tracking-tight ₹{activeSettleFriend.balance > 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                  ₹{Math.abs(activeSettleFriend.balance).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Sender Payer</span>
                  <span className="font-bold text-zinc-200">
                    {activeSettleFriend.balance > 0 ? activeSettleFriend.name : 'Me (You)'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Recipient Receiver</span>
                  <span className="font-bold text-zinc-200">
                    {activeSettleFriend.balance > 0 ? 'Me (You)' : activeSettleFriend.name}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Settle Date</span>
                  <span className="font-bold text-zinc-200">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleConfirmSettle}
                className="py-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-zinc-950 font-bold hover:shadow-lg active:scale-98 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
                <span>Execute Settlement</span>
              </button>
              <button
                onClick={() => setActiveSettleFriend(null)}
                className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Dismiss View
              </button>
            </div>

          </div>
        )}
      </BottomSheet>

    </div>
  );
}
