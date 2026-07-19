# Expensio — Complete Design System & Implementation Guidelines

> **Agent Instruction**: This document is a complete, cloneable blueprint of the Expensio personal finance app. Follow it exactly to recreate an identical app — UI, UX, animations, services, and architecture. Do not deviate from the patterns described here.

---

## 1. Project Overview

Expensio is a **mobile-first Progressive Web App (PWA)** for personal expense tracking. It is designed to feel and behave like a native iOS/Android application when added to a device's home screen. Every design and engineering decision prioritizes mobile UX above desktop.

**Core user features:**
- Expense tracking with categories, date, payment mode
- Budget limits per category
- Friends & bill-splitting with groups
- Recurring subscriptions tracker
- Savings goals with progress tracking
- Private ledger (personal debts / credit)
- Monthly financial reports with charts
- User profile with avatar, salary, and configurable quick-actions

---

## 2. Full Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 22 (Standalone Components, Signals) |
| **Language** | TypeScript 6.x |
| **Styling** | Tailwind CSS v4 (CSS-first config with `@theme`) |
| **Font** | Poppins (Google Fonts) — weights 300–900 |
| **Backend / Auth** | Supabase (PostgreSQL, Auth, Realtime, RPCs) |
| **Email** | EmailJS (`@emailjs/browser`) |
| **Charts** | Chart.js v4 |
| **PWA** | Angular Service Worker (`@angular/service-worker`) |
| **Deployment** | Firebase Hosting |
| **Package Manager** | npm |
| **Build Tool** | `@angular/build` (Vite/esbuild under the hood) |

---

## 3. Design Language & Visual Identity

### 3.1 Aesthetic Philosophy — "Neobrutalism"

This app uses a **neobrutalist** design language. The hallmarks are:

- **No border-radius on anything** — `rounded-none` is default everywhere
- **2px solid black borders** — `border-2 border-black` on all cards, inputs, buttons, sheets
- **Hard offset box shadows** — `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` on important elements like the logo, icons
- **High contrast** — heavy use of pure black `#000000` and pure white `#ffffff`
- **Bold, uppercase typography** — `font-extrabold`, `tracking-tight`, `uppercase` labels
- **Clean whitespace** — generous padding on cards and sections

### 3.2 Color System (Defined in `src/styles.css`)

The app uses a **per-module color system**. Each feature module has its own 4-color palette: primary, dark, light, and a soft surface tint. These are defined as Tailwind v4 custom theme tokens.

```css
@theme {
  /* Global */
  --color-background: #f8fafc;       /* slate-50 */
  --color-surface: #ffffff;
  --color-text: #0f172a;             /* slate-900 */
  --color-text-muted: #64748b;       /* slate-500 */
  --font-sans: 'Poppins', ui-sans-serif, system-ui, sans-serif;

  /* Module color tokens */
  --color-expense-primary: #3B82F6;
  --color-expense-surface: #EFF6FF;
  --color-budget-primary: #10B981;
  --color-budget-surface: #ECFDF5;
  --color-friends-primary: #F59E0B;
  --color-friends-surface: #FFFBEB;
  --color-splits-primary: #629900;
  --color-splits-surface: #f5faea;
  --color-subscriptions-primary: #8B5CF6;
  --color-subscriptions-surface: #F5F3FF;
  --color-goals-primary: #f26a8d;
  --color-goals-surface: #fdf0f4;
  --color-ledger-primary: #bc4749;
  --color-ledger-surface: #faedee;
  --color-reports-primary: #EC4899;
  --color-reports-surface: #FDF2F8;
  --color-profile-primary: #6B7280;
  --color-profile-surface: #F9FAFB;
}
```

The layout's top header dynamically switches its background color to match the active module's primary color. This is done via a `getThemeClasses()` computed in `layout.component.ts`.

### 3.3 Typography Rules

- **Font family**: `Poppins` everywhere. Load all weights from Google Fonts in `index.html`.
- **Headings**: `font-extrabold`, `tracking-tight`, typically `text-xl` to `text-3xl`
- **Labels**: `text-xs font-bold uppercase tracking-wider text-gray-700`
- **Body**: `font-semibold` or `font-medium`
- **Muted text**: `text-gray-500 font-medium`
- **All font sizes on inputs must be at least 16px** — this prevents iOS Safari from auto-zooming on focus

### 3.4 The Primary Button

The global call-to-action button has a signature deep forest-green style. Use this for ALL primary actions:

```
bg-[#1a2e22] hover:bg-[#2f4d3b] text-white
rounded-none border-0 font-medium
active:scale-[0.98] transition-all duration-200
min-h-[44px] w-full
```

It includes a loading spinner state (animated SVG) and a disabled state.

---

## 4. Mobile-First PWA Architecture

### 4.1 Meta Tags & PWA Manifest (`index.html`)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="AppName">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-192x192.png">
<!-- iOS splash screens for multiple device sizes -->
```

### 4.2 Global Body CSS Rules (`src/styles.css`)

These are critical for native-feel behavior:

```css
html, body {
  @apply bg-background text-text antialiased w-full h-[100dvh] overflow-hidden m-0 p-0;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: none;
  overscroll-behavior-x: none;
  overscroll-behavior-y: none;
  touch-action: pan-y;
}
input, textarea, select {
  -webkit-user-select: text;
  user-select: text;
  font-size: 16px !important;
}
.overflow-y-auto, .overflow-y-scroll {
  -webkit-overflow-scrolling: touch;
}
```

---

## 5. Application Shell & Routing Architecture

### 5.1 Route Structure (`app.routes.ts`)

**Auth zone** (unauthenticated, protected by `guestGuard`):
- `/login` → `EnterEmailComponent`
- `/mpin` → `MpinFlowComponent`
- `/forgot` → `MpinFlowComponent`
- `/reset` → `MpinFlowComponent`
- `/set-mpin` → `MpinFlowComponent`
- `/confirm-mpin` → `MpinFlowComponent`
- `/onboarding-profile` → `OnboardingProfileComponent`

**App zone** (authenticated, `authGuard` + `onboardedGuard`):
- Layout wrapper with child routes: `/dashboard`, `/expenses`, `/budgets`, `/budgets/:name`, `/friends`, `/splits`, `/splits/group/:id`, `/subscriptions`, `/goals`, `/goals/:id`, `/ledger`, `/ledger/:id`, `/reports`, `/profile`

Each route has a numeric `animationIndex` data property used for slide direction in transitions.

### 5.2 Route Transition Animation

Routes animate with a slide-in-out effect driven by comparing `animationIndex` of current vs. previous route. Applied via `[@routeAnimations]` in the template.

### 5.3 Splash Screen

On app start, a full-screen black splash screen is shown:

```html
@if (!appInitService.isReady()) {
  <div @fadeOut class="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center">
    <h1 class="text-[2.75rem] font-black tracking-tighter uppercase text-white animate-pulse">AppName</h1>
    <p class="text-xs font-bold tracking-widest text-gray-400 uppercase">{{ randomQuote() }}</p>
    <div class="w-24 h-1 bg-gray-800 overflow-hidden">
      <div class="h-full w-1/3 bg-white" style="animation: slideRight 1.2s ease-in-out infinite;"></div>
    </div>
  </div>
}
```

`AppInitService` enforces a minimum 1500ms display time for a polished feel.

---

## 6. Layout Shell (`core/layout/layout.component.ts`)

### 6.1 Fixed Top Header
- Height: `h-14`, `fixed top-0 w-full z-30`
- Background: dynamically themed to the active module's primary color
- Left: Hamburger (or back chevron for sub-pages)
- Center: Dynamic page title
- Right: Context-sensitive edit button (group/budget/goal/ledger detail pages)

### 6.2 Left Sidebar Drawer
- `w-64`, slides in from left with `transition-transform duration-300 ease-in-out`
- All nav items + app version + "Check for update" + Logout buttons
- Backdrop `bg-black/40` closes it when tapped

### 6.3 Bottom Navigation Bar
- `fixed left-4 right-4 bg-white border-2 border-black z-30`
- `bottom: 1.5rem` — floats 24px above screen edge
- User's configurable quick-actions (4 items), icon-only, `h-16`
- Hidden on Profile page

### 6.4 Global Floating Action Button (FAB)
- `fixed right-4 w-14 h-14 rounded-none z-40`, `bottom: 6.5rem`
- Color inherits active module's theme color
- Hidden on Dashboard, Profile, Reports pages
- Context-sensitive: opens the correct bottom sheet for the active module

### 6.5 Global Sheets & Toast (mounted once in Layout)

All sheets are mounted once at Layout level and toggled via service signals:
`app-bottom-sheet`, `app-budget-sheet`, `app-confirm-sheet`, `app-friend-sheet`, `app-split-sheet`, `app-group-sheet`, `app-month-picker`, `app-quick-actions-sheet`, `app-subscription-sheet`, `app-goal-sheet`, `app-add-funds-sheet`, `app-ledger-sheet`, `app-ledger-sub-sheet`, `app-toast`

---

## 7. UI Component Library (Shared UI)

All shared components live in `src/app/shared/ui/`.

### 7.1 Bottom Sheets (The Primary Interaction Pattern)

Every "create/edit" action uses a bottom sheet, **not a full-page route**. This is the single most important UX pattern.

**Animation:**
```typescript
trigger('slideUp', [
  transition(':enter', [
    style({ transform: 'translateY(100%)' }),
    animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('300ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' })),
  ]),
])
```

**Structure:**
```
backdrop:  fixed inset-0  bg-black/60  backdrop-blur-sm  z-[60]
container: fixed bottom-0 left-0 right-0  bg-black  z-[70]  max-h-[95vh]  overflow-y-auto
  header:  bg-{module}-primary  text-white  sticky top-[-2px]  z-10
  body:    black background, white/gray inputs
```

**Swipe-to-close**: The `appSwipeToClose` directive implements swipe-down to close with rubber-band resistance and smart scroll detection.

### 7.2 Form Input Styling

**Inside dark bottom sheets:**
```
bg-gray-100 text-white border-b border-gray-600
```

**Auth forms (white background):**
```
bg-gray-50 border-2 border-black text-black font-bold
```

**Error display pattern**: Parent has `pb-6`, error text is `absolute bottom-1 left-1 transition-opacity duration-200` and uses `[class.opacity-0]="!error()"`.

### 7.3 The `appAmountInput` Directive

Applied to all currency inputs:
- Formats with Indian number system commas (`Intl.NumberFormat('en-IN')`) in real time
- Strips non-numeric characters, limits to 2 decimal places
- Preserves cursor position after re-formatting

### 7.4 Toast Notifications

- `fixed top-4 left-0 right-0 z-[9999]`
- Slides down from above on enter, slides up on leave
- Three types: `success` (`#4ade80`), `error` (`#f87171`), `info` (white)
- All have `border-2 border-black rounded-none`
- Auto-dismiss: 3s info/success, 4s errors

### 7.5 Confirm Dialog

`ConfirmService.open({title, message, confirmText, cancelText, onConfirm})` — `ConfirmSheetComponent` mounts globally and reads this state.

### 7.6 PIN Input Component

4 individual digit boxes, auto-advance on input, delete goes back to previous, paste splits across all boxes.

### 7.7 Date Picker

Horizontal scrollable month strip + day grid below. Selected states styled with module primary color.

### 7.8 Haptic Feedback Service

```typescript
selection()    → navigator.vibrate(10)
impactLight()  → navigator.vibrate(15)
impactMedium() → navigator.vibrate(30)
success()      → navigator.vibrate([15, 100, 30])
error()        → navigator.vibrate([50, 50, 50, 50, 50])
```

---

## 8. iOS Keyboard Hack (KeyboardService)

iOS Safari only opens the keyboard in direct user gesture context. Async/await breaks this.

**Solution:** A hidden offscreen input is placed in both `app.html` and `layout.component.ts`:
```html
<input #globalHiddenInput type="text" class="fixed opacity-0 pointer-events-none -z-50 -left-[9999px] -top-[9999px]" />
```

`KeyboardService` stores a reference and exposes:
```typescript
openKeyboardSync() { this.hiddenInput.focus(); }  // Call BEFORE any await
closeKeyboard()    { this.hiddenInput.blur(); }
```

**Pattern:**
```typescript
async onSubmit() {
  if (!valid) return;
  this.keyboardService.openKeyboardSync();  // SYNC — before any await
  const data = await this.apiCall();
}
```

---

## 9. State Management with Angular Signals

Every service uses **Angular Signals exclusively**. No RxJS BehaviorSubjects/Subjects for state.

### Standard service pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureService {
  readonly items = signal<Item[]>([]);
  readonly isLoading = signal(false);
  readonly isBottomSheetOpen = signal(false);
  readonly editingItem = signal<Item | null>(null);

  readonly totalAmount = computed(() => this.items().reduce(...));

  openBottomSheet(item?: Item) {
    this.editingItem.set(item ?? null);
    this.isBottomSheetOpen.set(true);
  }

  closeBottomSheet() {
    this.isBottomSheetOpen.set(false);
    this.editingItem.set(null);
  }

  constructor() {
    effect(() => {
      const user = authService.currentUser();
      if (user) this.fetchItems();
    });
  }
}
```

### AuthService Core Signals:
```typescript
readonly isAuthenticated = signal<boolean>(false);
readonly isOnboarded = signal<boolean>(false);
readonly isInitialized = signal<boolean>(false);
readonly currentUser = signal<User | null>(null);
readonly userProfile = signal<UserProfile>({ ... });
```

---

## 10. Data Architecture (Supabase)

### 10.1 Client Setup

Custom `fetch` wrapper in `supabase.service.ts` logs all API calls as collapsible DevTools groups with color-coded status. Realtime events intercepted via `this.supabase.realtime.logger`.

### 10.2 Data Patterns

- Monthly pagination with in-memory cache: `Map<'YYYY-MM', Item[]>`
- `allExpenses` signal for full in-memory access, `expenses` signal for paginated display
- Data auto-refreshes when `authService.currentUser()` changes (via `effect`)
- Month format: `'YYYY-MM'` strings everywhere

### 10.3 Supabase Table Schema (Conventions)

```
expenses      → { id, title, amount, category, date, goal_id, subscription_id, paid_via }
budgets       → { id, name, amount, spent, user_id }
friends       → { id, user_id, friend_email, name, status }
split_groups  → { id, name, user_id, members }
splits        → { id, group_id, title, amount, paid_by, split_equally }
subscriptions → { id, title, amount, billing_cycle, next_billing_date, category }
goals         → { id, name, target_amount, current_amount, deadline }
ledger        → { id, person_name, type, amount, notes }
profiles      → { id, username, email, full_name, salary, avatar_id }
```

---

## 11. Auth Screen UI (Detailed)

### 11.1 Auth Layout Modes

**Background**: Fully black (`bg-black`).

**Single Box** (email entry):
- `max-w-md w-full bg-white p-8 border-2 border-black`
- Logo, App name, form content

**Double Box** (MPIN/onboarding):
- Top box: logo + motivational quote
- Bottom box: PIN input + action button
- Both boxes bottom-anchored (`justify-end`), with back button top-left

Logo: `w-16 h-16 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-contain bg-white`

### 11.2 Welcome Back Screen

When `localStorage.getItem('lastUser')` exists:
```html
<p class="text-xl font-bold">Welcome back, {Name}!</p>
<p class="text-gray-500 font-medium">{email}</p>
<app-button text="Log in with MPIN"></app-button>
<button class="text-sm text-gray-500 underline">Log in with another account</button>
```

---

## 12. Dashboard UX Patterns

### 12.1 Pull-to-Refresh

Manual touch event tracking (no library). Arrow rotates 180° past threshold, then becomes spinner.

### 12.2 Skeleton Loading

Every section has a shimmer `animate-pulse` skeleton matching the real content layout. No spinners for page-level loads.

### 12.3 Expense Gauge

Semicircle gauge for total monthly spend built with CSS `border-radius: 9999px 9999px 0 0`.

---

## 13. Offline Mode

```typescript
merge(
  fromEvent(window, 'online').pipe(map(() => false)),
  fromEvent(window, 'offline').pipe(map(() => true))
).subscribe(offline => this.isOffline.set(offline));
```

Full-screen overlay shown in `app.html` when `pwaService.isOffline()` is true. Styled as a white screen with black typography and a red pulsing "Waiting for connection..." badge.

---

## 14. Reports & Charts

Chart.js v4 via `<canvas>` in `AfterViewInit`. Destroyed and re-created on month filter change. Multi-color gradient for Reports module:

```css
.bg-reports-mix {
  background: linear-gradient(to right, #10B981, #06B6D4, #F59E0B, #8B5CF6, #EF4444);
}
.text-reports-mix {
  background: linear-gradient(to right, #10B981, #06B6D4, #F59E0B, #8B5CF6, #EF4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 15. User Profile & Customization

### Avatar System
DiceBear API, 15 preset avatars, stored as `avatar_id` (1–15) in Supabase user metadata.

### Configurable Quick Actions
Bottom nav 4 items are user-selectable. Stored as `user_metadata.quick_actions: string[]`. `QuickActionsService` filters `navItems` against this preference.

### Mask Values
`user_metadata.mask_values: true` hides all monetary values app-wide (`***`).

---

## 16. Key Engineering Patterns Summary

| Pattern | Implementation |
|---|---|
| All state via Signals | No BehaviorSubject/Subject for state |
| All components Standalone | No NgModules |
| ChangeDetectionStrategy.Eager | On all components |
| Lazy loading | Every route uses `loadComponent(() => import(...))` |
| Service-driven sheet state | Services own `isBottomSheetOpen` signals |
| Global sheet mounting | All sheets mounted once in `Layout` |
| Module color theming | Header/FAB change color based on active route |
| Indian number formatting | `Intl.NumberFormat('en-IN')` via `AmountInputDirective` |
| Monthly data caching | `Map<'YYYY-MM', Item[]>` to avoid re-fetching |
| iOS keyboard hack | Hidden offscreen input, focused synchronously before async |
| Touch-native sheets | Swipe-to-close directive with rubber-band physics |
| Haptic feedback | `navigator.vibrate()` for all important interactions |
| Pull-to-refresh | Manual touch event tracking on Dashboard |
| Offline detection | `fromEvent(window, 'online'/'offline')` via RxJS merge |

---

## 17. File & Folder Conventions

```
src/app/
  app.component.ts         ← Root: splash, offline overlay, route animations
  app.html                 ← router-outlet + global overlays only
  app.routes.ts            ← All routes, lazy-loaded
  app.config.ts            ← provideRouter, provideAnimations, provideServiceWorker

  core/
    animations/            ← route-animations.ts
    guards/                ← auth.guard, guest.guard, onboarded.guard
    resolvers/             ← user.resolver
    layout/                ← layout.component.ts (app shell)
    services/              ← All singleton services

  features/
    auth/login/
      components/          ← auth-layout, enter-email, mpin-flow, onboarding-profile
      login-state.service.ts
    dashboard/
    expenses/
    budgets/
    friends/
    splits/
    subscriptions/
    goals/
    ledger/
    reports/
    profile/

  shared/ui/
    button/
    bottom-sheet/
    budget-sheet/ friend-sheet/ split-sheet/ group-sheet/
    subscription-sheet/ goal-sheet/ add-funds-sheet/
    ledger-sheet/ ledger-sub-sheet/ confirm-sheet/
    toast/ month-picker/ day-picker/ date-picker/ pin-input/
    quick-actions-sheet/
    amount-input.directive.ts
    autofocus.directive.ts
    safe-input.directive.ts
    swipe-to-close.directive.ts
```

---

## 18. Critical Rules for Recreation

1. **Never use `border-radius`** — `rounded-none` everywhere on cards, inputs, buttons, sheets.
2. **All borders are `border-2 border-black`** on form elements, cards, and sheets.
3. **Primary button is always dark forest green** (`#1a2e22`). Module colors only in headers, FABs, sheet headers.
4. **Font must be Poppins**, all weights 300–900 loaded in `index.html`.
5. **All inputs font-size ≥ 16px** — non-negotiable for iOS.
6. **Bottom sheets use `slideUp` animation** with cubic-bezier `0.32, 0.72, 0, 1`.
7. **Sheet headers are the module's primary color**.
8. **All services are `providedIn: 'root'`** — singleton only.
9. **No page-level modals**. All modals in shared UI, mounted globally in `Layout`.
10. **Call `keyboardService.openKeyboardSync()` SYNCHRONOUSLY** before any `await` that will need keyboard.
11. **Loading states = shimmer skeletons** (`animate-pulse`), not spinners.
12. **Bottom nav items are icon-only**. Labels only in sidebar.
13. **Header title updates dynamically** (e.g., shows group name on group detail page).
14. **All money uses Indian formatting** (`1,00,000` not `100,000`).
15. **Haptic feedback** on all add, delete, and confirm actions.
