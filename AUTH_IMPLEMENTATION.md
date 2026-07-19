# Authentication Flow Implementation

This document details how the custom MPIN-based user authentication, signup, and forgot-password flows are implemented in the Expensio application using **Supabase** and **Angular 22**.

## 1. High-Level Architecture
Expensio uses Supabase as its authentication backend. However, instead of standard passwords, the application uses a **4-digit MPIN** to provide a fast, mobile-friendly login experience (similar to banking or fintech apps). 

Because Supabase requires passwords to be at least 6 characters long by default, the app uses a cryptographic padding mechanism:
```typescript
// In supabase.service.ts
private padMpin(mpin: string): string {
  return mpin ? mpin + '-expensio-secure' : mpin;
}
```
Every 4-digit MPIN is appended with `-expensio-secure` behind the scenes before interacting with the Supabase Auth API.

---

## 2. Component Breakdown & Flow

### A. Initial Entry (`enter-email.component.ts`)
When a user opens the app and is unauthenticated, they land on the email/username entry screen.

1. **Local Storage Cache**: The app checks `localStorage.getItem('lastUser')`. If a user recently logged in, it shows a "Welcome back, {Name}" screen, allowing them to jump straight to the MPIN entry.
2. **Username / Email Resolution**: 
   - The user can type either an email or a username.
   - If they enter a username (no `@` symbol), the component calls a Supabase RPC function (`get_email_by_username`) to resolve the username into the actual registered email.
3. **Routing Decision**: 
   - The app checks if the email exists using `supabaseService.checkEmailExists(email)`.
   - **Exists**: Routes to `/mpin` (Login flow).
   - **Does not exist**: Routes to `/set-mpin` (Signup flow).

---

### B. Signup Flow (`/set-mpin` → `/confirm-mpin` → `/onboarding-profile`)
Handled by `mpin-flow.component.ts` and `onboarding-profile.component.ts`.

1. **Set MPIN**: The user enters a new 4-digit MPIN.
2. **Confirm MPIN**: The user re-enters the MPIN. The component verifies that they match.
3. **Onboarding Profile**: The user provides their `Name`, `Username`, `Salary`, and selects an Avatar.
4. **Account Creation**: The app calls `signUpWithMpin` in `supabase.service.ts`:
   - It pads the MPIN.
   - It calls `supabase.auth.signUp()`, attaching the onboarding data (name, username, salary, avatar ID, etc.) into the `options.data` (Supabase user metadata).

---

### C. Login Flow (`/mpin`)
Handled by `mpin-flow.component.ts`.

1. **Pre-Login Check**: Before attempting login, it calls an RPC `preLoginCheck` to see if the account is temporarily locked (e.g., due to too many failed attempts).
2. **Authentication**: It takes the 4-digit MPIN, pads it, and calls `supabase.auth.signInWithPassword()`.
3. **Rate Limiting / Lockout**:
   - If login fails, a `recordFailedLogin` RPC is triggered.
   - After 3 consecutive failed attempts, the user is locked out for a period of time to prevent brute-force attacks.
4. **Success**: If successful, `reset_failed_login` is called to clear the failure counter, and the user is redirected to the `/dashboard`.

---

### D. Forgot MPIN & Reset Flow (`/forgot` → `/reset`)
Since the user cannot log in, they cannot use the standard authenticated `updateUser` API to change their password. Expensio uses a custom OTP (One Time Password) approach combined with Postgres RPCs (Remote Procedure Calls).

1. **Initiate Request**: The user clicks "Forgot MPIN?". The app calls the RPC `generate_mpin_reset_otp(email)`.
2. **Email Delivery**: 
   - A 4-digit OTP is generated on the Supabase database.
   - The app uses **EmailJS** (`@emailjs/browser`) to dispatch an email template containing the OTP code to the user's email address.
3. **Verification (`/forgot`)**: The user enters the OTP they received in their email. The app verifies it via the RPC `verify_mpin_reset_otp`.
4. **Resetting the MPIN (`/reset`)**: 
   - The user enters a new 4-digit MPIN twice.
   - The app calls the RPC `reset_custom_mpin(email, code, new_padded_mpin)`.
   - This RPC uses a Postgres `SECURITY DEFINER` context to safely bypass Row Level Security (RLS) and update the user's password directly in Supabase's `auth.users` table, since the user is not currently authenticated.
   - After a successful reset, the app automatically logs the user in with the new MPIN.

---

## 3. Session Management & Reactivity (`auth.service.ts`)
The `AuthService` handles keeping the UI perfectly in sync with the Supabase session state.

1. **Global Auth Listener**: In its constructor, it subscribes to `supabase.auth.onAuthStateChange()`.
2. **Signals**: It uses Angular 22 Signals (`isAuthenticated`, `currentUser`, `userProfile`) to provide a reactive state throughout the application without RxJS observables.
3. **Metadata Mapping**: When a session is detected, it automatically pulls the user's custom fields (salary, avatar_id, quick_actions) from `session.user.user_metadata` and maps it to a strongly typed `userProfile` signal.
4. **Auth Guards / Redirection**: Inside the listener, if the user logs in while on an auth route (like `/login`), it forcefully redirects them to the `/dashboard`. If they log out, it boots them back to `/login`.

---

## 4. Security Enhancements Summary
- **Padding MPINs**: Bypasses the 6-character Supabase limit while adding entropy to the stored password hash.
- **Failed Login Lockouts**: Custom RPCs track failed attempts and enforce time-based lockouts to prevent MPIN guessing (brute force).
- **Secure Reset**: Password resets don't rely on magic links that could be intercepted; they rely on a custom generated OTP verified by secure backend RPCs.
- **Client-Side Cache**: LocalStorage is only used to store non-sensitive display info (Name, Avatar) for the "Welcome Back" screen. No tokens or MPINs are cached manually (Supabase SDK handles session tokens securely).
