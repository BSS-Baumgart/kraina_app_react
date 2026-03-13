import { createServiceClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { allowed } = rateLimit(`change-password:${ip}`, { limit: 5, windowSeconds: 60 })

    if (!allowed) {
      return Response.json(
        { error: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.' },
        { status: 429 }
      )
    }

    const { userId } = await params
    const body = await request.json().catch(() => ({}))
    const { password } = body

    if (!password || typeof password !== 'string' || password.length < 6) {
      return Response.json(
        { error: 'Hasło musi mieć co najmniej 6 znaków.' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
