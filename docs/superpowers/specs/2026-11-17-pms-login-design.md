# PMS Login — Design Spec

**Date:** 2026-11-17  
**Product:** Canadian Pharmacy Operating System (PMS)  
**Slice:** Authentication entry (UI-only mock) aligned with Requirement §6 (User, Role & Permission Management)

## Decisions

- Stack: Next.js (App Router) + TypeScript
- Credentials: Username + password + pharmacy location
- Auth depth: UI-only mock (no NextAuth/DB)
- Layout: Split clinical login (Approach 1)

## Requirement §6 mapping (this slice)

Supported roles represented as **demo accounts** (not a role picker):

| Username | Role | Password |
|----------|------|----------|
| owner | Pharmacy owner | demo1234 |
| manager | Pharmacy manager | demo1234 |
| pharmacist | Pharmacist | demo1234 |
| technician | Pharmacy technician | demo1234 |
| assistant | Pharmacy assistant | demo1234 |
| dataentry | Data-entry staff | demo1234 |
| inventory | Inventory manager | demo1234 |
| delivery | Delivery staff | demo1234 |
| admin | System administrator | demo1234 |
| auditor | Auditor | demo1234 |

- Login success stores mock session (username, role, location) in `sessionStorage`.
- Dashboard shows signed-in user + role + location (permission engine deferred).
- High-risk re-authentication and granular permission checks are **out of scope** for this slice.

## UI

- Desktop: 50/50 — left brand panel, right form
- Mobile: brand strip + form stacked
- Fields: Username, Password (show/hide), Pharmacy location (select), Remember me, Sign in
- Forgot password: non-functional placeholder
- Demo locations: Downtown Toronto, North York, Ottawa Central
- Validation: all required; clear inline errors
- Visual: cool teal/slate clinical look; brand name hero-level on left panel

## Routes

- `/` → redirect to `/login`
- `/login` → login form
- `/dashboard` → placeholder post-login (requires mock session)

## Out of scope

- Real auth, MFA, forgot-password flow, audit login events, permission matrix enforcement
