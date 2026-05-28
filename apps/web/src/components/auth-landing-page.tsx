'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  RefreshCw,
  Shield,
  ShieldCheck,
  UsersRound,
  WalletCards,
  WifiOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type AuthProvider = 'Google' | 'Zoho';

const features = [
  {
    title: 'Track',
    subtitle: 'Every Expense',
    icon: BarChart3,
    shell: 'bg-[#EFE9FF] dark:bg-[#241A46]',
    iconClass: 'text-[#7C5CFF] dark:text-[#A58BFF]',
  },
  {
    title: 'Split',
    subtitle: 'With Friends',
    icon: UsersRound,
    shell: 'bg-[#E6F8EF] dark:bg-[#103322]',
    iconClass: 'text-[#24B26B] dark:text-[#34D399]',
  },
  {
    title: 'Save',
    subtitle: 'More Money',
    icon: Shield,
    shell: 'bg-[#FFF0D9] dark:bg-[#3A2A10]',
    iconClass: 'text-[#F2A400] dark:text-[#F8C45C]',
  },
];

export function AuthLandingPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') {
      return true;
    }
    return navigator.onLine;
  });
  const pullStartY = useRef<number | null>(null);

  const screenMotion = useMemo(
    () => ({
      initial: reduceMotion ? false : { opacity: 0, y: 18 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' },
    }),
    [reduceMotion],
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!loadingProvider) {
      return;
    }

    const timer = window.setTimeout(() => {
      localStorage.setItem(
        'expensio_auth_user',
        JSON.stringify({ name: 'Pranav', provider: loadingProvider })
      );
      router.push('/onboarding');
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [loadingProvider]);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    }, 700);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (window.scrollY <= 0) {
      pullStartY.current = event.touches[0]?.clientY ?? null;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (pullStartY.current === null || isRefreshing) {
      return;
    }

    const delta = (event.touches[0]?.clientY ?? 0) - pullStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(84, delta * 0.5));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 56) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }

    pullStartY.current = null;
  };

  return (
    <main
      className="min-h-[100svh] overflow-hidden bg-background text-foreground"
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: pullDistance > 8 || isRefreshing ? 1 : 0,
          y: pullDistance > 8 ? pullDistance - 42 : -18,
        }}
        className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+8px)] z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-[13px] font-black text-muted shadow-[0_20px_50px_rgba(124,92,255,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#111827]/85"
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
      >
        <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={15} />
        {isRefreshing ? 'Refreshing' : 'Pull to refresh'}
      </motion.div>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,92,255,0.16),transparent_34%),radial-gradient(circle_at_70%_64%,rgba(52,211,153,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(139,124,255,0.18),transparent_35%),radial-gradient(circle_at_34%_68%,rgba(52,211,153,0.08),transparent_28%)]" />

      <motion.section
        {...screenMotion}
        className="relative mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col px-7 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-[calc(env(safe-area-inset-top,0px)+14px)]"
      >
        <AnimatePresence>
          {!isOnline ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 rounded-full border border-[#FCA5A5]/30 bg-white/75 px-4 py-2 text-[12px] font-bold text-muted shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-[#FCA5A5]/15 dark:bg-[#111827]/75"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
            >
              <WifiOff size={14} />
              Offline mode. Sign-in will continue when connection returns.
            </motion.div>
          ) : null}
        </AnimatePresence>

        <BrandHeader />
        <WalletHero />
        <FeatureHighlights />
        <AuthSection onSelectProvider={setLoadingProvider} />
      </motion.section>

      <AnimatePresence>
        {loadingProvider ? <SecureLoader provider={loadingProvider} reduceMotion={Boolean(reduceMotion)} /> : null}
      </AnimatePresence>
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="mt-[clamp(24px,6svh,50px)] text-center">
      <div className="mx-auto grid h-[54px] w-[54px] place-items-center rounded-[19px] bg-[linear-gradient(135deg,#B894FF_0%,#7C5CFF_52%,#5C49E6_100%)] shadow-[0_22px_46px_rgba(124,92,255,0.34)]">
        <svg aria-hidden="true" className="h-[38px] w-[38px]" viewBox="0 0 64 64" fill="none">
          <path d="M19 20C19 14.477 23.477 10 29 10H45" stroke="white" strokeWidth="6.2" strokeLinecap="round" />
          <path d="M19 32C19 26.477 23.477 22 29 22H45" stroke="white" strokeWidth="6.2" strokeLinecap="round" />
          <path d="M19 44C19 38.477 23.477 34 29 34H45" stroke="white" strokeWidth="6.2" strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="mt-2.5 text-[clamp(38px,10.4vw,48px)] font-black leading-[0.95] tracking-[-0.02em] text-foreground">
        Expensio
      </h1>
      <p className="mx-auto mt-3.5 max-w-[330px] text-center text-[16px] font-semibold leading-[1.36] text-muted">
        A simple and smart way to manage your <span className="font-black text-primary dark:text-[#A58BFF]">money</span> and{' '}
        <span className="font-black text-primary dark:text-[#A58BFF]">expenses.</span>
      </p>
    </header>
  );
}

function WalletHero() {
  return (
    <section aria-label="Expensio wallet illustration" className="relative mt-10 mb-8 h-[260px] w-full shrink-0">
      <div
        className="absolute left-3 top-2 z-10 h-[104px] w-[100px] -rotate-[10deg] rounded-[20px] bg-white/78 p-3.5 shadow-[0_26px_65px_rgba(124,92,255,0.16)] backdrop-blur-xl dark:bg-[#111827]/76 dark:shadow-[0_26px_65px_rgba(0,0,0,0.28)]"
      >
        <p className="text-[11px] font-black text-muted">This Month</p>
        <p className="mt-2 text-[19px] font-black leading-none text-foreground">₹ 2,184.50</p>
        <svg aria-hidden="true" className="mt-3 h-12 w-full" viewBox="0 0 90 48" fill="none">
          <path d="M2 42H88" stroke="#E7E8F1" strokeWidth="1" />
          <path d="M2 28H88" stroke="#E7E8F1" strokeWidth="1" />
          <path d="M2 14H88" stroke="#E7E8F1" strokeWidth="1" />
          <path d="M4 38C13 28 18 30 25 27C34 23 36 32 44 28C55 22 50 10 62 8C72 6 70 17 86 3" stroke="#8B6BFF" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="27" r="2.5" fill="#8B6BFF" />
          <circle cx="62" cy="8" r="2.5" fill="#8B6BFF" />
        </svg>
      </div>

      <div
        className="absolute right-1 top-2 z-10 h-[104px] w-[100px] rotate-[9deg] rounded-[20px] bg-white/78 p-3.5 shadow-[0_26px_65px_rgba(124,92,255,0.16)] backdrop-blur-xl dark:bg-[#111827]/76 dark:shadow-[0_26px_65px_rgba(0,0,0,0.28)]"
      >
        <p className="text-[11px] font-black text-muted">Budget Left</p>
        <p className="mt-2 text-[18px] font-black leading-none text-foreground">₹815.20</p>
        <div className="relative mx-auto mt-4 grid h-[58px] w-[58px] place-items-center rounded-full bg-[#F2EEFF] dark:bg-[#241A46]">
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="23" stroke="#DCD4FF" strokeWidth="8" fill="none" />
            <circle cx="32" cy="32" r="23" stroke="#6B45F5" strokeWidth="8" fill="none" strokeDasharray="104 145" strokeLinecap="round" />
          </svg>
          <span className="text-[13px] font-black">72%</span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[33%] top-5 text-[32px] text-[#8B6BFF]"
      >
        ✦
      </div>
      <span aria-hidden="true" className="absolute right-[28%] top-5 h-4 w-4 rounded-full border-[3px] border-[#8BD2FF] bg-[#FFD36D] shadow-[0_0_24px_rgba(255,211,109,0.8)]" />
      <span aria-hidden="true" className="absolute bottom-12 left-8 h-5 w-5 rounded-full bg-[#5EDCA1] shadow-[0_10px_26px_rgba(52,211,153,0.42)]" />
      <span aria-hidden="true" className="absolute bottom-12 right-12 text-[26px] text-[#BFA7FF]">✦</span>

      <div
        className="absolute inset-x-0 bottom-2 z-20 mx-auto h-[198px] w-[238px]"
      >
        <div className="absolute bottom-[100px] left-[85px] h-[92px] w-[72px] -rotate-[-5deg] rounded-[16px] bg-white shadow-[0_18px_28px_rgba(15,23,42,0.09)] dark:bg-[#F8FAFC]">
          <div className="mx-auto mt-7 h-2.5 w-14 rounded-full bg-[#D6D8E2]" />
          <div className="mx-auto mt-5 h-2.5 w-16 rounded-full bg-[#D6D8E2]" />
          <div className="mx-auto mt-5 h-2.5 w-14 rounded-full bg-[#D6D8E2]" />
        </div>

        <div className="absolute bottom-[72px] left-[106px] z-20 grid h-[50px] w-[50px] place-items-center rounded-full border-[5px] border-[#FFD782] bg-[linear-gradient(135deg,#FFE69D,#E0A635)] text-[26px] font-black text-[#A3691B] shadow-[0_12px_24px_rgba(224,166,53,0.38)]">
          ₹
        </div>

        <div className="absolute bottom-[76px] right-[34px] z-10 h-[96px] w-[80px] rotate-[8deg] rounded-[18px] bg-[linear-gradient(135deg,#91F4BD,#22B56D)] shadow-[0_20px_42px_rgba(34,181,109,0.34)]">
          <span className="absolute right-4 top-5 h-9 w-9 rounded-[9px] bg-white/90" />
          <span className="absolute bottom-7 left-4 h-5 w-7 rounded-md bg-white/18" />
          <span className="absolute bottom-7 left-12 h-5 w-7 rounded-md bg-white/18" />
          <span className="absolute bottom-4 left-4 h-5 w-7 rounded-md bg-white/18" />
          <span className="absolute bottom-4 left-12 h-5 w-7 rounded-md bg-white/18" />
        </div>

        <div className="absolute bottom-0 left-5 right-5 z-30 h-[104px] rounded-[31px] bg-[linear-gradient(145deg,#9D75FF_0%,#7250EF_52%,#4E36C9_100%)] shadow-[0_24px_38px_rgba(87,61,210,0.38)]">
          <div className="absolute inset-x-5 top-4 h-px bg-white/20" />
          <div className="absolute inset-x-5 bottom-4 h-px rounded-full bg-[#402DB2]/40" />
          <div className="absolute -right-6 top-[38px] h-[56px] w-[82px] rounded-[22px] bg-[linear-gradient(135deg,#8E6BFF,#5238D7)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_12px_24px_rgba(62,42,180,0.34)]">
            <span className="absolute left-7 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white shadow-[inset_0_-6px_10px_rgba(15,23,42,0.12)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureHighlights() {
  return (
    <section aria-label="Feature highlights" className="mt-4 mb-10 grid grid-cols-3 divide-x divide-[#E8EAF3] dark:divide-white/10">
      {features.map((feature) => (
        <div className="grid justify-items-center px-2 text-center" key={feature.title}>
          <div className={`grid h-[44px] w-[44px] place-items-center rounded-[16px] ${feature.shell}`}>
            <feature.icon className={feature.iconClass} size={23} strokeWidth={2.5} />
          </div>
          <h2 className="mt-2 text-[20px] font-black leading-none text-foreground">{feature.title}</h2>
          <p className="mt-1 text-[13px] font-semibold leading-tight text-muted">{feature.subtitle}</p>
        </div>
      ))}
    </section>
  );
}

function AuthSection({ onSelectProvider }: { onSelectProvider: (provider: AuthProvider) => void }) {
  return (
    <section className="mt-auto mb-6" aria-labelledby="auth-heading">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E6E8F1] dark:bg-white/10" />
        <h2 id="auth-heading" className="text-[15px] font-bold text-muted">
          Sign in securely
        </h2>
        <div className="h-px flex-1 bg-[#E6E8F1] dark:bg-white/10" />
      </div>

      <div className="mt-3 grid gap-3">
        <AuthButton label="Sign in with Google" logo={<GoogleLogo />} onClick={() => onSelectProvider('Google')} />
        <AuthButton label="Sign in with Zoho" logo={<ZohoLogo />} onClick={() => onSelectProvider('Zoho')} />
      </div>
    </section>
  );
}

function AuthButton({ label, logo, onClick }: { label: string; logo: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      className="grid min-h-[58px] grid-cols-[96px_1fr_28px] items-center rounded-full border border-white/80 bg-white px-5 text-center text-[16px] font-black text-foreground shadow-[0_24px_60px_rgba(15,23,42,0.08)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_28px_68px_rgba(124,92,255,0.16)] focus-visible:ring-4 focus-visible:ring-[#7C5CFF]/25 active:shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      onClick={onClick}
      type="button"
      whileTap={{ scale: 0.98 }}
    >
      <span className="justify-self-start">{logo}</span>
      <span>{label}</span>
      <ArrowRight className="justify-self-end text-muted" size={25} strokeWidth={3} />
    </motion.button>
  );
}



function SecureLoader({ provider, reduceMotion }: { provider: AuthProvider; reduceMotion: boolean }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-[#F8F8FC]/95 px-8 text-center backdrop-blur-2xl dark:bg-[#09090B]/95"
      exit={{ opacity: 0, y: 12 }}
      initial={{ opacity: 0 }}
      role="status"
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        className="grid justify-items-center"
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative grid h-[112px] w-[112px] place-items-center rounded-[38px] bg-[linear-gradient(135deg,#B894FF,#7C5CFF_48%,#5844DD)] shadow-[0_30px_70px_rgba(124,92,255,0.38)]">
          <WalletCards className="text-white" size={46} strokeWidth={2.4} />
          <motion.span
            animate={reduceMotion ? undefined : { rotate: 360 }}
            className="absolute -right-3 -top-3 grid h-12 w-12 place-items-center rounded-full border-4 border-[#FFE6A3] bg-[linear-gradient(135deg,#FFE79D,#DDA12D)] text-2xl font-black text-[#9A6418] shadow-[0_16px_28px_rgba(221,161,45,0.34)]"
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          >
            ₹
          </motion.span>
        </div>
        <h2 className="mt-8 text-[24px] font-black text-foreground">Preparing your secure workspace...</h2>
        <p className="mt-3 max-w-[280px] text-[16px] font-semibold leading-relaxed text-muted">
          Authenticating with {provider}
        </p>
      </motion.div>
    </motion.div>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.3l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function ZohoLogo() {
  const blocks = [
    ['Z', '#E5262E', '-rotate-6'],
    ['O', '#13A64A', 'rotate-6'],
    ['H', '#1886D8', '-rotate-3'],
    ['O', '#F5B400', 'rotate-3'],
  ];

  return (
    <span aria-hidden="true" className="flex h-8 items-center -space-x-2">
      {blocks.map(([letter, color, rotate]) => (
        <span
          className={`grid h-7 w-7 place-items-center rounded-[6px] border-2 border-white text-[15px] font-black text-white shadow-sm ${rotate}`}
          key={`${letter}-${color}`}
          style={{ backgroundColor: color }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
