"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthSession, clearSession, getSession } from "@/lib/auth";
import styles from "./dashboard.module.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", active: true },
  { id: "setup", label: "Pharmacy Setup", hasChildren: true },
  { id: "locations", label: "Locations" },
  { id: "users", label: "Users & Roles" },
  { id: "inventory", label: "Inventory" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "claims", label: "Claims & Billing" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
] as const;

const WIZARD_STEPS = [
  { id: 1, label: "Pharmacy Info", title: "Pharmacy Information", icon: "building" },
  { id: 2, label: "Regulatory Info", title: "Regulatory Information", icon: "shield" },
  { id: 3, label: "Location & Time", title: "Location & Time Settings", icon: "globe" },
  { id: 4, label: "Operations", title: "Operating Hours", icon: "clock" },
  { id: 5, label: "Pickup & Delivery", title: "Pickup & Delivery", icon: "truck" },
  { id: 6, label: "Notifications", title: "Notification Configuration", icon: "bell" },
  { id: 7, label: "Multi-Location", title: "Multi-Location Setup", icon: "pin" },
] as const;

const MULTI_LOCATION_OPTIONS = [
  {
    id: "transfers",
    title: "Inter-Store Transfers",
    icon: "transfers",
  },
  {
    id: "pricing",
    title: "Location-Specific Pricing",
    icon: "pricing",
  },
  {
    id: "patients",
    title: "Shared Patient Records",
    icon: "patients",
  },
] as const;

type PharmacyLocationItem = {
  id: string;
  name: string;
  place: string;
  status: string;
};

const DEFAULT_LOCATIONS: PharmacyLocationItem[] = [
  { id: "main", name: "Main Store", place: "Toronto, ON", status: "Active" },
  { id: "west", name: "West Location", place: "Vancouver, BC", status: "Active" },
];

const NOTIFICATION_OPTIONS = [
  {
    id: "email",
    title: "Email Notifications",
    description: "Order, alerts, system",
    icon: "email",
  },
  {
    id: "sms",
    title: "SMS Notifications",
    description: "Order, delivery updates",
    icon: "sms",
  },
  {
    id: "prescription",
    title: "Prescription Notifications",
    description: "New, refill, ready",
    icon: "prescription",
  },
  {
    id: "refill",
    title: "Refill Reminders",
    description: "Automatic reminders",
    icon: "refill",
  },
  {
    id: "order",
    title: "Order Notifications",
    description: "Status updates",
    icon: "order",
  },
] as const;

const TIME_ZONES = [
  "Eastern Time (ET)",
  "Central Time (CT)",
  "Mountain Time (MT)",
  "Pacific Time (PT)",
  "Atlantic Time (AT)",
  "Newfoundland Time (NT)",
];

const CURRENCIES = [
  "CAD (Canadian Dollar)",
  "USD (US Dollar)",
];

const PROVINCES = [
  "Ontario",
  "British Columbia",
  "Alberta",
  "Quebec",
  "Manitoba",
  "Saskatchewan",
  "Nova Scotia",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Prince Edward Island",
];

const REGISTRATION_TYPES = [
  "College of Pharmacists Registration",
  "Provincial License",
  "NAPRA Membership",
  "Other Professional Registration",
];

const OPERATING_HOURS = [
  { day: "Monday", hours: "9:00 AM - 9:00 PM", closed: false },
  { day: "Tuesday", hours: "9:00 AM - 9:00 PM", closed: false },
  { day: "Wednesday", hours: "9:00 AM - 9:00 PM", closed: false },
  { day: "Thursday", hours: "9:00 AM - 9:00 PM", closed: false },
  { day: "Friday", hours: "9:00 AM - 9:00 PM", closed: false },
  { day: "Saturday", hours: "9:00 AM - 6:00 PM", closed: false },
  { day: "Sunday", hours: "Closed", closed: true },
] as const;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RX";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type StepIconType = (typeof WIZARD_STEPS)[number]["icon"];

function StepIcon({ type }: { type: StepIconType }) {
  switch (type) {
    case "building":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 20V8l8-4 8 4v12M9 20v-6h6v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M4 12h16M12 4c2.5 2.5 2.5 13 0 16M12 4c-2.5 2.5-2.5 13 0 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 8v4l3 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "truck":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 7h11v10H3zM14 10h4l3 3v4h-7V10zM7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 16V10a6 6 0 1112 0v6l1.5 2H4.5L6 16zM10 19a2 2 0 004 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="11" r="2.2" fill="currentColor" />
        </svg>
      );
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

type MultiLocationIconType = (typeof MULTI_LOCATION_OPTIONS)[number]["icon"];

function MultiLocationIcon({ type }: { type: MultiLocationIconType }) {
  switch (type) {
    case "transfers":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 7h10M17 7l-2-2M17 7l-2 2M17 17H7M7 17l2-2M7 17l2 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pricing":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 7v10M10 9.5c.5-.8 1.2-1.2 2-1.2 1.2 0 2 .7 2 1.7s-.8 1.7-2 1.7-2 .7-2 1.7c0 1 .8 1.7 2 1.7.8 0 1.5-.4 2-1.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "patients":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M3.5 19c.8-3 2.8-4.5 5.5-4.5S13.7 16 14.5 19M16 9a2.5 2.5 0 010 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

type NotificationIconType = (typeof NOTIFICATION_OPTIONS)[number]["icon"];

function NotificationIcon({ type }: { type: NotificationIconType }) {
  switch (type) {
    case "email":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "sms":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V7a2 2 0 012-2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "prescription":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 4h8v4H8zM7 8h10v12H7zM10 12h4M12 10v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "refill":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 7a5 5 0 017-3M17 17a5 5 0 01-7 3M16 4l2 0 0 2M8 20l-2 0 0-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "order":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 4h10l1 4H6l1-4zM6 8h12l-1 12H7L6 8zM10 12h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function NavIcon({ id }: { id: (typeof NAV_ITEMS)[number]["id"] }) {
  switch (id) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z" fill="currentColor" />
        </svg>
      );
    case "setup":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM4 12h2M18 12h2M12 4v2M12 18v2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "locations":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="11" r="2.2" fill="currentColor" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5S13.7 16 14.5 19M16 9a2.5 2.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "inventory":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8l8-4 8 4v10l-8 4-8-4V8zM4 8l8 4 8-4M12 12v10" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "prescriptions":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h7l4 4v14H7V3z" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 3v4h4M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "claims":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 10h16M8 14h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 3.5v2M12 18.5v2M4.8 7.2l1.5 1.5M17.7 15.3l1.5 1.5M3.5 12h2M18.5 12h2M4.8 16.8l1.5-1.5M17.7 8.7l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export default function DashboardClient() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [navOpen, setNavOpen] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [operatingName, setOperatingName] = useState("");
  const [province, setProvince] = useState("Ontario");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [pharmacistInCharge, setPharmacistInCharge] = useState("");
  const [registrationType, setRegistrationType] = useState("");
  const [timeZone, setTimeZone] = useState("Eastern Time (ET)");
  const [currency, setCurrency] = useState("CAD (Canadian Dollar)");
  const [multipleLocations, setMultipleLocations] = useState(true);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [holidayDraft, setHolidayDraft] = useState("");
  const [showHolidayInput, setShowHolidayInput] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryPanel, setDeliveryPanel] = useState<
    null | "zones" | "charges" | "instructions"
  >(null);
  const [deliveryZones, setDeliveryZones] = useState("");
  const [deliveryCharges, setDeliveryCharges] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    prescription: true,
    refill: true,
    order: true,
  });
  const [pharmacyLocations, setPharmacyLocations] =
    useState<PharmacyLocationItem[]>(DEFAULT_LOCATIONS);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationPlace, setNewLocationPlace] = useState("");
  const [multiLocationSettings, setMultiLocationSettings] = useState({
    transfers: true,
    pricing: true,
    patients: true,
  });

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setSession(current);
    setEmail(current.username.includes("@") ? current.username : "");
    setPharmacistInCharge(current.displayName);
    setReady(true);
  }, [router]);

  const initials = useMemo(
    () => (session ? initialsFromName(session.displayName) : "RX"),
    [session],
  );

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  function onNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep((current) => Math.min(7, current + 1));
  }

  if (!ready || !session) {
    return (
      <div className={styles.loadingPage}>
        <p>Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className={styles.appShell}>
      <button
        type="button"
        className={`${styles.navScrim}${navOpen ? ` ${styles.navScrimOpen}` : ""}`}
        aria-label="Close navigation"
        onClick={() => setNavOpen(false)}
      />

      <aside className={`${styles.sidebar}${navOpen ? ` ${styles.sidebarOpen}` : ""}`}>
        <div className={styles.sidebarBrand}>
          <Image
            src="/brand/maplerx-mark.png"
            alt=""
            width={36}
            height={28}
            unoptimized
            className={styles.sidebarMark}
          />
          <span>
            Maple<span>Rx</span>
          </span>
          <button
            type="button"
            className={styles.sidebarClose}
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className={styles.sideNav} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem}${"active" in item && item.active ? ` ${styles.navItemActive}` : ""}`}
              onClick={() => setNavOpen(false)}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <NavIcon id={item.id} />
              </span>
              <span>{item.label}</span>
              {"hasChildren" in item && item.hasChildren ? (
                <span className={styles.navChevron} aria-hidden="true">
                  ▾
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          <button type="button" className={styles.locationBtn}>
            <span className={styles.topIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <circle cx="12" cy="11" r="2" fill="currentColor" />
              </svg>
            </span>
            {session.locationName} – {session.locationCity.split(",")[0]}
            <span aria-hidden="true">▾</span>
          </button>

          <label className={styles.search}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <input type="search" placeholder="Search patients, prescriptions..." />
          </label>

          <div className={styles.topRight}>
            <button type="button" className={styles.langBtn}>
              <span className={styles.topIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M4 12h16M12 4c2.5 2.5 2.5 13 0 16M12 4c-2.5 2.5-2.5 13 0 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              EN
            </button>
            <button type="button" className={styles.bellBtn} aria-label="Notifications">
              <span className={styles.topIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M6 17h12l-1.2-2.2V10a4.8 4.8 0 00-9.6 0v4.8L6 17zM10 19a2 2 0 004 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>3</span>
            </button>
            <button type="button" className={styles.profileBtn}>
              <span className={styles.avatar}>{initials}</span>
              <span className={styles.profileText}>
                <strong>{session.displayName}</strong>
                <small>{session.role}</small>
              </span>
              <span aria-hidden="true">▾</span>
            </button>
            <button type="button" className={styles.signOut} onClick={signOut}>
              Sign out
            </button>
            <div className={styles.canadaBadge}>Made for Canada</div>
          </div>
        </header>

        <section className={styles.hero}>
          <Image
            src="/brand/pharmacist-hero.jpg"
            alt=""
            fill
            unoptimized
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroCopy}>
            <h1>Step-by-Step Setup Wizard</h1>
            <p>Complete all configuration steps to activate your pharmacy workspace.</p>
          </div>
        </section>

        <ol className={styles.progress}>
          {WIZARD_STEPS.map((item) => (
            <li
              key={item.id}
              className={`${styles.progressItem}${step === item.id ? ` ${styles.progressActive}` : ""}${
                step > item.id ? ` ${styles.progressDone}` : ""
              }`}
            >
              <button type="button" onClick={() => setStep(item.id)}>
                <span>{item.id}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>

        <div className={styles.wizardCard}>
          <aside className={styles.stepRail}>
            <ul>
              {WIZARD_STEPS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.stepBtn}${step === item.id ? ` ${styles.stepBtnActive}` : ""}`}
                    onClick={() => setStep(item.id)}
                  >
                    <span className={styles.stepBtnIcon}>
                      <StepIcon type={item.icon} />
                    </span>
                    <span>
                      {item.id}. {item.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.skyline}>
              <Image
                src="/brand/toronto-skyline.jpg"
                alt=""
                width={280}
                height={120}
                unoptimized
              />
            </div>
          </aside>

          <div className={styles.formPane}>
            {step === 1 ? (
              <form className={styles.form} onSubmit={onNext}>
                <div className={styles.formHead}>
                  <span className={styles.formHeadIcon}>
                    <StepIcon type="building" />
                  </span>
                  <div>
                    <h2>Basic Pharmacy Information</h2>
                    <p>Enter your pharmacy&apos;s official details as registered with provincial authorities.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <label>
                    Legal Pharmacy Name
                    <input
                      value={legalName}
                      onChange={(event) => setLegalName(event.target.value)}
                      placeholder="e.g. Maple Health Pharmacy Ltd."
                      required
                    />
                  </label>
                  <label>
                    Operating Name
                    <input
                      value={operatingName}
                      onChange={(event) => setOperatingName(event.target.value)}
                      placeholder="e.g. MapleRx Toronto"
                      required
                    />
                  </label>
                  <label>
                    Province / Territory
                    <select value={province} onChange={(event) => setProvince(event.target.value)}>
                      {PROVINCES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Phone Number
                    <span className={styles.phoneField}>
                      <span aria-hidden="true">+1</span>
                      <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="(416) 555-0123"
                        required
                      />
                    </span>
                  </label>
                  <label>
                    Email Address
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="pharmacy@maplerx.ca"
                      required
                    />
                  </label>
                  <label>
                    Website (Optional)
                    <input
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      placeholder="https://www.maplerx.ca"
                    />
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.nextBtn}>
                    Next Step <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            ) : step === 2 ? (
              <form className={styles.form} onSubmit={onNext}>
                <div className={styles.regulatoryHead}>
                  <h2>Regulatory Information</h2>
                  <p>Enter regulatory and professional details.</p>
                </div>

                <div className={styles.regulatoryFields}>
                  <label>
                    Pharmacy License Number <span className={styles.required}>*</span>
                    <input
                      value={licenseNumber}
                      onChange={(event) => setLicenseNumber(event.target.value)}
                      placeholder="Enter license number"
                      required
                    />
                  </label>

                  <label>
                    Pharmacist-in-Charge <span className={styles.required}>*</span>
                    <input
                      value={pharmacistInCharge}
                      onChange={(event) => setPharmacistInCharge(event.target.value)}
                      placeholder="Enter name"
                      required
                    />
                  </label>

                  <label>
                    Professional Registration <span className={styles.required}>*</span>
                    <select
                      value={registrationType}
                      onChange={(event) => setRegistrationType(event.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select registration type
                      </option>
                      {REGISTRATION_TYPES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => setStep(1)}
                  >
                    Previous
                  </button>
                  <button type="submit" className={styles.nextBtn}>
                    Next <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            ) : step === 3 ? (
              <form className={styles.form} onSubmit={onNext}>
                <div className={styles.regulatoryHead}>
                  <h2>Location &amp; Time Settings</h2>
                  <p>Configure province, timezone and location settings.</p>
                </div>

                <div className={styles.locationFields}>
                  <label>
                    Province <span className={styles.requiredMark}>*</span>
                    <select
                      value={province}
                      onChange={(event) => setProvince(event.target.value)}
                      required
                    >
                      {PROVINCES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Time Zone <span className={styles.requiredMark}>*</span>
                    <select
                      value={timeZone}
                      onChange={(event) => setTimeZone(event.target.value)}
                      required
                    >
                      {TIME_ZONES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Currency <span className={styles.requiredMark}>*</span>
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      required
                    >
                      {CURRENCIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.multiLocationRow}>
                    <span>
                      <strong>Multiple Locations</strong>
                      <small>Yes, I have multiple locations</small>
                    </span>
                    <input
                      type="checkbox"
                      className={styles.serviceSwitch}
                      checked={multipleLocations}
                      onChange={(event) => setMultipleLocations(event.target.checked)}
                      aria-label="Multiple Locations"
                    />
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(2)}>
                    Previous
                  </button>
                  <button type="submit" className={styles.nextBtn}>
                    Next <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            ) : step === 4 ? (
              <div className={styles.form}>
                <div className={styles.regulatoryHead}>
                  <h2>Operating Hours</h2>
                  <p>Set operating hours and holiday schedule</p>
                </div>

                <ul className={styles.hoursList}>
                  {OPERATING_HOURS.map((item) => (
                    <li key={item.day} className={styles.hoursRow}>
                      <span className={styles.hoursDay}>{item.day}</span>
                      <button type="button" className={styles.hoursValue}>
                        <span className={item.closed ? styles.hoursClosed : undefined}>
                          {item.hours}
                        </span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className={styles.holidayBlock}>
                  <div className={styles.holidayTitle}>
                    <span className={styles.holidayIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M4 10h16M7 4v3M17 4v3M6 7h12a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Holiday Schedule
                  </div>

                  {holidays.length > 0 ? (
                    <ul className={styles.holidayList}>
                      {holidays.map((item) => (
                        <li key={item}>
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setHolidays((current) => current.filter((day) => day !== item))
                            }
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {showHolidayInput ? (
                    <div className={styles.holidayAddRow}>
                      <input
                        type="date"
                        value={holidayDraft}
                        onChange={(event) => setHolidayDraft(event.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.nextBtn}
                        onClick={() => {
                          if (!holidayDraft) return;
                          setHolidays((current) =>
                            current.includes(holidayDraft)
                              ? current
                              : [...current, holidayDraft].sort(),
                          );
                          setHolidayDraft("");
                          setShowHolidayInput(false);
                        }}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => {
                          setShowHolidayInput(false);
                          setHolidayDraft("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.addHolidayBtn}
                      onClick={() => setShowHolidayInput(true)}
                    >
                      <span aria-hidden="true">+</span> Add Holidays
                    </button>
                  )}
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(3)}>
                    Previous
                  </button>
                  <button type="button" className={styles.nextBtn} onClick={() => setStep(5)}>
                    Next <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ) : step === 5 ? (
              <div className={styles.form}>
                <div className={styles.regulatoryHead}>
                  <h2>Pickup &amp; Delivery</h2>
                  <p>Configure pickup and delivery services.</p>
                </div>

                <div className={styles.serviceList}>
                  <label className={styles.serviceToggleRow}>
                    <span>Enable Pickup Service</span>
                    <input
                      type="checkbox"
                      className={styles.serviceSwitch}
                      checked={pickupEnabled}
                      onChange={(event) => setPickupEnabled(event.target.checked)}
                      aria-label="Enable Pickup Service"
                    />
                  </label>

                  <label className={styles.serviceToggleRow}>
                    <span>Enable Delivery Service</span>
                    <input
                      type="checkbox"
                      className={styles.serviceSwitch}
                      checked={deliveryEnabled}
                      onChange={(event) => setDeliveryEnabled(event.target.checked)}
                      aria-label="Enable Delivery Service"
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.serviceNavRow}
                    disabled={!deliveryEnabled}
                    onClick={() =>
                      setDeliveryPanel((current) => (current === "zones" ? null : "zones"))
                    }
                  >
                    <span>
                      <strong>Delivery Zones</strong>
                      <small>Add delivery zones</small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                  {deliveryPanel === "zones" ? (
                    <div className={styles.servicePanel}>
                      <textarea
                        rows={3}
                        placeholder="e.g. Downtown Toronto, North York, Scarborough"
                        value={deliveryZones}
                        onChange={(event) => setDeliveryZones(event.target.value)}
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={styles.serviceNavRow}
                    disabled={!deliveryEnabled}
                    onClick={() =>
                      setDeliveryPanel((current) =>
                        current === "charges" ? null : "charges",
                      )
                    }
                  >
                    <span>
                      <strong>Delivery Charges</strong>
                      <small>Configure charges</small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                  {deliveryPanel === "charges" ? (
                    <div className={styles.servicePanel}>
                      <textarea
                        rows={3}
                        placeholder="e.g. Free over $50 · Flat $5 · Zone-based rates"
                        value={deliveryCharges}
                        onChange={(event) => setDeliveryCharges(event.target.value)}
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={styles.serviceNavRow}
                    disabled={!deliveryEnabled}
                    onClick={() =>
                      setDeliveryPanel((current) =>
                        current === "instructions" ? null : "instructions",
                      )
                    }
                  >
                    <span>
                      <strong>Delivery Instructions</strong>
                      <small>Add instructions</small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                  {deliveryPanel === "instructions" ? (
                    <div className={styles.servicePanel}>
                      <textarea
                        rows={3}
                        placeholder="e.g. Leave with reception · Call on arrival · Ring doorbell"
                        value={deliveryInstructions}
                        onChange={(event) => setDeliveryInstructions(event.target.value)}
                      />
                    </div>
                  ) : null}
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(4)}>
                    Previous
                  </button>
                  <button type="button" className={styles.nextBtn} onClick={() => setStep(6)}>
                    Next <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ) : step === 6 ? (
              <div className={styles.form}>
                <div className={styles.regulatoryHead}>
                  <h2>Notification Configuration</h2>
                  <p>Configure email, SMS and system notifications.</p>
                </div>

                <div className={styles.notifyList}>
                  {NOTIFICATION_OPTIONS.map((item) => (
                    <label key={item.id} className={styles.notifyRow}>
                      <span className={styles.notifyIcon} aria-hidden="true">
                        <NotificationIcon type={item.icon} />
                      </span>
                      <span className={styles.notifyCopy}>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <input
                        type="checkbox"
                        className={styles.serviceSwitch}
                        checked={notifications[item.id]}
                        onChange={(event) =>
                          setNotifications((current) => ({
                            ...current,
                            [item.id]: event.target.checked,
                          }))
                        }
                        aria-label={item.title}
                      />
                    </label>
                  ))}
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(5)}>
                    Previous
                  </button>
                  <button type="button" className={styles.nextBtn} onClick={() => setStep(7)}>
                    Next <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ) : step === 7 ? (
              <div className={styles.form}>
                <div className={styles.regulatoryHead}>
                  <h2>Multi-Location Setup</h2>
                  <p>Add locations and configure inventory and transfers.</p>
                </div>

                <div className={styles.multiList}>
                  <button
                    type="button"
                    className={styles.multiAddRow}
                    onClick={() => setShowAddLocation((current) => !current)}
                  >
                    <span className={styles.multiAddIcon} aria-hidden="true">
                      +
                    </span>
                    <span>
                      <strong>Add Pharmacy Location</strong>
                      <small>Add new location</small>
                    </span>
                  </button>

                  {showAddLocation ? (
                    <div className={styles.multiAddPanel}>
                      <input
                        value={newLocationName}
                        onChange={(event) => setNewLocationName(event.target.value)}
                        placeholder="Location name"
                      />
                      <input
                        value={newLocationPlace}
                        onChange={(event) => setNewLocationPlace(event.target.value)}
                        placeholder="City, Province"
                      />
                      <div className={styles.multiAddActions}>
                        <button
                          type="button"
                          className={styles.nextBtn}
                          onClick={() => {
                            if (!newLocationName.trim() || !newLocationPlace.trim()) return;
                            setPharmacyLocations((current) => [
                              ...current,
                              {
                                id: `loc-${Date.now()}`,
                                name: newLocationName.trim(),
                                place: newLocationPlace.trim(),
                                status: "Active",
                              },
                            ]);
                            setNewLocationName("");
                            setNewLocationPlace("");
                            setShowAddLocation(false);
                          }}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className={styles.backBtn}
                          onClick={() => {
                            setShowAddLocation(false);
                            setNewLocationName("");
                            setNewLocationPlace("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {pharmacyLocations.map((location) => (
                    <div key={location.id} className={styles.multiLocationRow}>
                      <span className={styles.multiPinIcon} aria-hidden="true">
                        <StepIcon type="pin" />
                      </span>
                      <span className={styles.multiLocationCopy}>
                        <strong>{location.name}</strong>
                        <small>{location.place}</small>
                      </span>
                      <span className={styles.activeBadge}>{location.status}</span>
                    </div>
                  ))}

                  {MULTI_LOCATION_OPTIONS.map((item) => (
                    <label key={item.id} className={styles.multiSettingRow}>
                      <span className={styles.multiSettingIcon} aria-hidden="true">
                        <MultiLocationIcon type={item.icon} />
                      </span>
                      <span className={styles.multiSettingTitle}>{item.title}</span>
                      <input
                        type="checkbox"
                        className={styles.serviceSwitch}
                        checked={multiLocationSettings[item.id]}
                        onChange={(event) =>
                          setMultiLocationSettings((current) => ({
                            ...current,
                            [item.id]: event.target.checked,
                          }))
                        }
                        aria-label={item.title}
                      />
                    </label>
                  ))}
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(6)}>
                    Previous
                  </button>
                  <button type="button" className={styles.nextBtn} onClick={() => setStep(1)}>
                    Finish Setup
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
