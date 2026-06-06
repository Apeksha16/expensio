'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, User, Check, AlertCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { updateProfileSchema, UpdateProfileInput } from '@expensio/validation';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia',
];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, updateUser: updateLocalStoreUser, clearSession } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [mpinErrorMsg, setMpinErrorMsg] = useState<string | null>(null);

  const detectedTimezone =
    typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  // Fetch latest profile from API
  const {
    data: serverProfile,
    isLoading: isProfileLoading,
    error: profileFetchError,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      return data.data || data.user;
    },
    enabled: !!session?.access_token,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      currency: 'INR',
      timezone: detectedTimezone,
      monthlySalary: null,
    },
  });

  // Watch fields
  const watchedAvatarUrl = watch('avatarUrl') || '';

  // Populate form when server data is fetched
  useEffect(() => {
    if (serverProfile) {
      reset({
        name: serverProfile.name || '',
        avatarUrl: serverProfile.avatarUrl || '',
        currency: 'INR', // Always default to INR
        timezone: serverProfile.timezone || detectedTimezone,
        monthlySalary: serverProfile.monthlySalary || null,
      });
    }
  }, [serverProfile, reset, detectedTimezone]);

  // Handle preset avatar choice
  const selectPresetAvatar = (url: string) => {
    setValue('avatarUrl', url, { shouldDirty: true });
  };

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: UpdateProfileInput) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to update profile'
        );
      }

      const data = await response.json();
      return data.data || data.user;
    },
    onSuccess: (updatedUser) => {
      updateLocalStoreUser(updatedUser);
      queryClient.setQueryData(['user-profile'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSuccessMsg('Settings updated successfully!');
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Update failed');
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearSession();
      router.push('/login');
    } catch (err) {
      setErrorMsg('Logout failed');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const onSubmit = async (formData: UpdateProfileInput) => {
    setErrorMsg(null);
    setMpinErrorMsg(null);

    // Validate MPIN fields if user started typing
    if (currentMpin || newMpin || confirmMpin) {
      if (newMpin.length !== 4 && newMpin.length !== 6) {
        setMpinErrorMsg('New MPIN must be exactly 4 or 6 digits');
        return;
      }
      if (newMpin !== confirmMpin) {
        setMpinErrorMsg('New MPIN and Confirm MPIN must match');
        return;
      }
    }

    try {
      // 1. Submit MPIN update if newMpin is provided
      if (newMpin) {
        const mpinRes = await fetch(`${API_URL}/api/v1/users/mpin`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            currentMpin: currentMpin || '',
            newMpin,
            confirmMpin,
          }),
        });

        if (!mpinRes.ok) {
          const mpinErrorData = await mpinRes.json();
          throw new Error(mpinErrorData.error?.message || 'Failed to update MPIN');
        }
      }

      // 2. Submit profile fields update if dirty
      if (isDirty) {
        await updateMutation.mutateAsync(formData);
      } else if (newMpin) {
        // If only MPIN was updated, manually show success message
        setSuccessMsg('MPIN updated successfully!');
        setCurrentMpin('');
        setNewMpin('');
        setConfirmMpin('');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving preferences');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-gray-100">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-zinc-400 text-sm">Loading your profile preferences...</p>
        </div>
      </div>
    );
  }

  if (profileFetchError) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-gray-100 p-4">
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-bold">Failed to load profile</h2>
          <p className="text-zinc-400 text-sm">{(profileFetchError as Error).message}</p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#09090b] text-gray-100 px-5 pt-8 pb-20 relative overflow-y-auto overflow-x-hidden select-none flex justify-center items-start">
      {/* Background glow effect wrapper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-cyan-400 hover:border-indigo-500/25 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            User Settings
          </h1>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-5 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Information Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Profile Information
            </h3>

            {/* Avatar Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Profile Avatar
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Current Selected Avatar Preview */}
                <div className="w-20 h-20 rounded-2xl bg-zinc-955 border border-zinc-800 flex items-center justify-center overflow-hidden relative shrink-0 shadow-inner">
                  {watchedAvatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={watchedAvatarUrl}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://api.dicebear.com/7.x/adventurer/svg?seed=default';
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-zinc-650" />
                  )}
                </div>

                {/* Preset Avatar Selection Grid */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-6 gap-2 w-full bg-zinc-955/40 border border-zinc-850/60 p-2 rounded-2xl">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => selectPresetAvatar(preset)}
                        className={`relative w-full aspect-square rounded-xl bg-zinc-955 border ${
                          watchedAvatarUrl === preset
                            ? 'border-indigo-500 ring-2 ring-indigo-500/15'
                            : 'border-zinc-850 hover:border-zinc-700'
                        } overflow-hidden p-1 transition-all active:scale-95`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset}
                          alt={`Preset ${idx}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative mt-[10px]">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-555" />
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Enter your name"
                  className={`w-full h-12 bg-zinc-955 border ${
                    errors.name ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                  } focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl pl-11 pr-4 text-sm transition-all text-white placeholder-zinc-655`}
                />
              </div>
              {errors.name && (
                <span className="text-red-400 text-[10px] font-medium block mt-1.5">
                  {errors.name.message}
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-850/40" />

          {/* Monthly Salary Input */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Monthly Salary
            </label>
            <div className="relative mt-[10px]">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-555">
                ₹
              </span>
              <input
                type="number"
                step="1"
                {...register('monthlySalary', { valueAsNumber: true })}
                placeholder="Enter monthly salary"
                className={`w-full h-12 bg-zinc-955 border ${
                  errors.monthlySalary
                    ? 'border-red-500/50'
                    : 'border-zinc-800 hover:border-zinc-700'
                } focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl pl-8 pr-4 text-sm transition-all text-white placeholder-zinc-655 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
            {errors.monthlySalary ? (
              <span className="text-red-400 text-[10px] font-medium block mt-1.5">
                {errors.monthlySalary.message}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-555 font-bold block leading-none mt-1.5">
                Used to calculate spending insights and balance.
              </span>
            )}
          </div>

          <div className="h-px bg-zinc-850/40" />

          {/* Reset MPIN Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Security / Reset MPIN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current MPIN */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Current MPIN
                </label>
                <div className="relative mt-[10px]">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={currentMpin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCurrentMpin(val);
                      setMpinErrorMsg(null);
                    }}
                    placeholder="••••"
                    className="w-full h-12 bg-zinc-955 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl px-4 text-sm transition-all text-white placeholder-zinc-655 text-center font-bold tracking-widest"
                  />
                </div>
                <span className="text-[9px] text-zinc-555 font-bold block mt-1 leading-tight">
                  Leave blank if setting for first time.
                </span>
              </div>

              {/* New MPIN */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  New MPIN
                </label>
                <div className="relative mt-[10px]">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={newMpin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewMpin(val);
                      setMpinErrorMsg(null);
                    }}
                    placeholder="••••"
                    className="w-full h-12 bg-zinc-955 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl px-4 text-sm transition-all text-white placeholder-zinc-655 text-center font-bold tracking-widest"
                  />
                </div>
                <span className="text-[9px] text-zinc-555 font-bold block mt-1 leading-tight">
                  Must be 4 or 6 digits.
                </span>
              </div>

              {/* Confirm MPIN */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Confirm MPIN
                </label>
                <div className="relative mt-[10px]">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={confirmMpin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setConfirmMpin(val);
                      setMpinErrorMsg(null);
                    }}
                    placeholder="••••"
                    className="w-full h-12 bg-zinc-955 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl px-4 text-sm transition-all text-white placeholder-zinc-655 text-center font-bold tracking-widest"
                  />
                </div>
                <span className="text-[9px] text-zinc-555 font-bold block mt-1 leading-tight">
                  Must match new MPIN.
                </span>
              </div>
            </div>
            {mpinErrorMsg && (
              <span className="text-red-400 text-[10px] font-medium block mt-1">
                {mpinErrorMsg}
              </span>
            )}
          </div>

          <div className="h-px bg-zinc-850/40" />

          {/* Account Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Account</h3>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 font-black uppercase tracking-wider hover:bg-rose-500/10 active:scale-[0.98] transition-all text-xs cursor-pointer duration-200"
            >
              <LogOut className="w-4 h-4 text-rose-500 stroke-[3]" />
              Logout Session
            </button>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={updateMutation.isPending || (!isDirty && !newMpin)}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-zinc-955 font-black uppercase tracking-wider active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-35 disabled:pointer-events-none text-xs"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-zinc-955 stroke-[3]" />
                Save Preferences
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
