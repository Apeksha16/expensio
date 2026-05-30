'use client';

import React, { useState } from 'react';
import MobileHeader from '../../components/layout/MobileHeader';
import BottomNavigation from '../../components/layout/BottomNavigation';
import BottomSheet from '../../components/shared/BottomSheet';
import { useFinanceStore } from '../../store/finance-store';
import { supabase } from '../../lib/supabase';
import { Coffee, Car, Tv, ShoppingBag, Zap, HelpCircle, Calendar, Heart, GraduationCap, CreditCard, Share2, User, Mail, Shield, LogOut, Settings, Check, AlertTriangle, Smartphone, Sparkles, Plus } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { 
    friends, 
    addExpense, 
    isAddExpenseOpen, 
    setIsAddExpenseOpen, 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    isProfileOpen, 
    setIsProfileOpen 
  } = useFinanceStore();

  // Form State
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [splitWith, setSplitWith] = useState<string[]>([]);

  // Notifications interactive state
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Owe Split Request 💸', desc: 'Rahul Sharma owes you ₹37.50 for Goa trip splits.', time: '1h ago', category: 'split', dismissed: false },
    { id: 'n2', title: 'Budget Limit Warning ⚠️', desc: 'You used 34% of your Transport monthly allocation.', time: '4h ago', category: 'alert', dismissed: false },
    { id: 'n3', title: 'Transaction Confirmed ✅', desc: 'Verified direct salary deposit credit of +₹2,800.00.', time: '1d ago', category: 'income', dismissed: false },
    { id: 'n4', title: 'Active Goa Group splits 🏖️', desc: 'Rahul Sharma added Hotel Booking (₹600.00) in Goa group.', time: '2d ago', category: 'group', dismissed: false }
  ]);

  // Profile preferences
  const [biometricsActive, setBiometricsActive] = useState(true);
  const [highContrastActive, setHighContrastActive] = useState(false);
  const [offlineCacheActive, setOfflineCacheActive] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Splits Configuration states
  const [splitType, setSplitType] = useState<'equal' | 'percentage'>('equal');
  const [splitPercentages, setSplitPercentages] = useState<Record<string, number>>({ me: 100 });

  const redistributeEqually = (currentSplitWith: string[]) => {
    const totalPeople = currentSplitWith.length + 1; // friends + me
    const equalShare = Math.floor(100 / totalPeople);
    const remainder = 100 - (equalShare * totalPeople);

    const newPercentages: Record<string, number> = {};
    newPercentages['me'] = equalShare + remainder; // Give remainder to 'me'
    currentSplitWith.forEach(name => {
      newPercentages[name] = equalShare;
    });

    setSplitPercentages(newPercentages);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, dismissed: true } : n));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !title) return;

    const isSplit = splitWith.length > 0;
    const finalSplitType = isSplit ? splitType : undefined;
    const finalSplitPercentages = (isSplit && splitType === 'percentage') ? splitPercentages : undefined;

    // Validate percentage split sum equals 100%
    if (isSplit && splitType === 'percentage') {
      const totalSum = Object.values(splitPercentages).reduce((acc, curr) => acc + curr, 0);
      if (totalSum !== 100) {
        alert(`Split percentage sum must be exactly 100% (currently ₹{totalSum}%). Please balance the split!`);
        return;
      }
    }

    addExpense({
      title,
      amount: Number(amount),
      category,
      date,
      note,
      paidBy: 'me',
      splitWith: isSplit ? splitWith : undefined,
      splitType: finalSplitType,
      splitPercentages: finalSplitPercentages,
      paymentMethod
    });

    // Reset Form
    setAmount('');
    setTitle('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setPaymentMethod('Credit Card');
    setSplitWith([]);
    setSplitType('equal');
    setSplitPercentages({ me: 100 });
    setIsAddExpenseOpen(false);
  };

  const handleFriendToggle = (friendName: string) => {
    let newSplitWith = [];
    if (splitWith.includes(friendName)) {
      newSplitWith = splitWith.filter(name => name !== friendName);
    } else {
      newSplitWith = [...splitWith, friendName];
    }
    setSplitWith(newSplitWith);
    redistributeEqually(newSplitWith);
  };

  // 3x3/4x2 Squircle selector categories matching mockup screen exactly!
  const categories = [
    { name: 'Food', icon: Coffee, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Shopping', icon: ShoppingBag, bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { name: 'Transport', icon: Car, bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { name: 'Entertainment', icon: Tv, bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { name: 'Bills', icon: CreditCard, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { name: 'Health', icon: Heart, bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    { name: 'Education', icon: GraduationCap, bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { name: 'Other', icon: HelpCircle, bg: 'bg-zinc-800/40 text-zinc-400 border-zinc-800/40' }
  ];

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 flex justify-center overflow-x-hidden relative">
      
      {/* ambient glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Responsive Canvas PWA Frame Shell */}
      <div className="w-full max-w-md h-screen h-[100dvh] flex flex-col bg-[#09090b] border-x border-zinc-900 shadow-2xl relative pb-20 overflow-hidden">
        
        {/* Mobile Header */}
        <MobileHeader />

        {/* Child Screen */}
        <main className="flex-1 px-6 py-6 overflow-y-auto">
          {children}
        </main>

        {/* Floating Action Button (FAB) in Bottom Right (Fixed Viewport Docked) */}
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="fixed bottom-20 right-5 sm:right-auto sm:left-[calc(50%+156px)] w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 via-emerald-400 to-emerald-500 flex items-center justify-center text-zinc-950 shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_32px_rgba(20,184,166,0.55)] active:scale-90 hover:scale-110 active:shadow-[0_4px_16px_rgba(16,185,129,0.6)] transition-all duration-300 border border-teal-300/50 z-40 cursor-pointer group"
          aria-label="Add Expense"
        >
          {/* Internal neon ambient glow aura */}
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-100 border border-white/30 -z-10 group-hover:scale-105 transition-transform duration-300" />
          
          {/* Gorgeous spinning plus icon */}
          <Plus className="w-7 h-7 text-zinc-950 stroke-[3.5] transition-transform duration-500 ease-out group-hover:rotate-180" />
        </button>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* Upgraded Add Expense Bottom Sheet Modal with Squircle Grid */}
      <BottomSheet 
        isOpen={isAddExpenseOpen} 
        onClose={() => setIsAddExpenseOpen(false)}
        title="Add Expense"
      >
        <form onSubmit={handleAddExpenseSubmit} className="space-y-6">
          
          {/* Big Amount font */}
          <div className="flex flex-col items-center gap-1.5 py-4 border-b border-zinc-900">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bill Value</span>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-extrabold text-emerald-400">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-5xl font-black text-zinc-100 bg-transparent text-center focus:outline-none placeholder-zinc-800 w-64 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Squircle 4x2 Category Grid exactly from the mockup screenshot! */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Category</label>
            <div className="grid grid-cols-4 gap-3">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer gap-1.5 ₹{
                      isSelected
                        ? cat.bg + ' ring-1 ring-emerald-500/30 scale-105 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/40 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Merchant / Description</label>
            <input
              type="text"
              placeholder="e.g. McDonald's 🍔"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Split checks */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Split Expense (Equally)</label>
            {friends.length === 0 ? (
              <span className="text-xs text-zinc-600 italic">No friend contacts found. Add friends first!</span>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {friends.map((friend) => {
                  const isChecked = splitWith.includes(friend.name);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleFriendToggle(friend.name)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-semibold text-xs transition-all shrink-0 cursor-pointer ₹{
                        isChecked
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 ring-1 ring-indigo-500/30'
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md bg-zinc-950 flex items-center justify-center text-[9px] font-black">
                        {friend.avatar}
                      </div>
                      <span>{friend.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date, payment method, note grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Date & Time</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-xs font-semibold text-zinc-100 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Add Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Lunch with friends 🤤"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-650 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 text-zinc-950 font-bold hover:shadow-lg hover:shadow-emerald-500/10 active:scale-98 transition-all border border-emerald-300/30 cursor-pointer"
          >
            Save Expense
          </button>
        </form>
      </BottomSheet>

      {/* Notifications Module Bottom Sheet */}
      <BottomSheet
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Alerts & Notifications"
      >
        <div className="space-y-4 relative">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Inbox</span>
            <button 
              onClick={() => {
                setNotifications(notifications.map(n => ({ ...n, dismissed: true })));
                showToast("All notifications cleared!");
              }}
              className="text-[9px] font-bold text-zinc-500 hover:text-emerald-400 uppercase tracking-wide cursor-pointer border-0 bg-transparent"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-0.5 scrollbar-thin">
            {notifications.filter(n => !n.dismissed).length === 0 ? (
              <div className="p-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-zinc-650 border border-zinc-800/60">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-300">All caught up!</span>
                  <p className="text-[10px] text-zinc-500">No unread splits or active warnings found.</p>
                </div>
              </div>
            ) : (
              notifications.filter(n => !n.dismissed).map((item) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/20 hover:bg-zinc-900/40 backdrop-blur-md relative overflow-hidden flex flex-col gap-2.5 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-xs font-bold text-zinc-200">{item.title}</span>
                      <p className="text-[10.5px] text-zinc-450 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-wider shrink-0">{item.time}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-900 pt-2.5 mt-0.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded tracking-wide">
                      {item.category}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {item.category === 'split' && (
                        <button 
                          onClick={() => {
                            handleDismissNotification(item.id);
                            showToast("Splits settled successfully!");
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-500 text-zinc-950 font-black uppercase tracking-wider text-[8px] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          Settle
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          handleDismissNotification(item.id);
                          showToast("Notification dismissed");
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[8px] hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Profile Module Bottom Sheet */}
      <BottomSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="My Profile"
      >
        <div className="space-y-6 relative">
          {/* Avatar Card */}
          <div className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden flex items-center gap-4 shadow-sm">
            <div className="absolute top-[-30%] right-[-10%] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            
            {/* Glowing avatar ring */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-indigo-500 p-0.5 relative shrink-0 shadow-md">
              <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
                <span className="text-base font-black text-zinc-100 tracking-tight">AP</span>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-zinc-100">Apeksha</span>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400/15 border border-emerald-500/30 flex items-center justify-center text-[7px] font-black text-emerald-400 uppercase tracking-widest shrink-0">
                  ✓
                </span>
              </div>
              <span className="text-xs font-semibold text-zinc-500">@apeksha</span>
              <span className="text-[10px] text-zinc-650 font-bold tracking-wider mt-0.5">apeksha@expensio.app</span>
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl border border-zinc-850 bg-zinc-950/40 text-center flex flex-col gap-0.5">
              <span className="text-[8px] font-black uppercase text-zinc-550 tracking-wider">Total Saved</span>
              <span className="text-sm font-black text-emerald-400">₹2,800</span>
            </div>
            <div className="p-3 rounded-2xl border border-zinc-850 bg-zinc-950/40 text-center flex flex-col gap-0.5">
              <span className="text-[8px] font-black uppercase text-zinc-550 tracking-wider">Active Splits</span>
              <span className="text-sm font-black text-indigo-400">3 Spends</span>
            </div>
            <div className="p-3 rounded-2xl border border-zinc-850 bg-zinc-950/40 text-center flex flex-col gap-0.5">
              <span className="text-[8px] font-black uppercase text-zinc-550 tracking-wider">Groups Joined</span>
              <span className="text-sm font-black text-amber-500">3 Active</span>
            </div>
          </div>

          {/* Preferences Settings Lists */}
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Security & Preferences</span>
            
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md p-4 space-y-4">
              {/* Biometrics Switch */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-400 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-200">Biometrics Authentication</span>
                    <span className="text-[9px] text-zinc-550">Use Touch ID / Face ID logs</span>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => {
                    setBiometricsActive(!biometricsActive);
                    showToast(biometricsActive ? "Biometrics turned off" : "Biometrics activated!");
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ₹{biometricsActive ? 'bg-emerald-500 justify-end' : 'bg-zinc-850 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-zinc-950" />
                </button>
              </div>

              {/* High Contrast Mode Switch */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-200">High Contrast Mode</span>
                    <span className="text-[9px] text-zinc-550">Boost readability metrics</span>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => {
                    setHighContrastActive(!highContrastActive);
                    showToast(highContrastActive ? "High Contrast deactivated" : "High Contrast active!");
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ₹{highContrastActive ? 'bg-emerald-500 justify-end' : 'bg-zinc-850 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-zinc-950" />
                </button>
              </div>

              {/* Service Worker Offline Storage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-200">Service Worker Offline Cache</span>
                    <span className="text-[9px] text-zinc-550">Full PWA capabilities offline</span>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => {
                    setOfflineCacheActive(!offlineCacheActive);
                    showToast(offlineCacheActive ? "Offline cache disabled" : "Offline PWA caching active!");
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ₹{offlineCacheActive ? 'bg-emerald-500 justify-end' : 'bg-zinc-850 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-zinc-950" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Log Out */}
          <button 
            onClick={async () => {
              showToast("Logging out of Expensio...");
              try {
                await supabase.auth.signOut();
                // Clear persistent Zustand store
                localStorage.removeItem('expensio-finance-store-v4');
              } catch (e) {
                console.error(e);
              }
              setTimeout(() => {
                window.location.href = '/login';
              }, 1000);
            }}
            className="w-full py-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/20 active:scale-98 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Reset Store & Log Out</span>
          </button>
        </div>
      </BottomSheet>

      {/* Global Interactive Notification Toast overlay */}
      {toastMessage && (
        <div className="fixed bottom-20 left-6 right-6 z-[200] max-w-sm mx-auto p-4 rounded-xl border border-zinc-850 bg-[#09090b]/95 backdrop-blur-xl flex items-center gap-3 shadow-[0_10px_25px_rgba(0,0,0,0.5)] animate-slide-up">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-bold text-zinc-200">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
