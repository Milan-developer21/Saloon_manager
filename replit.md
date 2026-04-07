# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9

## Artifacts

### MySaloon (mobile app)
- **Path**: `artifacts/saloon/`
- **Type**: Expo (React Native)
- **Preview**: `/saloon` path via Expo Dev Server
- **Description**: Two-sided saloon booking app for Indian local saloon shops
- **Backend**: REST API at `/api` (port 8080, JWT auth, PostgreSQL)
- **Languages**: English + Hindi (हिंदी)

#### Architecture
- **Two roles**: Customer and Saloon Owner (register/login at launch)
- **Auth**: JWT tokens stored in AsyncStorage; `AuthContext` manages session
- **Customer side**: Browse saloons, see open/closed status, book available slots (no pricing shown), view booking status, cancel pending bookings
- **Owner side**: Register shop, manage time slots, accept/reject booking requests, toggle open/closed, logout
- **Booking flow**: Customer requests slot (pending) → Owner sees in dashboard → Owner accepts/rejects → Customer sees updated status
- **API client**: `lib/api.ts` uses `EXPO_PUBLIC_DOMAIN` for base URL

#### Key files
- `artifacts/saloon/lib/api.ts` — API client (fetch wrapper)
- `artifacts/saloon/context/AuthContext.tsx` — login/register/logout + JWT storage
- `artifacts/saloon/context/AppContext.tsx` — saloons, bookings, slots via API
- `artifacts/saloon/app/auth/login.tsx` — login screen (role-aware)
- `artifacts/saloon/app/auth/register.tsx` — register screen (role-aware)
- `artifacts/saloon/app/index.tsx` — role selector (auth-aware, auto-redirects if logged in)

#### Navigation / Auth Architecture Notes
- **Logout redirect**: `app/_layout.tsx` gives the `<Stack>` a dynamic `key` prop: `"auth-{userId}"` when logged in, `"guest"` when logged out. This forces React to unmount/remount the entire Stack on auth state change, clearing ghost screens (e.g. `(owner)` tab layout) that React Navigation keeps in the DOM.
- **AuthGuard**: `_layout.tsx` includes an `AuthGuard` component that uses `useRef` to detect user→null transitions and calls `router.replace("/")` as a native fallback.
- **Route groups and web URLs**: In Expo Router web mode, route groups (`(owner)`, `(customer)`) do not add URL path segments. Both root index and `(owner)/index` resolve to URL `/`. Using `router.replace("/")` inside the owner section navigates back to the owner dashboard — this is why the Stack `key` approach is required instead.
- **bookings.ts fix**: `/my` endpoint uses `inArray` filter to scope slot/saloon queries to the current user's bookings only.

#### Key Files
- `app/_layout.tsx` — Root layout with LanguageProvider + AppProvider
- `app/index.tsx` — Role selector (Customer / Saloon Owner)
- `app/(customer)/` — Customer tab screens (browse, saloon detail, my bookings)
- `app/(owner)/` — Owner tab screens (dashboard, requests, slots, profile)
- `context/AppContext.tsx` — Full app state: roles, saloons, slots, bookings, notifications
- `context/LanguageContext.tsx` — EN/HI language switching
- `constants/i18n.ts` — All translations (English + Hindi)
- `constants/colors.ts` — Indian saffron color theme
- `components/SaloonCard.tsx` — Saloon listing card
- `components/SlotButton.tsx` — Time slot button with status
- `components/BookingStatusCard.tsx` — Booking card with accept/reject actions

#### Sample Data
- 4 pre-loaded saloons: Delhi (Sharma Hair Studio), Mumbai (Royal Barbers), Chennai (Balaji Hair Salon), Bangalore (Gupta Gents Parlour)
- Auto-generated slots for 7 days based on each saloon's working hours

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/saloon run dev` — run mobile app dev server
