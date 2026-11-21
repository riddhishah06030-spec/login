import { getLocationById, type PharmacyLocation } from "./locations";

/** Roles from Requirement §6 — User, Role & Permission Management */
export type PharmacyRole =
  | "Pharmacy owner"
  | "Pharmacy manager"
  | "Pharmacist"
  | "Pharmacy technician"
  | "Pharmacy assistant"
  | "Data-entry staff"
  | "Inventory manager"
  | "Delivery staff"
  | "System administrator"
  | "Auditor"
  | "Patient";

export type DemoUser = {
  username: string;
  password: string;
  role: PharmacyRole;
  displayName: string;
};

export type AuthProvider = "google" | "microsoft" | "password";

export type AuthSession = {
  username: string;
  displayName: string;
  role: PharmacyRole;
  locationId: string;
  locationName: string;
  locationCity: string;
  provider?: AuthProvider;
};

export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: DemoUser[] = [
  {
    username: "owner",
    password: DEMO_PASSWORD,
    role: "Pharmacy owner",
    displayName: "Alex Owner",
  },
  {
    username: "manager",
    password: DEMO_PASSWORD,
    role: "Pharmacy manager",
    displayName: "Morgan Manager",
  },
  {
    username: "pharmacist",
    password: DEMO_PASSWORD,
    role: "Pharmacist",
    displayName: "Priya Pharmacist",
  },
  {
    username: "technician",
    password: DEMO_PASSWORD,
    role: "Pharmacy technician",
    displayName: "Taylor Technician",
  },
  {
    username: "assistant",
    password: DEMO_PASSWORD,
    role: "Pharmacy assistant",
    displayName: "Avery Assistant",
  },
  {
    username: "dataentry",
    password: DEMO_PASSWORD,
    role: "Data-entry staff",
    displayName: "Dana Data-entry",
  },
  {
    username: "inventory",
    password: DEMO_PASSWORD,
    role: "Inventory manager",
    displayName: "Ivan Inventory",
  },
  {
    username: "delivery",
    password: DEMO_PASSWORD,
    role: "Delivery staff",
    displayName: "Devon Delivery",
  },
  {
    username: "admin",
    password: DEMO_PASSWORD,
    role: "System administrator",
    displayName: "Sam Admin",
  },
  {
    username: "auditor",
    password: DEMO_PASSWORD,
    role: "Auditor",
    displayName: "Riley Auditor",
  },
];

const SESSION_KEY = "pms.auth.session";
const REMEMBER_KEY = "pms.auth.rememberUsername";
const PASSWORD_OVERRIDES_KEY = "pms.auth.passwordOverrides";
const REGISTERED_ACCOUNTS_KEY = "pms.auth.registeredAccounts";

export type AuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

type RegisteredAccount = {
  password: string;
  displayName: string;
};

function getPasswordOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PASSWORD_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function getRegisteredAccounts(): Record<string, RegisteredAccount> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    const accounts = raw ? (JSON.parse(raw) as Record<string, RegisteredAccount>) : {};

    // Migrate older create-account passwords that lived in passwordOverrides.
    const overrides = getPasswordOverrides();
    let migrated = false;
    for (const [username, password] of Object.entries(overrides)) {
      if (findDemoUser(username) || accounts[username]) continue;
      accounts[username] = {
        password,
        displayName: titleCaseUsername(username),
      };
      migrated = true;
    }
    if (migrated) {
      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    return accounts;
  } catch {
    return {};
  }
}

function saveRegisteredAccounts(accounts: Record<string, RegisteredAccount>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getEffectivePassword(user: DemoUser): string {
  const overrides = getPasswordOverrides();
  return overrides[user.username] ?? user.password;
}

export function findDemoUser(username: string): DemoUser | undefined {
  const normalized = username.trim().toLowerCase();
  return DEMO_USERS.find((entry) => entry.username === normalized);
}

export function findRegisteredAccount(username: string): RegisteredAccount | undefined {
  const normalized = username.trim().toLowerCase();
  return getRegisteredAccounts()[normalized];
}

export function resetDemoPassword(
  username: string,
  newPassword: string,
): { ok: true } | { ok: false; error: string } {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: "Enter your username." };
  }
  if (newPassword.trim().length > 8) {
    return { ok: false, error: "Password can be up to 8 characters." };
  }
  if (typeof window === "undefined") {
    return { ok: false, error: "Password reset is only available in the browser." };
  }

  const demoUser = findDemoUser(normalized);
  const accounts = getRegisteredAccounts();
  const registered = accounts[normalized];

  if (!demoUser && !registered) {
    return { ok: false, error: "No account found. Create an account first." };
  }

  if (demoUser) {
    const overrides = getPasswordOverrides();
    overrides[demoUser.username] = newPassword;
    localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
    return { ok: true };
  }

  accounts[normalized] = {
    password: newPassword,
    displayName: registered.displayName,
  };
  saveRegisteredAccounts(accounts);
  return { ok: true };
}

function titleCaseUsername(username: string): string {
  return username
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function createAccount(
  username: string,
  password: string,
  locationId: string,
  displayName?: string,
): AuthResult {
  const normalized = username.trim().toLowerCase();
  const location = getLocationById(locationId);
  const trimmedName = displayName?.trim();

  if (!normalized || !password || !locationId) {
    return { ok: false, error: "Name, email/username, and password are required." };
  }

  if (password.trim().length > 8) {
    return { ok: false, error: "Password can be up to 8 characters." };
  }

  if (!location) {
    return { ok: false, error: "Select a valid pharmacy location." };
  }

  if (findDemoUser(normalized)) {
    return { ok: false, error: "That username is already taken. Try signing in instead." };
  }

  const accounts = getRegisteredAccounts();
  if (accounts[normalized]) {
    return { ok: false, error: "An account with this email or username already exists." };
  }

  const resolvedName = trimmedName || titleCaseUsername(normalized);
  accounts[normalized] = {
    password,
    displayName: resolvedName,
  };
  saveRegisteredAccounts(accounts);

  return {
    ok: true,
    session: {
      username: normalized,
      displayName: resolvedName,
      role: "Patient",
      locationId: location.id,
      locationName: location.name,
      locationCity: location.city,
      provider: "password",
    },
  };
}

export function authenticate(
  username: string,
  password: string,
  locationId: string,
): AuthResult {
  const normalized = username.trim().toLowerCase();
  const user = DEMO_USERS.find((entry) => entry.username === normalized);
  const location: PharmacyLocation | undefined = getLocationById(locationId);
  const registered = findRegisteredAccount(normalized);

  if (!normalized || !password || !locationId) {
    return { ok: false, error: "Username and password are required." };
  }

  if (password.trim().length > 8) {
    return { ok: false, error: "Password can be up to 8 characters." };
  }

  if (!location) {
    return { ok: false, error: "Select a valid pharmacy location." };
  }

  if (user) {
    if (getEffectivePassword(user) !== password) {
      return { ok: false, error: "Invalid credentials." };
    }
    return {
      ok: true,
      session: {
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        locationId: location.id,
        locationName: location.name,
        locationCity: location.city,
      },
    };
  }

  if (!registered) {
    return { ok: false, error: "No account found. Create an account first." };
  }

  if (registered.password !== password) {
    return { ok: false, error: "Invalid credentials." };
  }

  return {
    ok: true,
    session: {
      username: normalized,
      displayName: registered.displayName,
      role: "Patient",
      locationId: location.id,
      locationName: location.name,
      locationCity: location.city,
      provider: "password",
    },
  };
}

export function signInWithProvider(
  provider: Exclude<AuthProvider, "password">,
  locationId: string,
  profile?: { email: string; name: string },
): AuthResult {
  const location = getLocationById(locationId);
  if (!location) {
    return { ok: false, error: "Select a valid pharmacy location." };
  }

  if (provider === "google") {
    if (!profile?.email) {
      return { ok: false, error: "Google email permission is required to continue." };
    }
    return {
      ok: true,
      session: {
        username: profile.email.toLowerCase(),
        displayName: profile.name || profile.email,
        role: "Patient",
        locationId: location.id,
        locationName: location.name,
        locationCity: location.city,
        provider: "google",
      },
    };
  }

  return {
    ok: true,
    session: {
      username: "patient.microsoft",
      displayName: "Microsoft Patient",
      role: "Patient",
      locationId: location.id,
      locationName: location.name,
      locationCity: location.city,
      provider: "microsoft",
    },
  };
}

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

const SKIP_SPLASH_KEY = "pms.auth.skipSplash";

/** After logout, skip the login splash so the transition doesn't flash CapsyShow. */
export function markSkipSplash(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SKIP_SPLASH_KEY, "1");
}

export function consumeSkipSplash(): boolean {
  if (typeof window === "undefined") return false;
  const skip = sessionStorage.getItem(SKIP_SPLASH_KEY) === "1";
  if (skip) sessionStorage.removeItem(SKIP_SPLASH_KEY);
  return skip;
}

export function saveRememberedUsername(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_KEY, username);
}

export function getRememberedUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REMEMBER_KEY) ?? "";
}

export function clearRememberedUsername(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REMEMBER_KEY);
}
