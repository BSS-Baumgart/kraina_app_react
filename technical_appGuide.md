# Kraina Zjeżdżalni — Technical App Guide

> **Target audience:** React developer building a web version of this Android app.  
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
10. [React Implementation Notes](#10-react-implementation-notes)

---

## 1. Architecture Overview

```
Flutter App (Android)
│
├── main.dart                    # App entry, Supabase init, env loading
├── providers/app_provider.dart  # Global state (ChangeNotifier / Provider)
├── models/models.dart           # All data models
├── services/
│   ├── auth_service.dart        # Secure token storage (device keychain)
│   ├── storage_service.dart     # Supabase Storage (image uploads)
│   ├── distance_service.dart    # Google Distance Matrix API
│   └── google_calendar_service.dart  # Google Calendar API (Service Account)
├── screens/                     # Full-page views
└── widgets/                     # Reusable UI components (sheets, cards)
```

**State management:** A single `AppProvider` (Provider package) holds all loaded data in memory and exposes methods that read/write to Supabase. On startup the provider:
1. Refreshes the Supabase session
2. Loads `currentUser` from the `users` table
3. Loads all `attractions`, `users`, and `rentals` in parallel

**React equivalent:** Use React Query or Zustand/Redux for global state. Load all three datasets on login and cache them client-side, refreshing on mutations.

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

### `LandingScreen` → Route: `/`
- Checks if user is already authenticated
- If yes: navigates to main app shell
- If no: shows `LoginScreen`

### `LoginScreen` → Route: `/login`
- Email + password form
- Calls `loginUser(email, password)` on submit
- Shows loading state + error messages

### `MainShell` → Route: `/app`
- Bottom navigation bar with 4 tabs:
  1. **Terminarz** (Calendar/Schedule) — index 0
  2. **Atrakcje** (Attractions) — index 1
  3. **Statystyki** (Statistics) — index 2
  4. **Profil** (Profile) — index 3

### `CalendarScreen` (Terminarz) → Tab 0
- **3 view modes** (user preference saved in SharedPreferences):
  - **Miesiąc** (Month view): full month calendar with day-level rental count indicators; tapping a day shows that day's rentals below
  - **Tydzień** (Week view): 7-day horizontal strip with prev/next navigation; shows rental counts per day; tapping a day shows rentals below
  - **Lista** (Agenda view): chronological list split into "Nadchodzące" (upcoming) and "Historia" (past) tabs; days grouped with "Dziś"/"Jutro" labels
- Tap any day → shows list of rentals for that day
- Each rental entry shows: status badge, client name, address, setup/teardown times, attraction count
- "+ add" button on each day → opens `QuickBookingSheet` with that date pre-filled

### `AttractionsScreen` (Atrakcje) → Tab 1
- Grid/list of all active attractions
- Shows photo, name, dimensions, price
- **Admin/Owner only:** Add new attraction button → opens form sheet
- Tap attraction → detail view with all specs + photos
- **Admin/Owner only:** Edit / deactivate (soft delete) actions

### `StatisticsScreen` (Statystyki) → Tab 2
- Revenue charts (bar chart for last 6 months)
- Rental counts (total, completed, pending)
- Employee performance table (assemblies + disassemblies + earnings)
- Date range filter for the report data

### `ProfileScreen` (Profil) → Tab 3
- Shows current user's info: name, phone, role, address
- Edit profile form
- **Admin/Owner only:** User management (list all users, add/edit/deactivate users)
- Logout button
- Link to Privacy Policy

### `HelpScreen`
- Simple scrollable FAQ / help content

### `PrivacyPolicyScreen`
- Static text

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

## 10. React Implementation Notes

### Recommended Stack

```
Next.js 14+ (App Router)
├── @supabase/supabase-js        — DB + Auth + Storage
├── @tanstack/react-query        — Data fetching & caching
├── zustand                      — Global client state
├── shadcn/ui or MUI             — UI components
├── react-big-calendar           — Calendar views
├── recharts or Chart.js         — Statistics charts
├── @googlemaps/js-api-loader    — Maps / distance matrix
```

### Supabase client setup

```ts
// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Loading data on login

```ts
// Load all required data after successful auth
async function loadAppData(userId: string) {
  const [user, attractions, users, rentals] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('attractions').select('*').order('name'),
    supabase.from('users').select('*').order('first_name'),
    supabase.from('rentals').select('*, employee_assignments(*)').order('date', { ascending: false }),
  ])
  return { user, attractions, users, rentals }
}
```

### Mapping Supabase snake_case → camelCase

Supabase returns `snake_case` keys. Either use a transform layer or configure Supabase client:
```ts
// Option A: use supabase schema transform (manual mapping)
const mapUser = (row: any): User => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  assemblyRate: row.assembly_rate,
  disassemblyRate: row.disassembly_rate,
  isActive: row.is_active,
  ...
})

// Option B: use Supabase JS v2 with TypeScript types generated via CLI
// supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### File uploads

```ts
// Upload attraction image
const { data, error } = await supabase.storage
  .from('attractions')
  .upload(`${attractionId}/${crypto.randomUUID()}.jpg`, file, {
    contentType: file.type,
  })

const publicUrl = supabase.storage
  .from('attractions')
  .getPublicUrl(data!.path).data.publicUrl
```

### Availability check (client-side)

```ts
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function overlaps(
  aSetup: string, aTeardown: string,
  bSetup: string, bTeardown: string
): boolean {
  return timeToMinutes(aSetup) < timeToMinutes(bTeardown) &&
         timeToMinutes(bSetup) < timeToMinutes(aTeardown)
}

function getAvailableAttractions(
  attractions: Attraction[],
  rentals: Rental[],
  date: string,
  setupTime: string,
  teardownTime: string,
  excludeRentalId?: string
): Attraction[] {
  const bookedIds = new Set(
    rentals
      .filter(r => r.date === date && r.status !== 'cancelled')
      .filter(r => r.id !== excludeRentalId)
      .filter(r => overlaps(r.setupTime, r.teardownTime, setupTime, teardownTime))
      .flatMap(r => r.attractionIds)
  )
  return attractions.filter(a => a.isActive && !bookedIds.has(a.id))
}
```

### New rental flow (booking wizard)

The booking wizard has **3 steps**:
1. **Atrakcje** — select date, setup time, teardown time, pick attractions (filtered by availability)
2. **Klient** — enter client name, phone, delivery address (with distance calculation)
3. **Podsumowanie** — review all details, assign employee, set custom price, add notes, confirm

### Google Calendar (server-side only)

Calendar sync must run on the server (Next.js Route Handler or API route) because the service account JSON key cannot be in browser code.

```ts
// app/api/calendar/route.ts (Next.js)
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
  scopes: ['https://www.googleapis.com/auth/calendar'],
})

export async function POST(req: Request) {
  const { rental, attractions, employeeName } = await req.json()
  const calendar = google.calendar({ version: 'v3', auth: await auth.getClient() })
  // create/update/delete event...
}
```

### Brand Colors

```ts
// From AppTheme
const colors = {
  primary:    '#3b86c6',  // Blue
  secondary:  '#ebcc7c',  // Golden
  accent:     '#d98481',  // Coral/Pink
  surface:    '#FDF9F0',  // Warm white
  textPrimary:'#1A2744',  // Dark navy
  border:     '#E8DFC4',  // Warm beige
  chipBg:     '#FDF3D8',  // Warm golden tint
}

const gradients = {
  primary:    'linear-gradient(135deg, #2a75bb, #3b86c6)',
  accent:     'linear-gradient(135deg, #d98481, #ebcc7c)',
  gold:       'linear-gradient(135deg, #f0d68a, #ebcc7c)',
  background: 'linear-gradient(180deg, #FDF9F0, #e8f3fb)',
}
```

### Status badge colors

```ts
const statusColors: Record<RentalStatus, string> = {
  pending:    '#FBBF24',
  confirmed:  '#22C55E',
  inProgress: '#3B82F6',
  completed:  '#6366F1',
  cancelled:  '#EF4444',
}
```

---

*Last updated: February 2026*
