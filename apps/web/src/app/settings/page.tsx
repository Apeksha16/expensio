'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, User, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { updateProfileSchema, UpdateProfileInput } from '@expensio/validation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Premium avatar presets
const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia',
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar (₹)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'CAD', name: 'Canadian Dollar (C₹)' },
  { code: 'AUD', name: 'Australian Dollar (A₹)' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { session, updateUser: updateLocalStoreUser } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Fetch latest profile from API
  const { data: serverProfile, isLoading: isProfileLoading, error: profileFetchError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      return data.user;
    },
    enabled: !!session?.access_token,
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
      username: '',
      avatarUrl: '',
      currency: 'USD',
      timezone: 'UTC',
    },
  });

  // Watch avatarUrl in the form
  const watchedAvatarUrl = watch('avatarUrl') || '';

  // Derived state to determine if custom input should be shown
  const isCustomAvatar = watchedAvatarUrl && !AVATAR_PRESETS.includes(watchedAvatarUrl);
  const showCustomAvatarInput = isCustomMode || isCustomAvatar;

  // Populate form when server data is fetched
  useEffect(() => {
    if (serverProfile) {
      reset({
        name: serverProfile.name || '',
        username: serverProfile.username || '',
        avatarUrl: serverProfile.avatarUrl || '',
        currency: serverProfile.currency || 'USD',
        timezone: serverProfile.timezone || 'UTC',
      });
    }
  }, [serverProfile, reset]);

  // Handle preset avatar choice
  const selectPresetAvatar = (url: string) => {
    setValue('avatarUrl', url, { shouldDirty: true });
    setIsCustomMode(false);
  };

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: UpdateProfileInput) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      return data.user;
    },
    onSuccess: (updatedUser) => {
      updateLocalStoreUser(updatedUser);
      queryClient.setQueryData(['user-profile'], updatedUser);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Update failed');
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    setErrorMsg(null);
    updateMutation.mutate(data);
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
    <div className="min-h-screen bg-[#09090b] text-gray-100 px-4 py-8 relative overflow-hidden select-none flex justify-center items-start">
      {/* Background glow effect */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
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
          {/* Avatar Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Profile Avatar
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Current Selected Avatar Preview */}
              <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative shrink-0">
                {watchedAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={watchedAvatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=default';
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-zinc-650" />
                )}
              </div>

              {/* Preset Avatar Selection Grid */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="grid grid-cols-6 gap-2 w-full">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPresetAvatar(preset)}
                      className={`relative w-full aspect-square rounded-xl bg-zinc-950 border ${
                        watchedAvatarUrl === preset
                          ? 'border-emerald-400 ring-2 ring-emerald-400/15'
                          : 'border-zinc-850 hover:border-zinc-700'
                      } overflow-hidden p-1 transition-all active:scale-95`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-contain" />
                      {watchedAvatarUrl === preset && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-zinc-950 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (showCustomAvatarInput) {
                        setValue('avatarUrl', AVATAR_PRESETS[0], { shouldDirty: true });
                        setIsCustomMode(false);
                      } else {
                        setIsCustomMode(true);
                      }
                    }}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {showCustomAvatarInput ? 'Use Preset Avatars' : 'Use Custom Image URL'}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Avatar Input */}
            <AnimatePresence>
              {showCustomAvatarInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={isCustomAvatar ? watchedAvatarUrl : ''}
                    onChange={(e) => setValue('avatarUrl', e.target.value, { shouldDirty: true })}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl py-2.5 px-4 text-xs transition-all text-white placeholder-zinc-650"
                  />
                  {errors.avatarUrl && (
                    <span className="text-red-400 text-[10px] font-medium block mt-1">
                      {errors.avatarUrl.message}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Enter your name"
                    className={`w-full bg-zinc-950 border ${
                      errors.name ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                    } focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl py-3 pl-11 pr-4 text-sm transition-all text-white placeholder-zinc-650`}
                  />
                </div>
                {errors.name && (
                  <span className="text-red-400 text-[10px] font-medium block">
                    {errors.name.message}
                  </span>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                    @
                  </span>
                  <input
                    type="text"
                    {...register('username')}
                    placeholder="username"
                    className={`w-full bg-zinc-950 border ${
                      errors.username ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                    } focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl py-3 pl-8 pr-4 text-sm transition-all text-white placeholder-zinc-655`}
                  />
                </div>
                {errors.username && (
                  <span className="text-red-400 text-[10px] font-medium block">
                    {errors.username.message}
                  </span>
                )}
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1.5 opacity-60">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Email Address (Linked to Supabase Auth)
              </label>
              <input
                type="email"
                value={serverProfile?.email || ''}
                readOnly
                disabled
                className="w-full bg-zinc-950/40 border border-zinc-900 rounded-xl py-3 px-4 text-sm text-zinc-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-4 pt-2 border-t border-zinc-800/40">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Localization & Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Preferred Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  Preferred Currency
                </label>
                <select
                  {...register('currency')}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl py-3 px-4 text-sm text-white appearance-none cursor-pointer transition-all hover:border-zinc-700"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#09090b] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  Timezone
                </label>
                <select
                  {...register('timezone')}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl py-3 px-4 text-sm text-white appearance-none cursor-pointer transition-all hover:border-zinc-700"
                >
                  {TIMEZONES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#09090b] text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-35 disabled:pointer-events-none text-sm mt-4"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
