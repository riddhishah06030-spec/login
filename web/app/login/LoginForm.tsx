"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authenticate,
  clearRememberedUsername,
  createAccount,
  getRememberedUsername,
  resetDemoPassword,
  saveRememberedUsername,
  saveSession,
  signInWithProvider,
  type AuthProvider,
} from "@/lib/auth";
import {
  continueWithGoogle,
  isGoogleSignInConfigured,
  isValidGoogleEmail,
  profileFromGoogleEmail,
} from "@/lib/googleAuth";
import {
  PASSWORD_MAX_LENGTH,
  hasFieldErrors,
  validateFullName,
  validatePassword,
  validateReset,
  validateSignIn,
  validateSignup,
  validateUsernameOrEmail,
  type FieldErrors,
} from "@/lib/loginValidation";
import { PHARMACY_LOCATIONS } from "@/lib/locations";
import CapsyThumbsUp from "./CapsyThumbsUp";
import HeroMascot from "./HeroMascot";
import styles from "./login.module.css";

const DEFAULT_LOCATION = PHARMACY_LOCATIONS[0]?.id ?? "";
const SUCCESS_LEAVE_MS = 1600;
const SUCCESS_HOLD_MS = 2300;

type Mode = "signin" | "forgot" | "signup";
type SignInErrorKey = "username" | "password";
type ResetErrorKey = "username" | "newPassword" | "confirmPassword";
type SignupErrorKey = "fullName" | "username" | "password" | "confirmPassword";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<SignInErrorKey | ResetErrorKey | SignupErrorKey>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [mascotMood, setMascotMood] = useState<"idle" | "sad" | "happy">("idle");
  const [googleSheetOpen, setGoogleSheetOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePermission, setGooglePermission] = useState(true);
  const [googleSheetError, setGoogleSheetError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successLeaving, setSuccessLeaving] = useState(false);

  function clearFieldError(key: SignInErrorKey | ResetErrorKey | SignupErrorKey) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  useEffect(() => {
    const remembered = getRememberedUsername();
    if (remembered) {
      setUsername(remembered);
      setRemember(true);
    }
  }, []);

  function openForgot() {
    setMode("forgot");
    setError("");
    setSuccess("");
    setFieldErrors({});
    setNewPassword("");
    setConfirmPassword("");
    setPassword("");
    setMascotMood("idle");
  }

  function openSignup() {
    setMode("signup");
    setError("");
    setSuccess("");
    setFieldErrors({});
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowNewPassword(false);
    setMascotMood("idle");
  }

  function backToSignIn() {
    setMode("signin");
    setError("");
    setFieldErrors({});
    setFullName("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setMascotMood("idle");
  }

  function finishLogin(sessionUsername: string) {
    if (remember) {
      saveRememberedUsername(sessionUsername);
    } else {
      clearRememberedUsername();
    }
    setError("");
    setFieldErrors({});
    setGoogleSheetOpen(false);
    setMascotMood("happy");
    setSuccessLeaving(false);
    setLoginSuccess(true);
    setSubmitting(false);
  }

  useEffect(() => {
    if (!loginSuccess) return;

    const leaveTimer = window.setTimeout(() => {
      setSuccessLeaving(true);
    }, SUCCESS_LEAVE_MS);

    const goTimer = window.setTimeout(() => {
      router.replace("/dashboard");
    }, SUCCESS_HOLD_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(goTimer);
    };
  }, [loginSuccess, router]);

  function onSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validateSignIn({ username, password });
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      setMascotMood("sad");
      return;
    }

    setSubmitting(true);
    const result = authenticate(username, password, DEFAULT_LOCATION);
    if (!result.ok) {
      setError(result.error);
      setMascotMood("sad");
      setSubmitting(false);
      return;
    }

    saveSession(result.session);
    finishLogin(result.session.username);
  }

  function onCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validateSignup({
      fullName,
      username,
      password,
      confirmPassword,
    });
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      setMascotMood("sad");
      return;
    }

    setSubmitting(true);
    const result = createAccount(username, password, DEFAULT_LOCATION, fullName);
    if (!result.ok) {
      setError(result.error);
      setMascotMood("sad");
      setSubmitting(false);
      return;
    }

    saveSession(result.session);
    finishLogin(result.session.username);
  }

  function completeGoogleLogin(email: string, name: string) {
    const result = signInWithProvider("google", DEFAULT_LOCATION, { email, name });
    if (!result.ok) {
      throw new Error(result.error);
    }
    saveSession(result.session);
    setGoogleSheetOpen(false);
    finishLogin(result.session.username);
  }

  async function onSocialContinue(provider: Exclude<AuthProvider, "password">) {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (provider === "google") {
        if (!isGoogleSignInConfigured()) {
          setSubmitting(false);
          setGoogleSheetError("");
          setGooglePermission(true);
          setGoogleEmail((current) => current || (username.includes("@") ? username : ""));
          setGoogleSheetOpen(true);
          return;
        }

        const googleProfile = await continueWithGoogle();
        completeGoogleLogin(googleProfile.email, googleProfile.name);
        return;
      }

      const result = signInWithProvider(provider, DEFAULT_LOCATION);
      if (!result.ok) {
        throw new Error(result.error);
      }
      saveSession(result.session);
      finishLogin(result.session.username);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google continue failed.";
      if (message === "GOOGLE_SHEET_REQUIRED") {
        setSubmitting(false);
        setGoogleSheetOpen(true);
        return;
      }
      setError(message);
      setMascotMood("sad");
      setSubmitting(false);
    }
  }

  function onGoogleSheetContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGoogleSheetError("");

    if (!isValidGoogleEmail(googleEmail)) {
      setGoogleSheetError("Enter a valid Google email to continue.");
      return;
    }
    if (!googlePermission) {
      setGoogleSheetError("Allow email permission to continue with Google.");
      return;
    }

    setSubmitting(true);
    try {
      const profile = profileFromGoogleEmail(googleEmail);
      completeGoogleLogin(profile.email, profile.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google continue failed.";
      setGoogleSheetError(message);
      setMascotMood("sad");
      setSubmitting(false);
    }
  }

  function onResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validateReset({ username, newPassword, confirmPassword });
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      setMascotMood("sad");
      return;
    }

    setSubmitting(true);
    const result = resetDemoPassword(username, newPassword);
    if (!result.ok) {
      setError(result.error);
      setMascotMood("sad");
      setSubmitting(false);
      return;
    }

    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    setSuccess("Password updated. You can sign in with your new password.");
    setMascotMood("happy");
    setSubmitting(false);
    setMode("signin");
  }

  if (loginSuccess) {
    return (
      <div
        className={`${styles.successGate}${successLeaving ? ` ${styles.successLeaving}` : ""}`}
        role="status"
        aria-live="polite"
        aria-label="Login successful"
      >
        <div className={styles.successCard}>
          <CapsyThumbsUp
            className={`${styles.successMascot}${successLeaving ? ` ${styles.successMascotLeaving}` : ""}`}
          />
          <h2>Login successful!</h2>
          <p>Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.plusPattern} aria-hidden="true" />

      <div className={styles.layout}>
        <section className={styles.hero}>
          <div className={styles.mascot}>
            <HeroMascot
              username={username}
              passwordLength={mode === "signin" ? password.length : newPassword.length}
              showPassword={mode === "signin" ? showPassword : showNewPassword}
              usernameFocused={usernameFocused}
              passwordFocused={passwordFocused}
              mood={mascotMood}
            />
          </div>
          <h1>{mode === "signup" ? "Join MapleRx" : "Welcome back!"}</h1>
          <p>
            {mode === "signup"
              ? "Create your account to manage pharmacy care simply and safely."
              : "Manage your pharmacy smartly, safely and simply."}
          </p>
        </section>

        <section
          className={styles.cardWrap}
          aria-label={
            mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"
          }
        >
          <div className={styles.card}>
            <div className={styles.cardBrand}>
              <Image
                src="/brand/maplerx-mark.png"
                alt=""
                width={40}
                height={28}
                unoptimized
                className={styles.cardMark}
              />
              <p className={styles.cardBrandName}>
                Maple<span>Rx</span>
              </p>
            </div>
            <h2>
              {mode === "signin"
                ? "Sign in to your account"
                : mode === "signup"
                  ? "Create your account"
                  : "Reset your password"}
            </h2>

            {mode === "signin" ? (
              <form className={styles.form} onSubmit={onSignIn} noValidate>
                {error ? (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className={styles.success} role="status">
                    {success}
                  </div>
                ) : null}

                <div className={styles.field}>
                  <label htmlFor="username">Email or username</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5v-9z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M5 8l7 5 7-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="username"
                      name="username"
                      autoComplete="username"
                      value={username}
                      className={fieldErrors.username ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.username)}
                      aria-describedby={fieldErrors.username ? "username-error" : undefined}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        clearFieldError("username");
                        setError("");
                      }}
                      onFocus={() => setUsernameFocused(true)}
                      onBlur={() => {
                        setUsernameFocused(false);
                        const message = validateUsernameOrEmail(username);
                        if (message) setFieldErrors((current) => ({ ...current, username: message }));
                      }}
                      placeholder="pharmacist"
                      required
                    />
                  </div>
                  {fieldErrors.username ? (
                    <p id="username-error" className={styles.fieldError} role="alert">
                      {fieldErrors.username}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor="password">Password</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="6" y="10" width="12" height="9" rx="2" fill="currentColor" opacity="0.25" />
                        <path
                          d="M8.5 10V8a3.5 3.5 0 017 0v2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          fill="none"
                        />
                      </svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      className={fieldErrors.password ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? "password-error" : undefined}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onChange={(event) => {
                        setPassword(event.target.value.slice(0, PASSWORD_MAX_LENGTH));
                        clearFieldError("password");
                        setError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        const message = validatePassword(password);
                        if (message) setFieldErrors((current) => ({ ...current, password: message }));
                      }}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p id="password-error" className={styles.fieldError} role="alert">
                      {fieldErrors.password}
                    </p>
                  ) : null}
                </div>

                <div className={styles.row}>
                  <label className={styles.remember}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                    />
                    Remember me
                  </label>
                  <button type="button" className={styles.forgot} onClick={openForgot}>
                    Forgot password?
                  </button>
                </div>

                <button className={styles.submit} type="submit" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                </button>

                <div className={styles.ssoDivider} aria-hidden="true">
                  <span>or</span>
                </div>

                <div className={styles.ssoRow}>
                  <button
                    type="button"
                    className={styles.ssoBtn}
                    disabled={submitting}
                    onClick={() => onSocialContinue("google")}
                  >
                    <span className={styles.ssoIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </span>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    className={styles.ssoBtn}
                    disabled={submitting}
                    onClick={() => onSocialContinue("microsoft")}
                  >
                    <span className={styles.ssoIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
                        <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
                        <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
                        <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
                      </svg>
                    </span>
                    <span>Continue with Microsoft</span>
                  </button>
                </div>

                <p className={styles.accountPrompt}>
                  Don&apos;t have an account?{" "}
                  <button type="button" className={styles.forgot} onClick={openSignup}>
                    Create account
                  </button>
                </p>
              </form>
            ) : mode === "signup" ? (
              <form className={styles.form} onSubmit={onCreateAccount} noValidate>
                {error ? (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                ) : null}

                <div className={styles.field}>
                  <label htmlFor="signup-fullname">Full name</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                        <path
                          d="M6 19c.9-3 2.9-4.5 6-4.5S17.1 16 18 19"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="signup-fullname"
                      name="fullName"
                      autoComplete="name"
                      value={fullName}
                      className={fieldErrors.fullName ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? "signup-fullname-error" : undefined}
                      onChange={(event) => {
                        setFullName(event.target.value);
                        clearFieldError("fullName");
                        setError("");
                      }}
                      onBlur={() => {
                        const message = validateFullName(fullName);
                        if (message) setFieldErrors((current) => ({ ...current, fullName: message }));
                      }}
                      placeholder="Alex Patient"
                      required
                    />
                  </div>
                  {fieldErrors.fullName ? (
                    <p id="signup-fullname-error" className={styles.fieldError} role="alert">
                      {fieldErrors.fullName}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor="signup-username">Email or username</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5v-9z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M5 8l7 5 7-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="signup-username"
                      name="username"
                      autoComplete="username"
                      value={username}
                      className={fieldErrors.username ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.username)}
                      aria-describedby={fieldErrors.username ? "signup-username-error" : undefined}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        clearFieldError("username");
                        setError("");
                      }}
                      onFocus={() => setUsernameFocused(true)}
                      onBlur={() => {
                        setUsernameFocused(false);
                        const message = validateUsernameOrEmail(username);
                        if (message) setFieldErrors((current) => ({ ...current, username: message }));
                      }}
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                  {fieldErrors.username ? (
                    <p id="signup-username-error" className={styles.fieldError} role="alert">
                      {fieldErrors.username}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor="signup-password">Password</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="6" y="10" width="12" height="9" rx="2" fill="currentColor" opacity="0.25" />
                        <path
                          d="M8.5 10V8a3.5 3.5 0 017 0v2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          fill="none"
                        />
                      </svg>
                    </span>
                    <input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      className={fieldErrors.password ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? "signup-password-error" : undefined}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onChange={(event) => {
                        setPassword(event.target.value.slice(0, PASSWORD_MAX_LENGTH));
                        clearFieldError("password");
                        setError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        const message = validatePassword(password);
                        if (message) setFieldErrors((current) => ({ ...current, password: message }));
                      }}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p id="signup-password-error" className={styles.fieldError} role="alert">
                      {fieldErrors.password}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor="signup-confirm-password">Confirm password</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="6" y="10" width="12" height="9" rx="2" fill="currentColor" opacity="0.25" />
                        <path
                          d="M8.5 10V8a3.5 3.5 0 017 0v2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          fill="none"
                        />
                      </svg>
                    </span>
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      className={fieldErrors.confirmPassword ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={
                        fieldErrors.confirmPassword ? "signup-confirm-password-error" : undefined
                      }
                      maxLength={PASSWORD_MAX_LENGTH}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value.slice(0, PASSWORD_MAX_LENGTH));
                        clearFieldError("confirmPassword");
                        setError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        if (!confirmPassword) {
                          setFieldErrors((current) => ({
                            ...current,
                            confirmPassword: "Confirm your password.",
                          }));
                        } else if (password !== confirmPassword) {
                          setFieldErrors((current) => ({
                            ...current,
                            confirmPassword: "Passwords do not match.",
                          }));
                        }
                      }}
                      placeholder="Re-enter password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowNewPassword((value) => !value)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    </button>
                  </div>
                  {fieldErrors.confirmPassword ? (
                    <p id="signup-confirm-password-error" className={styles.fieldError} role="alert">
                      {fieldErrors.confirmPassword}
                    </p>
                  ) : null}
                </div>

                <button className={styles.submit} type="submit" disabled={submitting}>
                  {submitting ? "Creating account…" : "Create account"}
                </button>

                <p className={styles.accountPrompt}>
                  Already have an account?{" "}
                  <button type="button" className={styles.forgot} onClick={backToSignIn}>
                    Sign in
                  </button>
                </p>
              </form>
            ) : (
              <form className={styles.form} onSubmit={onResetPassword} noValidate>
                {error ? (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                ) : null}

                <p className={styles.forgotHint}>
                  Enter the email or username from your created account, then choose a new password.
                </p>

                <div className={styles.field}>
                  <label htmlFor="forgot-username">Email or username</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path
                          d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5v-9z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M5 8l7 5 7-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      id="forgot-username"
                      name="username"
                      autoComplete="username"
                      value={username}
                      className={fieldErrors.username ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.username)}
                      aria-describedby={fieldErrors.username ? "forgot-username-error" : undefined}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        clearFieldError("username");
                        setError("");
                      }}
                      onFocus={() => setUsernameFocused(true)}
                      onBlur={() => {
                        setUsernameFocused(false);
                        const message = validateUsernameOrEmail(username);
                        if (message) setFieldErrors((current) => ({ ...current, username: message }));
                      }}
                      placeholder="pharmacist"
                      required
                    />
                  </div>
                  {fieldErrors.username ? (
                    <p id="forgot-username-error" className={styles.fieldError} role="alert">
                      {fieldErrors.username}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor="new-password">New password</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="6" y="10" width="12" height="9" rx="2" fill="currentColor" opacity="0.25" />
                        <path
                          d="M8.5 10V8a3.5 3.5 0 017 0v2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          fill="none"
                        />
                      </svg>
                    </span>
                    <input
                      id="new-password"
                      name="new-password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      className={fieldErrors.newPassword ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.newPassword)}
                      aria-describedby={fieldErrors.newPassword ? "new-password-error" : undefined}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onChange={(event) => {
                        setNewPassword(event.target.value.slice(0, PASSWORD_MAX_LENGTH));
                        clearFieldError("newPassword");
                        setError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        const message = validatePassword(newPassword, "New password");
                        if (message) setFieldErrors((current) => ({ ...current, newPassword: message }));
                      }}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowNewPassword((value) => !value)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    </button>
                  </div>
                  {fieldErrors.newPassword ? (
                    <p id="new-password-error" className={styles.fieldError} role="alert">
                      {fieldErrors.newPassword}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirm-password">Confirm password</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="6" y="10" width="12" height="9" rx="2" fill="currentColor" opacity="0.25" />
                        <path
                          d="M8.5 10V8a3.5 3.5 0 017 0v2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          fill="none"
                        />
                      </svg>
                    </span>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      className={fieldErrors.confirmPassword ? styles.inputInvalid : undefined}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value.slice(0, PASSWORD_MAX_LENGTH));
                        clearFieldError("confirmPassword");
                        setError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        if (!confirmPassword) {
                          setFieldErrors((current) => ({
                            ...current,
                            confirmPassword: "Confirm your new password.",
                          }));
                        } else if (newPassword !== confirmPassword) {
                          setFieldErrors((current) => ({
                            ...current,
                            confirmPassword: "Passwords do not match.",
                          }));
                        }
                      }}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                  {fieldErrors.confirmPassword ? (
                    <p id="confirm-password-error" className={styles.fieldError} role="alert">
                      {fieldErrors.confirmPassword}
                    </p>
                  ) : null}
                </div>

                <button className={styles.submit} type="submit" disabled={submitting}>
                  {submitting ? "Updating…" : "Update password"}
                </button>

                <button type="button" className={styles.backLink} onClick={backToSignIn}>
                  Back to sign in
                </button>
              </form>
            )}

          </div>
        </section>
      </div>

      {googleSheetOpen ? (
        <div
          className={styles.googleSheetBackdrop}
          role="presentation"
          onClick={() => {
            if (!submitting) setGoogleSheetOpen(false);
          }}
        >
          <div
            className={styles.googleSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-continue-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.googleSheetHead}>
              <span className={styles.ssoIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </span>
              <div>
                <h3 id="google-continue-title">Continue with Google</h3>
                <p>Choose the email that has permission, then continue.</p>
              </div>
            </div>

            <form className={styles.googleSheetForm} onSubmit={onGoogleSheetContinue}>
              {googleSheetError ? (
                <div className={styles.error} role="alert">
                  {googleSheetError}
                </div>
              ) : null}

              <label htmlFor="google-email">Google email</label>
              <input
                id="google-email"
                type="email"
                autoComplete="email"
                placeholder="name@gmail.com"
                value={googleEmail}
                onChange={(event) => setGoogleEmail(event.target.value)}
                required
              />

              <label className={styles.googlePermission}>
                <input
                  type="checkbox"
                  checked={googlePermission}
                  onChange={(event) => setGooglePermission(event.target.checked)}
                />
                Allow MapleRx to use this email to continue
              </label>

              <div className={styles.googleSheetActions}>
                <button
                  type="button"
                  className={styles.googleCancel}
                  disabled={submitting}
                  onClick={() => setGoogleSheetOpen(false)}
                >
                  Cancel
                </button>
                <button className={styles.submit} type="submit" disabled={submitting}>
                  {submitting ? "Continuing…" : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
