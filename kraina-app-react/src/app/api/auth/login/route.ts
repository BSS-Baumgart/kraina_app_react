import { supabase } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limit by IP — max 5 login attempts per 60 seconds
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { allowed, remaining, resetTime } = rateLimit(`login:${ip}`, { limit: 5, windowSeconds: 60 })

    if (!allowed) {
      return Response.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return Response.json(
        { error: error.message },
        {
          status: 401,
          headers: { 'X-RateLimit-Remaining': String(remaining) },
        }
      )
    }

    return Response.json(data, { status: 200 })
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
