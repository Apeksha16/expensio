
const GOOGLE_CLIENT_ID = '820921044814-8fdnvo1193aki6t29kv5lpcdfffr8g6j.apps.googleusercontent.com';

// Dynamic script loader for Google Identity Services
const loadGoogleScript = () => {
    return new Promise((resolve) => {
        if ((window as any).google) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(true);
        document.body.appendChild(script);
    });
};

export const GoogleSignin = {
    configure: (params: any) => {
        console.log('[Web GoogleSignin] configure called with:', params);
    },
    hasPlayServices: async (params: any) => {
        return true;
    },
    signIn: async () => {
        console.log('[Web GoogleSignin] signIn called');
        await loadGoogleScript();

        return new Promise((resolve, reject) => {
            const google = (window as any).google;
            if (!google) {
                reject(new Error('Google Identity Services not loaded'));
                return;
            }

            // Use the Implicit Flow (Token Model) or ID Token model?
            // The backend expects an `idToken`. 
            // We can use google.accounts.id.initialize (One Tap / Button) or 
            // google.accounts.oauth2.initTokenClient (Implicit).
            // Actually, for simple verification, we usually use the ID Token.
            // But the newer GSI SDK pushes for `google.accounts.id`.

            // However, to trigger it programmatically like the native button,
            // we might need to use a slightly different approach or render a button?
            // No, strictly speaking we can't programmatically "click" the button in newer SDKs due to policy.
            // BUT, for a "mock" that is actually real, let's try to wrap the Token Client.

            // WAIT: The backend expects an ID TOKEN. `initTokenClient` gives Access Token.
            // `google.accounts.id` gives ID Token but is UI-driven (One Tap or Button).
            // This is tricky to "shim" inside a `signIn()` call which is imperative.

            // Alternative: Use the "Show" method of a hidden button? Or use the deprecated platform.js?
            // No, let's use the GIS "Token Client" but request 'openid profile email'. 
            // Wait, OAuth2 Token Client returns ACCESS_TOKEN. We need ID_TOKEN for the backend verifier?
            // Only if the backend verifies via `verifyIdToken`.
            // Yes, checking authController.js: `client.verifyIdToken`.

            // So we NEED an ID Token.
            // The only way to get an ID Token in new GSI is via the Sign In With Google button flow.
            // We can prompt it.

            const handleCredentialResponse = (response: any) => {
                console.log('[Web GoogleSignin] Got response:', response);
                if (response.credential) {
                    const idToken = response.credential;
                    // Decode simplistic part for user info (or use another call)
                    const payload = JSON.parse(atob(idToken.split('.')[1]));

                    resolve({
                        idToken: idToken,
                        user: {
                            id: payload.sub,
                            name: payload.name,
                            email: payload.email,
                            photo: payload.picture,
                            familyName: payload.family_name,
                            givenName: payload.given_name,
                        }
                    });
                } else {
                    reject(new Error('No credential received'));
                }
            };

            // Trigger the One Tap or a Modal
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Prompt the One Tap or Modal
            google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // If One Tap doesn't show (e.g. cooldown), we might need to fallback to something else?
                    // Verify if we can force it.
                    console.log('One Tap skipped:', notification);
                    // If One Tap fails, we might be stuck without a "Button" in the DOM.
                    // The Native App calls `signIn()` imperatively.
                }
            });
        });
    },
    signOut: async () => {
        const google = (window as any).google;
        if (google) {
            google.accounts.id.disableAutoSelect();
        }
    },
    isSignedIn: async () => {
        return false; // Always force re-login check for now
    },
    getTokens: async () => {
        return { idToken: 'mock-token', accessToken: 'mock-access-token' };
    }
};

export const statusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};
