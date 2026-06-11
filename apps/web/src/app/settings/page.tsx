'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentUser, useUpdateProfile, useUpdateMpin } from '../../hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Check,
  AlertCircle,
  LogOut,
  Lock,
  Bell,
  BellOff,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { updateProfileSchema, UpdateProfileInput } from '@expensio/validation';
import { supabase } from '../../lib/supabase';
import BottomSheet from '../../components/shared/BottomSheet';
import { Button } from '@expensio/ui';

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
  const { clearSession } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [mpinErrorMsg, setMpinErrorMsg] = useState<string | null>(null);
  const [showMpinReset, setShowMpinReset] = useState(false);

  const {
    data: serverProfile,
    isLoading: isProfileLoading,
    error: profileFetchError,
  } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const updateMpinMutation = useUpdateMpin();
  const pushNotifications = usePushNotifications();

  const handleMpinSubmitOnly = async () => {
    setMpinErrorMsg(null);
    setErrorMsg(null);

    if (newMpin.length !== 4 && newMpin.length !== 6) {
      setMpinErrorMsg('New MPIN must be exactly 4 or 6 digits');
      return;
    }
    if (newMpin !== confirmMpin) {
      setMpinErrorMsg('New MPIN and Confirm MPIN must match');
      return;
    }

    try {
      await updateMpinMutation.mutateAsync({
        currentMpin: currentMpin || '',
        newMpin,
      });

      setSuccessMsg('MPIN updated successfully!');
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
      setShowMpinReset(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setMpinErrorMsg(err.message || 'Failed to save MPIN preference');
    }
  };

  const detectedTimezone =
    typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

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
        username: serverProfile.username || '',
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

  const handleLogout = async () => {
    try {
      if (pushNotifications.isSubscribed) {
        await pushNotifications.unsubscribe();
      }
      queryClient.clear();
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

    try {
      // Submit profile fields update if dirty
      if (isDirty) {
        await updateProfileMutation.mutateAsync(formData);
        setSuccessMsg('Settings updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving preferences');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-theme-text transition-colors duration-300">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-theme-secondary text-sm">Loading your profile preferences...</p>
        </div>
      </div>
    );
  }

  if (profileFetchError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-theme-text p-4 transition-colors duration-300">
        <div className="w-full max-w-md bg-theme-card backdrop-blur-xl border border-theme-card-border rounded-3xl p-8 text-center flex flex-col items-center gap-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-bold">Failed to load profile</h2>
          <p className="text-theme-secondary text-sm">{(profileFetchError as Error).message}</p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-theme-btn border border-theme-btn-border hover:bg-theme-btn/80 text-theme-text rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-background text-theme-text flex justify-center overflow-hidden relative transition-colors duration-300">
      {/* ambient glows */}
      <div className="absolute top-[-20%] left-[-20%] w-150 h-150 bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-150 h-150 bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Responsive Canvas PWA Frame Shell */}
      <div className="w-full max-w-md h-full flex flex-col bg-shell border-x border-theme-border shadow-2xl relative overflow-hidden transition-colors duration-300">
        {/* Scrollable Container Wrapper */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-none flex flex-col pb-24 px-6 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-6"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between mb-2">
              <Link
                href="/dashboard"
                className="p-2.5 rounded-xl bg-theme-btn border border-theme-btn-border text-theme-secondary hover:text-theme-text active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <h1 className="text-base font-black text-theme-text uppercase tracking-widest">
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
                {/* Avatar Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                    Profile Avatar
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Current Selected Avatar Preview */}
                    <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative shrink-0 shadow-inner">
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
                      <div className="grid grid-cols-6 gap-2 w-full bg-zinc-900/40 border border-zinc-850/60 p-2 rounded-2xl">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => selectPresetAvatar(preset)}
                            className={`relative w-full aspect-square rounded-xl bg-zinc-950 border ${
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
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative mt-[10px]">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary" />
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Enter your name"
                      className={`w-full h-12 bg-zinc-900/20 border ${
                        errors.name
                          ? 'border-red-500/50'
                          : 'border-zinc-800/80 hover:border-zinc-700/80'
                      } focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-2xl pl-11 pr-4 text-xs font-semibold transition-all text-theme-text placeholder-theme-muted`}
                    />
                  </div>
                  {errors.name && (
                    <span className="text-red-400 text-[10px] font-medium block mt-1.5">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">
                    Username
                  </label>
                  <div className="relative mt-[10px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-theme-secondary font-mono">
                      @
                    </span>
                    <input
                      type="text"
                      {...register('username')}
                      placeholder="username"
                      className={`w-full h-12 bg-zinc-900/20 border ${
                        errors.username
                          ? 'border-red-500/50'
                          : 'border-zinc-800/80 hover:border-zinc-700/80'
                      } focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-2xl pl-8 pr-4 text-xs font-semibold transition-all text-theme-text placeholder-theme-muted`}
                    />
                  </div>
                  {errors.username ? (
                    <span className="text-red-400 text-[10px] font-medium block mt-1.5">
                      {errors.username.message}
                    </span>
                  ) : (
                    <span className="text-[10px] text-theme-muted font-bold block leading-none mt-1.5">
                      Used by friends to search and split bills with you.
                    </span>
                  )}
                </div>
              </div>
              <div className="h-px bg-zinc-850/40" />
              {/* Monthly Salary Input */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                  Monthly Salary
                </label>
                <div className="relative mt-[10px]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-theme-secondary">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    {...register('monthlySalary', { valueAsNumber: true })}
                    placeholder="Enter monthly salary"
                    className={`w-full h-12 bg-zinc-900/20 border ${
                      errors.monthlySalary
                        ? 'border-red-500/50'
                        : 'border-zinc-800/80 hover:border-zinc-700/80'
                    } focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-2xl pl-8 pr-4 text-xs font-semibold transition-all text-theme-text placeholder-theme-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                </div>
                {errors.monthlySalary ? (
                  <span className="text-red-400 text-[10px] font-medium block mt-1.5">
                    {errors.monthlySalary.message}
                  </span>
                ) : (
                  <span className="text-[10px] text-theme-muted font-bold block leading-none mt-1.5">
                    Used to calculate spending insights and balance.
                  </span>
                )}
              </div>
              <div className="h-px bg-zinc-850/40" /> {/* Reset MPIN Section */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                  Security Settings
                </h3>

                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowMpinReset(true);
                    setMpinErrorMsg(null);
                  }}
                >
                  <Lock className="w-4 h-4 text-theme-secondary stroke-[2.2]" />
                  Reset Security MPIN
                </Button>
              </div>
              <div className="h-px bg-zinc-850/40" />
              {/* Push Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                  Notifications
                </h3>
                {pushNotifications.isSupported ? (
                  <Button
                    type="button"
                    variant={pushNotifications.isSubscribed ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={
                      pushNotifications.isSubscribed
                        ? pushNotifications.unsubscribe
                        : pushNotifications.subscribe
                    }
                  >
                    {pushNotifications.isSubscribed ? (
                      <>
                        <Bell className="w-4 h-4 stroke-[2.2]" />
                        Push Notifications Enabled
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 stroke-[2.2]" />
                        Enable Push Notifications
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 text-zinc-500 font-bold uppercase tracking-wider text-xs">
                    Push Notifications Not Supported
                  </div>
                )}
              </div>
              <div className="h-px bg-zinc-850/40" />
              {/* Account Section */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                  Account
                </h3>
                <Button type="button" variant="danger" fullWidth onClick={handleLogout}>
                  <LogOut className="w-4 h-4 text-rose-500 stroke-[3]" />
                  Logout Session
                </Button>
              </div>
              {/* Save Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={!isDirty}
                isLoading={updateProfileMutation.isPending}
                loadingText="Saving Changes..."
              >
                <Save className="w-4 h-4 text-white stroke-[3]" />
                Save Preferences
              </Button>
            </form>

            {/* Reset MPIN Bottom Sheet */}
            <BottomSheet
              isOpen={showMpinReset}
              onClose={() => {
                setShowMpinReset(false);
                setCurrentMpin('');
                setNewMpin('');
                setConfirmMpin('');
                setMpinErrorMsg(null);
              }}
              title="Reset Security MPIN"
            >
              <div className="space-y-6 py-4">
                <span className="text-[10.5px] font-extrabold text-theme-secondary uppercase tracking-wider block">
                  3-Step Verification Required
                </span>

                <div className="space-y-5">
                  {/* Current MPIN */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">
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
                        className="w-full h-12 bg-zinc-900/20 border border-zinc-800/80 hover:border-zinc-700/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-2xl px-4 text-xs font-semibold transition-all text-theme-text placeholder-theme-muted text-center font-bold tracking-widest"
                      />
                    </div>
                    <span className="text-[9px] text-theme-muted font-bold block mt-1 leading-tight">
                      Leave blank if setting for first time.
                    </span>
                  </div>

                  {/* New MPIN */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">
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
                        className="w-full h-12 bg-zinc-900/20 border border-zinc-800/80 hover:border-zinc-700/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-2xl px-4 text-xs font-semibold transition-all text-theme-text placeholder-theme-muted text-center font-bold tracking-widest"
                      />
                    </div>
                    <span className="text-[9px] text-theme-muted font-bold block mt-1 leading-tight">
                      Must be 4 or 6 digits.
                    </span>
                  </div>

                  {/* Confirm MPIN */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">
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
                        className="w-full h-12 bg-zinc-900/20 border border-zinc-800/80 hover:border-zinc-700/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-2xl px-4 text-xs font-semibold transition-all text-theme-text placeholder-theme-muted text-center font-bold tracking-widest"
                      />
                    </div>
                    <span className="text-[9px] text-theme-muted font-bold block mt-1 leading-tight">
                      Must match new MPIN.
                    </span>
                  </div>
                </div>

                {mpinErrorMsg && (
                  <span className="text-red-400 text-[10px] font-medium block">{mpinErrorMsg}</span>
                )}

                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  disabled={!newMpin}
                  isLoading={updateMpinMutation.isPending}
                  loadingText="Updating MPIN..."
                  onClick={handleMpinSubmitOnly}
                >
                  <Save className="w-4 h-4 text-white stroke-[3]" />
                  Update Security MPIN
                </Button>
              </div>
            </BottomSheet>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
