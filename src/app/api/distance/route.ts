import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json()

    if (!origin || !destination) {
      return Response.json(
        { error: 'origin i destination są wymagane' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        { error: 'Brak konfiguracji Supabase' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.functions.invoke('distance', {
      body: { origin, destination },
    })

    if (error) {
      return Response.json(
        { error: 'Błąd połączenia z API dystansu' },
        { status: 502 }
      )
    }

    return Response.json(data)
  } catch {
    return Response.json(
      { error: 'Nieoczekiwany błąd serwera' },
      { status: 500 }
    )
  }
}
