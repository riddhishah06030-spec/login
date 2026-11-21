export type SignInFields = {
  username: string;
  password: string;
};

export type ResetFields = {
  username: string;
  newPassword: string;
  confirmPassword: string;
};

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,40}$/;

export function validateUsernameOrEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email or username is required.";
  if (trimmed.includes("@")) {
    if (!EMAIL_RE.test(trimmed.toLowerCase())) return "Enter a valid email address.";
    return undefined;
  }
  if (trimmed.length < 3) return "Username must be at least 3 characters.";
  if (!USERNAME_RE.test(trimmed)) {
    return "Username can only use letters, numbers, dot, _ and -.";
  }
  return undefined;
}

export const PASSWORD_MAX_LENGTH = 8;

export function validatePassword(value: string, label = "Password"): string | undefined {
  if (!value) return `${label} is required.`;
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `${label} can be up to ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return undefined;
}

export function validateSignIn(fields: SignInFields): FieldErrors<"username" | "password"> {
  const errors: FieldErrors<"username" | "password"> = {};
  const usernameError = validateUsernameOrEmail(fields.username);
  const passwordError = validatePassword(fields.password);
  if (usernameError) errors.username = usernameError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

export function validateReset(fields: ResetFields): FieldErrors<"username" | "newPassword" | "confirmPassword"> {
  const errors: FieldErrors<"username" | "newPassword" | "confirmPassword"> = {};
  const usernameError = validateUsernameOrEmail(fields.username);
  const newPasswordError = validatePassword(fields.newPassword, "New password");
  if (usernameError) errors.username = usernameError;
  if (newPasswordError) errors.newPassword = newPasswordError;

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (fields.newPassword !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function hasFieldErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
