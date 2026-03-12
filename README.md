# Kraina Zjeżdżalni — CRM

Wewnętrzny system CRM do zarządzania wypożyczalnią dmuchańców. Obsługuje rezerwacje, klientów, atrakcje, pracowników, statystyki i rozliczenia.

## Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + shadcn/ui + Tailwind CSS 4 |
| Stan | Zustand 5 (global) + React Query 5 (serwer) |
| Formularze | react-hook-form 7 + Zod 4 |
| Baza danych | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Wykresy | Recharts 2 |
| Kalendarz | react-big-calendar |
| Ikony | Lucide React |

## Wymagania

- Node.js 18+
- npm / pnpm / yarn
- Konto Supabase z skonfigurowaną bazą danych

## Zmienne środowiskowe

Utwórz plik `.env.local` w katalogu `kraina-app-react/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
NEXT_PUBLIC_COMPANY_ADDRESS=Warszawa, Polska
NEXT_PUBLIC_APP_NAME=Kraina Zjeżdżalni
```

## Uruchomienie

```bash
cd kraina-app-react
npm install
npm run dev
```

Aplikacja dostępna pod `http://localhost:3000`.

## Komendy

| Komenda | Opis |
|---------|------|
| `npm run dev` | Serwer deweloperski (Turbopack) |
| `npm run build` | Budowanie produkcyjne |
| `npm run start` | Uruchomienie wersji produkcyjnej |
| `npm run lint` | ESLint |

## Struktura projektu

```
src/
├── app/
│   ├── layout.tsx              # Root layout, providers
│   ├── page.tsx                # Redirect → /login lub /app
│   ├── login/                  # Strona logowania
│   ├── reset-password/         # Reset hasła
│   ├── api/                    # Route handlers (auth, users)
│   └── app/                    # Chroniona strefa aplikacji
│       ├── layout.tsx          # Sidebar + TopHeader
│       ├── dashboard/          # Dashboard z KPI i wykresami
│       ├── rentals/            # Zarządzanie wypożyczeniami
│       ├── calendar/           # Widok kalendarza
│       ├── attractions/        # Zarządzanie atrakcjami
│       ├── clients/            # Baza klientów
│       ├── users/              # Zarządzanie użytkownikami
│       ├── statistics/         # Statystyki, analityka, przychody, koszty, wypłaty
│       ├── profile/            # Profil użytkownika
│       └── settings/           # Ustawienia aplikacji
├── components/
│   ├── ui/                     # shadcn/ui (button, dialog, table, itp.)
│   ├── layout/                 # AppSidebar, TopHeader, MainShell, PageHeader
│   ├── rentals/                # RentalForm, RentalDetailDialog, RentalRow
│   ├── attractions/            # AttractionForm
│   ├── clients/                # ClientDetailDialog
│   ├── calendar/               # CalendarView, CalendarHeader, EventBadge
│   ├── users/                  # UserForm
│   └── common/                 # LoadingSpinner
├── hooks/                      # useRentals, useClients, useAttractions, useUsers,
│                               # useAuth, useAvailability, useCostCalculation,
│                               # useDistance, useExpenses
├── store/                      # Zustand: auth, settings, filters, app, ui
├── lib/
│   ├── constants.ts            # Stałe (kolory, statusy, etykiety, kategorie)
│   ├── types.ts                # Typy TypeScript (User, Rental, Attraction, itp.)
│   ├── schemas.ts              # Schematy Zod walidacji
│   ├── form-utils.ts           # createZodResolver — generyczny resolver
│   ├── supabase.ts             # Klient Supabase (browser)
│   ├── supabase-server.ts      # Klient Supabase (server)
│   ├── env.ts                  # Walidacja zmiennych środowiskowych (Zod)
│   ├── utils.ts                # Helpery (cn, formatPrice, formatDate, itp.)
│   ├── page-meta.ts            # Metadane stron (tytuły, opisy)
│   └── rate-limit.ts           # Rate limiting dla API
├── providers/                  # AppProviders, QueryProvider
├── calendar/                   # Typy i helpery kalendarza
└── styles/                     # calendar.css
```

## Role użytkowników

| Rola | Uprawnienia |
|------|-------------|
| `employee` | Przeglądanie, tworzenie i edycja wypożyczeń, oznaczanie montażu/demontażu |
| `admin` | Jak employee + zarządzanie atrakcjami, użytkownikami, pełne statystyki |
| `owner` | Pełne uprawnienia, w tym usuwanie danych |

## Główne funkcje

- **Dashboard** — KPI, wykresy statusów, trend przychodów, top atrakcje, szybkie akcje
- **Wypożyczenia** — 3-krokowy kreator (atrakcje → klient → podsumowanie), filtrowanie, statusy
- **Kalendarz** — widok miesiąca/tygodnia/dnia z react-big-calendar
- **Atrakcje** — CRUD dmuchańców z galeriami zdjęć
- **Klienci** — automatyczne rozpoznawanie, historia rezerwacji
- **Użytkownicy** — zarządzanie pracownikami, stawki montażu/demontażu
- **Statystyki** — analityka, przychody, koszty, wypłaty pracowników
- **Kalkulacja odległości** — Supabase Edge Function + Google Distance Matrix
- **Motyw** — jasny/ciemny z next-themes

## Dokumentacja techniczna

Szczegółowy opis architektury, schematu bazy danych, modeli danych i logiki biznesowej znajduje się w pliku [`technical_appGuide.md`](../technical_appGuide.md) w katalogu głównym repozytorium.
