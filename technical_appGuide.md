# Kraina Zjeżdżalni — Technical App Guide

> **App purpose:** Internal CRM / operations tool for a bouncy castle rental company. Used by employees and admins to manage rental bookings, track attractions, assign staff, and view schedules.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Supabase Setup & Connection](#2-supabase-setup--connection)
3. [Database Schema](#3-database-schema)
4. [Data Models](#4-data-models)
5. [Authentication Flow](#5-authentication-flow)
6. [Core Features & Business Logic](#6-core-features--business-logic)
7. [Screens / Pages](#7-screens--pages)
8. [External Integrations](#8-external-integrations)
9. [Role-Based Access Control](#9-role-based-access-control)
10. [Implementation Details](#10-implementation-details)

---

## 1. Architecture Overview

```
Next.js 16 App (App Router + Turbopack)
│
├── src/app/
│   ├── layout.tsx                  # Root layout, AppProviders
│   ├── page.tsx                    # Redirect → /login or /app
│   ├── login/page.tsx              # Login page
│   ├── api/                        # Route handlers (auth, users)
│   └── app/                        # Protected app shell
│       ├── layout.tsx              # Sidebar + TopHeader shell
│       ├── dashboard/page.tsx      # KPI cards, charts, rental lists
│       ├── rentals/page.tsx        # Rental management
│       ├── calendar/page.tsx       # Calendar view
│       ├── attractions/page.tsx    # Attraction CRUD
│       ├── clients/page.tsx        # Client list
│       ├── users/page.tsx          # User management
│       ├── statistics/             # Stats, analytics, revenue, costs, payroll
│       ├── profile/page.tsx        # User profile
│       └── settings/page.tsx       # App settings
├── src/components/                 # UI components by domain
├── src/hooks/                      # React Query hooks (data fetching)
├── src/store/                      # Zustand stores (client state)
├── src/lib/                        # Constants, types, schemas, utilities
└── src/providers/                  # AppProviders, QueryProvider
```

**State management:**
- **Server state:** React Query (`@tanstack/react-query`) — caches Supabase data, handles mutations with optimistic updates and cache invalidation
- **Client state:** Zustand stores — `auth.store` (user session), `settings.store` (user preferences), `filters.store` (page filters), `app.store` (global app state), `ui.store` (UI state)
- **Form state:** react-hook-form with Zod validation via `createZodResolver<T>()` utility

---

## 2. Supabase Setup & Connection

### Environment variables (`.env`)

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJh...
GOOGLE_CALENDAR_ID=xxxxxx@group.calendar.google.com
GOOGLE_CALENDAR_GUEST_EMAIL=optionalguest@example.com
```

### Initialization (equivalent code for React / JS)

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Supabase Storage Buckets

| Bucket name  | Purpose                            | Path pattern            |
|--------------|------------------------------------|-------------------------|
| `attractions` | Attraction photos (max 3 per item) | `{attractionId}/{uuid}.jpg` |
| `contracts`   | Signed contract photos             | `{rentalId}/{uuid}.jpg` |

Both buckets use **public URLs** (no signed URLs needed). File names are UUID-generated to avoid collisions.

---

## 3. Database Schema

### Table: `users`

> Mirrors Supabase Auth users. `id` = `auth.users.id` (UUID).

| Column             | Type        | Notes                                    |
|--------------------|-------------|------------------------------------------|
| `id`               | uuid PK     | Same as Supabase Auth UID                |
| `first_name`       | text        |                                          |
| `last_name`        | text        |                                          |
| `phone`            | text        |                                          |
| `email`            | text        | nullable                                 |
| `address`          | text        | nullable                                 |
| `role`             | text        | `'employee'` \| `'admin'` \| `'owner'`  |
| `is_active`        | boolean     | default true                             |
| `assembly_rate`    | numeric     | PLN per single assembly action           |
| `disassembly_rate` | numeric     | PLN per single disassembly action        |
| `avatar_url`       | text        | nullable                                 |
| `created_at`       | timestamptz | default now()                            |

### Table: `attractions`

> Bouncy castle / inflatable items available for rental.

| Column         | Type        | Notes                          |
|----------------|-------------|--------------------------------|
| `id`           | uuid PK     |                                |
| `name`         | text        |                                |
| `description`  | text        |                                |
| `width`        | numeric     | Metres                         |
| `length`       | numeric     | Metres                         |
| `height`       | numeric     | Metres                         |
| `weight`       | numeric     | Kilograms                      |
| `rental_price` | numeric     | Base price in PLN              |
| `image_urls`   | text[]      | Array of up to 3 public URLs   |
| `category`     | text        | nullable                       |
| `is_active`    | boolean     | default true (soft delete)     |
| `created_by`   | uuid        | FK → users.id                  |
| `created_at`   | timestamptz |                                |

### Table: `rentals`

> Core table — one row per booking.

| Column                  | Type        | Notes                                                      |
|-------------------------|-------------|------------------------------------------------------------|
| `id`                    | uuid PK     |                                                            |
| `date`                  | date        | Rental date (no time component)                            |
| `setup_time`            | text        | `"HH:mm"` format, default `"09:00"`                        |
| `teardown_time`         | text        | `"HH:mm"` format, default `"18:00"`                        |
| `client_name`           | text        |                                                            |
| `client_phone`          | text        |                                                            |
| `address`               | text        | Full delivery address                                      |
| `latitude`              | numeric     | From geocoding                                             |
| `longitude`             | numeric     | From geocoding                                             |
| `attraction_ids`        | uuid[]      | Array of attraction IDs                                    |
| `rental_cost`           | numeric     | Auto-calculated sum of attraction prices                   |
| `delivery_cost`         | numeric     | Calculated from distance                                   |
| `custom_price`          | numeric     | nullable — overrides rental_cost if set                    |
| `distance_km`           | numeric     | nullable — km from company depot to delivery address       |
| `assigned_employee_id`  | uuid        | nullable — FK → users.id (legacy primary assignment)       |
| `status`                | text        | See `RentalStatus` enum below                              |
| `notes`                 | text        | nullable — internal notes                                  |
| `contract_photo_url`    | text        | nullable — public URL of signed contract photo             |
| `created_by`            | uuid        | FK → users.id                                              |
| `calendar_event_id`     | text        | nullable — Google Calendar event ID                        |
| `created_at`            | timestamptz |                                                            |
| `updated_at`            | timestamptz | nullable                                                   |

### Table: `employee_assignments`

> Many-to-many: which employees worked on which rental, and whether they assembled/disassembled.

| Column             | Type        | Notes                               |
|--------------------|-------------|-------------------------------------|
| `id`               | uuid PK     |                                     |
| `rental_id`        | uuid        | FK → rentals.id                     |
| `employee_id`      | uuid        | FK → users.id                       |
| `did_assembly`     | boolean     | default false                       |
| `did_disassembly`  | boolean     | default false                       |
| `assembly_time`    | timestamptz | nullable — when assembly was marked |
| `disassembly_time` | timestamptz | nullable — when disassembly marked  |

**Important:** Rentals are fetched with assignments using a join:
```sql
SELECT *, employee_assignments(*) FROM rentals ORDER BY date DESC;
```
This means `employee_assignments` rows are nested under each rental row in the response.

---

## 4. Data Models

### Enums

#### `UserRole`
| Value      | Display name    |
|------------|-----------------|
| `employee` | Pracownik       |
| `admin`    | Administrator   |
| `owner`    | Właściciel      |

#### `RentalStatus`
| Value         | Display name | Color (hex)  |
|---------------|--------------|--------------|
| `pending`     | Oczekujący   | `#FBBF24`    |
| `confirmed`   | Potwierdzony | `#22C55E`    |
| `inProgress`  | W trakcie    | `#3B82F6`    |
| `completed`   | Zakończony   | `#6366F1`    |
| `cancelled`   | Anulowany    | `#EF4444`    |

### TypeScript interfaces (for React)

```ts
type UserRole = 'employee' | 'admin' | 'owner'
type RentalStatus = 'pending' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled'

interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  role: UserRole
  avatarUrl?: string
  isActive: boolean
  assemblyRate: number     // PLN per assembly
  disassemblyRate: number  // PLN per disassembly
  createdAt: string        // ISO 8601
  // computed:
  fullName: string         // `${firstName} ${lastName}`
  initials: string         // first letters of first+last name
}

interface Attraction {
  id: string
  name: string
  description: string
  width: number            // metres
  length: number           // metres
  height: number           // metres
  weight: number           // kg
  rentalPrice: number      // PLN base price
  imageUrls: string[]      // max 3 public URLs
  category?: string
  isActive: boolean
  createdAt: string
  createdBy?: string       // user id
  // computed:
  dimensions: string       // "Szer. Xm × Dł. Xm × Wys. Xm"
  formattedPrice: string   // "X zł"
  primaryImageUrl: string  // imageUrls[0] or ''
}

interface EmployeeAssignment {
  employeeId: string
  didAssembly: boolean
  didDisassembly: boolean
  assemblyTime?: string    // ISO 8601
  disassemblyTime?: string // ISO 8601
}

interface AssemblyRecord {
  attractionId: string
  employeeId: string
  timestamp: string        // ISO 8601
  isAssembly: boolean      // true=assembly, false=disassembly
}

interface Rental {
  id: string
  date: string             // "YYYY-MM-DD"
  setupTime: string        // "HH:mm"
  teardownTime: string     // "HH:mm"
  clientName: string
  clientPhone: string
  address: string
  latitude: number
  longitude: number
  attractionIds: string[]
  rentalCost: number       // sum of attraction prices
  deliveryCost: number
  customPrice?: number     // overrides rentalCost if set
  distanceKm?: number
  assignedEmployeeId?: string
  assignedEmployees: EmployeeAssignment[]
  status: RentalStatus
  notes?: string
  contractPhotoUrl?: string
  createdById: string
  createdAt: string
  updatedAt?: string
  assemblyRecords: AssemblyRecord[]
  disassemblyRecords: AssemblyRecord[]
  calendarEventId?: string
  // computed:
  totalCost: number        // (customPrice ?? rentalCost) + deliveryCost
  hasContract: boolean
}
```

---

## 5. Authentication Flow

Authentication uses **Supabase Auth** with email + password.

### Login flow

```
User enters email + password
  → supabase.auth.signInWithPassword({ email, password })
  → On success: session = { accessToken, refreshToken, user }
  → Fetch user profile from `users` table WHERE id = session.user.id
  → Load all app data (attractions, users, rentals)
```

### Session persistence

- **Android app:** tokens stored in device keychain (`flutter_secure_storage` with `EncryptedSharedPreferences`)
- **React web:** use Supabase's built-in session storage (`localStorage` by default) or set `auth.storage` to `sessionStorage` for more security
- On app start, call `supabase.auth.getSession()` or `refreshSession()` to restore session without re-login

### Session refresh

The app calls `supabase.auth.refreshSession()` on every cold start. If the refresh fails (token expired), the user is redirected to the login screen.

### Logout

```ts
await supabase.auth.signOut()
// Clear any local state
```

### User profile

The `auth.users` table is separate from the app's `users` table. After auth, the app makes a second query to get the full user profile (role, rates, phone, etc.) using `session.user.id` as the key.

---

## 6. Core Features & Business Logic

### 6.1 Availability / Conflict Detection

An attraction is **unavailable** on a date+time if:
- Another rental on the same date uses the same attraction AND
- The time ranges **overlap** (`setupTime..teardownTime`)
- Cancelled rentals are excluded from conflict checks

Time overlap formula:
```
overlap = mySetup < otherTeardown AND otherSetup < myTeardown
```
Times are stored as `"HH:mm"` strings, converted to minutes-since-midnight for comparison.

### 6.2 Cost Calculation

```
rentalCost  = sum of rentalPrice of all selected attractions
deliveryCost = calculated from distance via Google Distance Matrix API
               (company depot → delivery address)
totalCost   = (customPrice ?? rentalCost) + deliveryCost
```

`customPrice` is an optional override set by admin if a special price was negotiated with the client.

### 6.3 Employee Assignment & Earnings

Employees are assigned to rentals via the `employee_assignments` table.  
Each assignment tracks:
- `didAssembly` — toggled when employee marks themselves as having set up the attraction on-site
- `didDisassembly` — toggled when employee marks disassembly

Employee **earnings** per rental:
```
earnings = (assemblies × assemblyRate) + (disassemblies × disassemblyRate)
```
where `assemblyRate` and `disassemblyRate` are stored on the `users` record in PLN.

### 6.4 Rental Status Lifecycle

```
pending → confirmed → inProgress → completed
                    ↘ cancelled
```
Any status can transition to `cancelled`. Status changes also trigger an update to the linked Google Calendar event.

### 6.5 Statistics

Computed client-side from the loaded rentals array:
- Total / completed / pending rental counts
- Total revenue (completed rentals only)
- Rentals grouped by assigned employee
- Rentals grouped by geographical area (last segment of address)
- Monthly breakdown for the past 6 months (count + revenue)

Employee-specific stats:
- Total assemblies & disassemblies (from `assemblyRecords`)
- Total earnings for the period
- Monthly breakdown

---

## 7. Screens / Pages

### Landing → Route: `/`
- Checks auth status, redirects to `/app/dashboard` or `/login`

### Login → Route: `/login`
- Email + password form with Zod validation
- Calls Supabase Auth `signInWithPassword`

### Reset Password → Route: `/reset-password`
- Password reset flow via Supabase Auth

### App Shell → Route: `/app`
- Layout with collapsible sidebar (`AppSidebar`) + top header (`TopHeader`)
- Breadcrumb navigation (`AppBreadcrumb`)
- Protected — redirects unauthenticated users to `/login`

### Dashboard → Route: `/app/dashboard`
- Role-aware KPI cards (revenue, rentals count, top attraction, pending count)
- Status pie chart, weekly revenue trend, top attractions bar chart
- Today's rentals and upcoming rentals lists
- Quick action buttons (new rental, calendar, attractions)
- KPI month click → navigates to rentals with date filter params

### Rentals → Route: `/app/rentals`
- Paginated table with status filtering and search
- New/edit rental via 3-step dialog (`RentalForm`):
  1. **Atrakcje** — date, setup/teardown time, attraction grid with availability check
  2. **Klient** — client search/autocomplete, address, distance calculation
  3. **Podsumowanie** — cost breakdown, custom price, notes
- Detail dialog (`RentalDetailDialog`) with status transitions and employee assignments

### Calendar → Route: `/app/calendar`
- `react-big-calendar` with month/week/day views
- Color-coded events by rental status
- Click event → rental detail

### Attractions → Route: `/app/attractions`
- Card grid of attractions with image, name, dimensions, price
- Admin/Owner: add/edit via `AttractionForm` dialog
- Soft delete (deactivation)

### Clients → Route: `/app/clients`
- Searchable client list, auto-populated from rental history
- Detail dialog with rental history

### Users → Route: `/app/users` (admin/owner only)
- User management table
- Add/edit user via `UserForm` dialog (name, email, phone, role, rates)

### Statistics → Route: `/app/statistics`
- **Overview** (`/statistics`) — rental counts, status breakdown, trends
- **Analytics** (`/statistics/analytics`) — detailed charts with CHART_COLORS_EXTENDED
- **Revenue** (`/statistics/revenue`) — revenue by month/week/day with granularity selector
- **Costs** (`/statistics/costs`) — expense tracking and categories
- **Payroll** (`/statistics/payroll`) — employee earnings based on assembly/disassembly rates

### Profile → Route: `/app/profile`
- Edit own profile (name, phone, address)
- Theme toggle (light/dark via next-themes)

### Settings → Route: `/app/settings`
- App-wide configuration

---

## 8. External Integrations

### 8.1 Google Calendar (Service Account)

**Purpose:** Every rental automatically creates a Google Calendar event for operational scheduling.

**Auth method:** Service Account JSON key (stored in `assets/google_service_account.json`). The service account is granted access to a shared Google Calendar.

**Environment vars required:**
```
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_CALENDAR_GUEST_EMAIL=optional-guest@company.com
```

**Operations:**
| Action | When triggered |
|--------|---------------|
| `createEvent` | When a new rental is saved |
| `updateEvent` | When rental is edited or status changes |
| `deleteEvent` | When rental is deleted |

**Event format:**
- **Title:** `🎪 {clientName} – {attractionName1}, {attractionName2}`
- **All-day event** or timed event from `setupTime` to `teardownTime`
- **Description:** includes client phone, address, attraction list with prices, total cost, distance, assigned employee
- **Colorscheme** reflects rental status
- Guests can be auto-invited (via `GOOGLE_CALENDAR_GUEST_EMAIL`)

> **Note:** Calendar integration is **non-blocking** — if it fails, the rental is still saved. Errors are logged but don't interrupt the flow.

**React implementation:** Use `googleapis` npm package with service account JWT auth, or call via a server-side API route (Next.js route handler / Express endpoint) since service account credentials must never be exposed client-side.

### 8.2 Google Distance Matrix API

**Purpose:** Calculate delivery distance (km) and estimated drive time from company depot to client address when creating/editing a rental.

**Endpoint:**
```
GET https://maps.googleapis.com/maps/api/distancematrix/json
  ?origins={companyAddress}
  &destinations={clientAddress}
  &key={GOOGLE_API_KEY}
  &language=pl
  &units=metric
```

**Response used:**
```json
{
  "distanceKm": 15.3,
  "durationMinutes": 22,
  "distanceText": "15,3 km",
  "durationText": "22 min"
}
```

Company origin address is currently hardcoded as `"Warszawa, Polska"` — should be moved to a config setting.

**React:** Can be called directly from the browser (if the API key has HTTP referrer restrictions set) or proxied through a server route.

---

## 9. Role-Based Access Control

| Feature                          | Employee | Admin | Owner |
|----------------------------------|----------|-------|-------|
| View calendar / rentals          | ✅       | ✅    | ✅    |
| Create new rental                | ✅       | ✅    | ✅    |
| Edit existing rental             | ✅       | ✅    | ✅    |
| Delete rental                    | ❌       | ✅    | ✅    |
| Change rental status             | ✅       | ✅    | ✅    |
| Mark assembly / disassembly      | ✅       | ✅    | ✅    |
| Upload contract photo            | ✅       | ✅    | ✅    |
| View attractions                 | ✅       | ✅    | ✅    |
| Add / edit attractions           | ❌       | ✅    | ✅    |
| Delete (deactivate) attractions  | ❌       | ✅    | ✅    |
| View statistics                  | ✅ (own) | ✅    | ✅    |
| View all employee stats          | ❌       | ✅    | ✅    |
| Manage users (add/edit/delete)   | ❌       | ✅    | ✅    |
| View own profile                 | ✅       | ✅    | ✅    |

> Roles are stored in the `users` table as strings. **Supabase RLS policies should enforce these rules server-side** — do not rely only on client-side checks.

---

## 10. Implementation Details

### Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | Framework (App Router + Turbopack) |
| react | 19.2.4 | UI library |
| @supabase/supabase-js | 2.99 | Database, Auth, Storage |
| @supabase/ssr | 0.9 | Server-side Supabase client |
| @tanstack/react-query | 5.90 | Server state management |
| zustand | 5.0 | Client state management |
| react-hook-form | 7.71 | Form management |
| zod | 4.3 | Schema validation |
| shadcn/ui + radix-ui | 1.4 | UI component library |
| tailwindcss | 4 | Styling |
| recharts | 2.15 | Charts (Area, Pie, Bar) |
| react-big-calendar | 1.19 | Calendar views |
| lucide-react | 0.577 | Icons |
| date-fns | 4.1 | Date utilities |
| next-themes | 0.4 | Dark/light theme |
| sonner | 2.0 | Toast notifications |

### Supabase Client Setup

```ts
// src/lib/supabase.ts — browser client
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

```ts
// src/lib/supabase-server.ts — server client for Route Handlers
import { createServerClient } from '@supabase/ssr'
```

### Data Fetching Pattern (React Query Hooks)

All data access goes through custom hooks in `src/hooks/`:

```ts
// Example: useRentals.ts
export function useRentals() {
  return useQuery({
    queryKey: ['rentals'],
    queryFn: () => supabase.from('rentals')
      .select('*, employee_assignments(*)')
      .order('date', { ascending: false }),
  })
}
```

Available hooks: `useRentals`, `useClients`, `useAttractions`, `useUsers`, `useAuth`, `useAvailability`, `useCostCalculation`, `useDistance`, `useExpenses`

### Zustand Stores

| Store | Purpose |
|-------|---------|
| `auth.store` | Current user session, role, `canManage` flag |
| `settings.store` | User preferences (theme, language) |
| `filters.store` | Active page filters (date range, status, search) |
| `app.store` | Global app state |
| `ui.store` | UI state (sidebar collapsed, modals) |

### Form Validation

Forms use Zod schemas with a generic resolver:

```ts
// src/lib/form-utils.ts
export function createZodResolver<T>(schema: z.ZodSchema): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data, errors: {} }
    // Map Zod issues to react-hook-form errors
  }
}
```

### Constants & Types

All shared constants are centralized in `src/lib/constants.ts`:
- `STATUS_DISPLAY`, `STATUS_COLORS` — rental status labels and colors
- `BRAND_COLORS`, `GRADIENTS` — app theming
- `CHART_COLORS`, `CHART_COLORS_EXTENDED` — chart palettes
- `STATUS_OPTIONS`, `STATUS_ORDER` — filter options
- `STATUS_TRANSITIONS` — valid status change map
- `ATTRACTION_CATEGORIES` — category options
- `ROLE_LABELS`, `ROLE_VARIANTS` — user role display
- `MONTH_NAMES_SHORT`, `GRANULARITY_LABELS` — time-related labels

TypeScript types in `src/lib/types.ts`: `User`, `Rental`, `Client`, `Attraction`, `Expense`, `Assignment`, `UserRole`, `RentalStatus`, `PaymentType`, `Granularity`

### Mapping Supabase snake_case → camelCase

Supabase returns `snake_case` keys. Mapping is done in hooks/services:
```ts
const mapUser = (row: any): User => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  assemblyRate: row.assembly_rate,
  disassemblyRate: row.disassembly_rate,
  isActive: row.is_active,
  ...
})
```

### Environment Variables

Validated at startup via Zod schema in `src/lib/env.ts`:

| Variable | Required | Default |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | — |
| `NEXT_PUBLIC_COMPANY_ADDRESS` | No | `Warszawa, Polska` |
| `NEXT_PUBLIC_APP_NAME` | No | `Kraina Zjeżdżalni` |

### Brand Colors

```ts
const BRAND_COLORS = {
  primary:   '#3b86c6',
  secondary: '#ebcc7c',
  accent:    '#d98481',
  surface:   '#FDF9F0',
  text:      '#1A2744',
  border:    '#E8DFC4',
  chip:      '#FDF3D8',
}
```

---

*Last updated: February 2026*
