/**
 * Google Identity Services (GIS) Authentication Module
 * Replaces Firebase Auth with direct Google OAuth using the project's client ID.
 *
 * Client ID: 519455927329-bggpmqcubrc7a2r98p27129jo49q8lqk.apps.googleusercontent.com
 * Project:    modular-magpie-443511-m7
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              type?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number;
            }
          ) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (override?: { prompt?: string }) => void };
        };
      };
    };
  }
}

export const GOOGLE_CLIENT_ID = '519455927329-bggpmqcubrc7a2r98p27129jo49q8lqk.apps.googleusercontent.com';
export const GOOGLE_PROJECT_ID = 'modular-magpie-443511-m7';
export const SPREADSHEET_ID = '1q1qzuk-gzjyZ_hTJSvJq-QKlcnt1HAHJaRnV0gc73y8';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
}

interface GoogleCredentialResponse {
  credential: string;
}

function parseJwt(token: string): { sub: string; email: string; name: string; picture: string; given_name: string; family_name: string; email_verified: boolean; exp: number; iat: number } {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

let googleToken: string | null = null;
let googleUser: GoogleUser | null = null;

export function getGoogleToken(): string | null {
  return googleToken;
}

export function getGoogleUser(): GoogleUser | null {
  return googleUser;
}

export function isGoogleAuthLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.accounts?.id;
}

function waitForGoogleGIS(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleAuthLoaded()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const check = setInterval(() => {
      if (isGoogleAuthLoaded()) {
        clearInterval(check);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(check);
        reject(new Error('Google Identity Services failed to load'));
      }
    }, 100);
  });
}

export async function initializeGoogleAuth(
  onUserSignedIn: (user: GoogleUser, token: string) => void
): Promise<void> {
  await waitForGoogleGIS();

  window.google!.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: GoogleCredentialResponse) => {
      try {
        const payload = parseJwt(response.credential);
        googleToken = response.credential;
        googleUser = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          given_name: payload.given_name,
          family_name: payload.family_name,
          email_verified: payload.email_verified,
        };
        // Persist session
        try {
          localStorage.setItem('farmer_parts_google_user', JSON.stringify(googleUser));
          localStorage.setItem('farmer_parts_google_token', response.credential);
        } catch {}
        onUserSignedIn(googleUser, response.credential);
      } catch (err) {
        console.error('Error parsing Google credential:', err);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}

export function renderGoogleButton(parent: HTMLElement): void {
  if (!isGoogleAuthLoaded()) return;

  window.google!.accounts.id.renderButton(parent, {
    theme: 'outline',
    size: 'large',
    type: 'standard',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: 380,
  });
}

export async function promptGoogleLogin(): Promise<void> {
  await waitForGoogleGIS();
  try {
    window.google!.accounts.id.prompt();
  } catch (err) {
    console.warn('Google prompt not available, falling back to render button:', err);
  }
}

export function getStoredGoogleUser(): GoogleUser | null {
  try {
    const saved = localStorage.getItem('farmer_parts_google_user');
    if (saved) {
      const user = JSON.parse(saved);
      // Verify token hasn't expired
      const token = localStorage.getItem('farmer_parts_google_token');
      if (token) {
        const payload = parseJwt(token);
        if (payload.exp * 1000 < Date.now()) {
          // Token expired
          clearGoogleSession();
          return null;
        }
      }
      return user;
    }
  } catch {}
  return null;
}

export function clearGoogleSession(): void {
  googleToken = null;
  googleUser = null;
  try {
    localStorage.removeItem('farmer_parts_google_user');
    localStorage.removeItem('farmer_parts_google_token');
  } catch {}
  // Disable GIS session
  if (isGoogleAuthLoaded()) {
    try {
      window.google!.accounts.id.disableAutoSelect();
    } catch {}
  }
}
