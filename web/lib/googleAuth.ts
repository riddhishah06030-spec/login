export type GoogleProfile = {
  email: string;
  name: string;
  picture?: string;
  sub: string;
};

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

type GoogleAccountsOauth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
    error_callback?: (error: { type?: string; message?: string }) => void;
  }) => TokenClient;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOauth2;
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPES = "openid email profile";

let scriptPromise: Promise<void> | null = null;

function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
}

export function isGoogleSignInConfigured(): boolean {
  return getGoogleClientId().length > 0;
}

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Could not read Google email permissions.");
  }
  const data = (await response.json()) as {
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
  };
  if (!data.email || !data.sub) {
    throw new Error("Google did not share an email. Allow email permission and try again.");
  }
  return {
    email: data.email,
    name: data.name?.trim() || data.email.split("@")[0] || "Google User",
    picture: data.picture,
    sub: data.sub,
  };
}

async function continueWithGoogleOAuth(): Promise<GoogleProfile> {
  const clientId = getGoogleClientId();
  await loadGoogleScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error("Google sign-in failed to initialize.");
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Google permission was cancelled.",
            ),
          );
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message || "Google sign-in was closed."));
      },
    });

    client.requestAccessToken({ prompt: "select_account consent" });
  });

  return fetchGoogleProfile(accessToken);
}

/**
 * Opens Google account + email permission when Client ID is configured.
 * Callers should show an email permission sheet when this returns null config.
 */
export async function continueWithGoogle(): Promise<GoogleProfile> {
  if (!isGoogleSignInConfigured()) {
    throw new Error("GOOGLE_SHEET_REQUIRED");
  }
  return continueWithGoogleOAuth();
}

export function profileFromGoogleEmail(email: string): GoogleProfile {
  const normalized = email.trim().toLowerCase();
  const local = normalized.split("@")[0] || "user";
  const name = local
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    email: normalized,
    name: name || "Google User",
    sub: `local-google:${normalized}`,
  };
}

export function isValidGoogleEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
