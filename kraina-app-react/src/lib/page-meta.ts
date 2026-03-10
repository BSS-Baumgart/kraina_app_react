export type PageMeta = { title: string; description: string }

export const pageMeta: Record<string, PageMeta> = {
  '/app/calendar':               { title: '📅 Terminarz',          description: 'Przeglądaj i zarządzaj rezerwacjami w widoku kalendarza.' },
  '/app/attractions':            { title: '⚡ Atrakcje',            description: 'Przeglądaj i zarządzaj dostępnymi atrakcjami.' },
  '/app/attractions/new':        { title: '➕ Dodaj nową atrakcję', description: 'Stwórz nową atrakcję w systemie.' },
  '/app/rentals':                { title: '📋 Rezerwacje',          description: 'Zarządzaj wszystkimi rezerwacjami.' },
  '/app/statistics':             { title: '📊 Statystyki',          description: 'Analizuj dane i raporty biznesowe.' },
  '/app/statistics/revenue':     { title: '💰 Przychody',           description: 'Analiza przychodów i trendów przychodowych.' },
  '/app/statistics/performance': { title: '⚡ Performance',         description: 'Wydajność i metryki operacyjne.' },
  '/app/statistics/costs':       { title: '💸 Analiza kosztów',     description: 'Szczegółowa analiza kosztów i marż zysku.' },
  '/app/clients':                { title: '👤 Klienci',              description: 'Przeglądaj klientów i ich historię rezerwacji.' },
  '/app/users':                  { title: '👥 Użytkownicy',         description: 'Zarządzaj użytkownikami i ich uprawnieniami.' },
  '/app/settings':               { title: '⚙️ Ustawienia',          description: 'Konfiguracja aplikacji i preferencji.' },
  '/app/profile':                { title: '👤 Profil',              description: 'Zarządzaj swoim profilem i ustawieniami.' },
}

export const defaultMeta: PageMeta = { title: '🎪 Kraina Zjeżdżalni', description: '' }

export function getPageMeta(pathname: string): PageMeta {
  return pageMeta[pathname] ?? defaultMeta
}
