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
- **Preview**: `/` (root path)
- **Description**: Two-sided saloon booking app for Indian local saloon shops
- **Storage**: AsyncStorage (no backend required)
- **Languages**: English + Hindi (हिंदी)

#### Architecture
- **Two roles**: Customer and Saloon Owner (selected at launch)
- **Customer side**: Browse saloons by city, see open/closed status, book available slots, view booking status
- **Owner side**: Register shop, manage time slots, accept/reject booking requests, toggle open/closed
- **Booking flow**: Customer requests slot (pending) → Owner gets notification → Owner accepts/rejects → If accepted, 10-min reminder scheduled for customer
- **No pricing** shown on customer side

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
