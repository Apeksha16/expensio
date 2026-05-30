'use client';

import React, { useState } from 'react';
import { Friend, Group, Expense, useFinanceStore } from '../../../store/finance-store';
import GroupCard from '../../../components/shared/GroupCard';
import ExpenseCard from '../../../components/shared/ExpenseCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import { Plus, ArrowLeft, Users, FolderOpen, Share2 } from 'lucide-react';

export default function GroupsPage() {
  const { groups, addGroup, friends, expenses, addExpense, deleteExpense } = useFinanceStore();
  
  // Navigation State: Selected Group ID for dynamic detailed sub-screens
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Group add modal state
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverIndex, setCoverIndex] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Group expense add sheet states
  const [isAddGroupExpenseOpen, setIsAddGroupExpenseOpen] = useState(false);
  const [groupExpenseAmount, setGroupExpenseAmount] = useState('');
  const [groupExpenseTitle, setGroupExpenseTitle] = useState('');
  const [groupExpenseCategory, setGroupExpenseCategory] = useState('Food');
  const [groupExpenseDate, setGroupExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupExpenseNote, setGroupExpenseNote] = useState('');

  const gradientCovers = [
    'from-indigo-600 to-cyan-500',
    'from-emerald-500 to-teal-400',
    'from-orange-500 to-rose-500',
    'from-pink-500 to-indigo-600',
    'from-violet-600 to-fuchsia-500'
  ];

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    addGroup({
      name,
      description,
      coverImage: gradientCovers[coverIndex],
      members: selectedMembers
    });

    setName('');
    setDescription('');
    setCoverIndex(0);
    setSelectedMembers([]);
    setIsAddGroupOpen(false);
  };

  const handleMemberToggle = (friendName: string) => {
    if (selectedMembers.includes(friendName)) {
      setSelectedMembers(selectedMembers.filter(name => name !== friendName));
    } else {
      setSelectedMembers([...selectedMembers, friendName]);
    }
  };

  const handleAddGroupExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !groupExpenseAmount || isNaN(Number(groupExpenseAmount)) || !groupExpenseTitle) return;

    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return;

    // Split with all group members
    addExpense({
      title: groupExpenseTitle,
      amount: Number(groupExpenseAmount),
      category: groupExpenseCategory,
      date: groupExpenseDate,
      note: groupExpenseNote,
      paidBy: 'me',
      splitWith: group.members,
      splitType: 'equal',
      groupId: selectedGroupId
    });

    setGroupExpenseAmount('');
    setGroupExpenseTitle('');
    setGroupExpenseCategory('Food');
    setGroupExpenseDate(new Date().toISOString().split('T')[0]);
    setGroupExpenseNote('');
    setIsAddGroupExpenseOpen(false);
  };

  // Find active group object if selected
  const activeGroup = groups.find(g => g.id === selectedGroupId);

  // Group-specific expenses
  const activeGroupExpenses = expenses.filter(e => e.groupId === selectedGroupId);
  const activeGroupTotalSpend = activeGroupExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 pb-6 select-none relative">
      
      {activeGroup ? (
        /* ==================== GROUP DETAILS VIEW ==================== */
        <div className="space-y-6 animate-fade-in">
          {/* Back Action Bar */}
          <div className="flex items-center gap-3 px-1 -mt-2">
            <button
              onClick={() => setSelectedGroupId(null)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-450 tracking-wide">Back to Groups</span>
          </div>

          {/* Glowing Gradient Header Banner with Unsplash photography */}
          <div 
            className={`rounded-3xl p-6 bg-cover bg-center relative overflow-hidden flex flex-col justify-end gap-2.5 min-h-40 border border-zinc-500/10 shadow-lg ₹{!activeGroup.coverUrl ? `bg-gradient-to-tr ₹{activeGroup.coverImage}` : ''}`}
            style={activeGroup.coverUrl ? { backgroundImage: `url(₹{activeGroup.coverUrl})` } : undefined}
          >
            {/* Dark glass backdrop overlay */}
            <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
            
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-200 z-10">Group Split</span>
            <h3 className="text-2xl font-black text-zinc-100 tracking-tight z-10 leading-none">{activeGroup.name}</h3>
            <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed z-10 opacity-90 max-w-xs">{activeGroup.description}</p>
          </div>

          {/* Group Split balances */}
          <div className="grid grid-cols-2 gap-4 px-0.5">
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col gap-1 shadow-sm">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Group Total Spend</span>
              <span className="text-xl font-black text-zinc-100">₹{activeGroupTotalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col gap-1 shadow-sm">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Your Share</span>
              <span className="text-xl font-black text-indigo-400">
                ₹{(activeGroupTotalSpend / (activeGroup.members.length + 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action buttons list */}
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Expenses Feed</h3>
            <button
              onClick={() => setIsAddGroupExpenseOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold active:scale-95 hover:scale-105 transition-all text-xs cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Group Bill</span>
            </button>
          </div>

          {/* Group transactions feed */}
          <div className="space-y-3 px-1">
            {activeGroupExpenses.length === 0 ? (
              <div className="p-10 rounded-2xl border border-zinc-850 bg-zinc-950/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center py-10 px-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-300">No Shared Expenses</span>
                  <p className="text-[10px] text-zinc-500">Expenses split equally in this group will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGroupExpenses.map((expense: Expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={deleteExpense}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Group members overview */}
          <div className="space-y-3 px-1">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Group Members ({activeGroup.members.length + 1})</span>
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-wrap gap-2.5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Me (You)</span>
              </div>
              {activeGroup.members.map((member: string) => (
                <div key={member} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950/40 text-zinc-300 text-xs font-semibold">
                  <div className="w-4.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] font-black uppercase text-zinc-500">
                    {member.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span>{member.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== GROUPS CARD LIST ==================== */
        <div className="space-y-6 animate-fade-in">
          {/* Header Info */}
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">Bill Split Groups</h2>
              <p className="text-xs text-zinc-400">Manage shared expenses for trips, flats, and events.</p>
            </div>
            <button
              onClick={() => setIsAddGroupOpen(true)}
              className="p-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              aria-label="Add Group"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* List of active groups */}
          <div className="space-y-4 px-1">
            {groups.length === 0 ? (
              <div className="p-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-300">No active split groups</p>
                  <p className="text-xs text-zinc-500">Tap the + button to create a shared group expense space.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {groups.map((group: Group) => (
                  <div key={group.id} onClick={() => setSelectedGroupId(group.id)}>
                    <GroupCard group={group} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Group Drawer Sheet */}
      <BottomSheet
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
        title="Create Group"
      >
        <form onSubmit={handleAddGroupSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Flatmates 402"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Description</label>
            <input
              type="text"
              placeholder="Rent, utilities, groceries splits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Select Banner Cover */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select Banner Style</label>
            <div className="flex gap-2.5 pb-1">
              {gradientCovers.map((cov, idx) => {
                const isSelected = coverIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverIndex(idx)}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ₹{cov} border transition-all shrink-0 cursor-pointer ₹{
                      isSelected 
                        ? 'border-zinc-100 scale-105 shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                        : 'border-transparent opacity-60'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Group Member Selection Checklist */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Add Group Members</label>
            {friends.length === 0 ? (
              <span className="text-xs text-zinc-650 italic">No friend contacts found. Add friends first!</span>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {friends.map((friend: Friend) => {
                  const isChecked = selectedMembers.includes(friend.name);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleMemberToggle(friend.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-semibold text-xs transition-all shrink-0 cursor-pointer ₹{
                        isChecked
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
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
            className="w-full py-4 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 text-zinc-950 font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs"
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
        <form onSubmit={handleAddGroupExpenseSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-1.5 py-4 border-b border-zinc-900">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bill Amount</span>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-extrabold text-emerald-400">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={groupExpenseAmount}
                onChange={(e) => setGroupExpenseAmount(e.target.value)}
                className="text-4xl font-black text-zinc-100 bg-transparent text-center focus:outline-none w-48"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Bill Description</label>
            <input
              type="text"
              placeholder="Rent booking, hotel stay, team lunch..."
              value={groupExpenseTitle}
              onChange={(e) => setGroupExpenseTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 focus:outline-none placeholder-zinc-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</label>
              <select
                value={groupExpenseCategory}
                onChange={(e) => setGroupExpenseCategory(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none"
              >
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Utilities">Utilities</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Bill Date</label>
              <input
                type="date"
                value={groupExpenseDate}
                onChange={(e) => setGroupExpenseDate(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Memo Details</label>
            <input
              type="text"
              placeholder="e.g. Split equally among members"
              value={groupExpenseNote}
              onChange={(e) => setGroupExpenseNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 focus:outline-none placeholder-zinc-500"
            />
          </div>

          {activeGroup && (
            <div className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Split Equally Between:</span>
              </div>
              <span className="text-zinc-300">{activeGroup.members.length + 1} Members</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 text-zinc-950 font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs"
          >
            Distribute Bill Splits
          </button>
        </form>
      </BottomSheet>

    </div>
  );
}
