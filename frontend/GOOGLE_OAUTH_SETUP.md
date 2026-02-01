# Google OAuth Setup for Multi-Developer Use

## Why It Works on One Device But Not Others

When running with **Expo Go** (`npm start` + scan QR / open in simulator), the OAuth redirect URI is based on your machine's IP: `exp://192.168.x.x:8081`. This URI is different for each developer and changes when your IP changes. Google OAuth only allows URIs you explicitly add in the Google Cloud Console, so other developers see "Access blocked: Authorization Error 400: invalid_request".

## Fix Applied in Code

The app now uses `preferLocalhost: true` in the Google auth config, so on the **iOS Simulator** the redirect URI becomes `exp://localhost:8081` — the same for every developer.

## What You Need to Do

### 1. Add Redirect URIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the Expensio project)
3. Navigate to **APIs & Services** → **Credentials**
4. Open your **OAuth 2.0 Client ID** (Web application type, used for the webClientId)
5. Under **Authorized redirect URIs**, add:
   - `exp://localhost:8081` (for Expo Go on iOS Simulator)
   - `exp://localhost:8081/` (if the app uses a trailing path)
   - `exp://127.0.0.1:8081` (fallback)
6. Save

### 2. Add Test Users (if app is in Testing mode)

If your OAuth consent screen is in **Testing** mode, add each developer's Google account as a **Test user** in:
- **APIs & Services** → **OAuth consent screen** → **Test users** → Add users

### 3. Physical Device / Expo Go on Real Device

On a physical device with Expo Go, the redirect still uses your dev machine's IP (`exp://YOUR_IP:8081`). Options:

- **Option A:** Add your `exp://YOUR_IP:8081` to Authorized redirect URIs (each developer adds their own)
- **Option B:** Use a **development build** (`expo run:ios` or `expo run:android`) — the app will use a stable native scheme (e.g. `com.techvriksha.expensio.pranav:/oauthredirect`) that you add once to Google Console
