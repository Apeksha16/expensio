# Google OAuth Setup

## Native Google Sign-In (Recommended)

The app uses **@react-native-google-signin/google-signin**, which works for both developers and real users:

- **Developers:** Run `expo run:ios` or `expo run:android` (development build). Do not use Expo Go — the native module requires a dev build.
- **Real users:** Same native flow in the production app from the store.
- **Web:** Uses Google Identity Services (mock) — add `http://localhost:8081` and your production domain to the Web client's Authorized redirect URIs.

### Google Cloud Console Setup

1. **iOS client** (`com.techvriksha.expensio.pranav`): Already configured. Uses bundle ID and URL scheme — no redirect URI needed.
2. **Web client** (for web build): Add `http://localhost:8081`, `http://localhost:5173`, and `https://expensio-io.firebaseapp.com` to Authorized redirect URIs.
3. **Test users:** If OAuth consent is in Testing mode, add all developers and testers in **APIs & Services** → **OAuth consent screen** → **Test users**.

### Running the App

```sh
# Native (iOS/Android) - required for Google Sign-In
expo run:ios
expo run:android

# Web
expo start --web
```

### First-Time Setup

After adding the config plugin, run:

```sh
npx expo prebuild --clean
npx expo run:ios
```
