import { createServiceClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { allowed } = rateLimit(`reset-password:${ip}`, { limit: 5, windowSeconds: 60 })

    if (!allowed) {
      return Response.json(
        { error: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.' },
        { status: 429 }
      )
    }

    const { userId } = await params

    const supabase = createServiceClient()

    // Fetch user email from users table
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (fetchError || !user?.email) {
      return Response.json(
        { error: 'Nie znaleziono użytkownika lub brak adresu email.' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const sendEmail = body.sendEmail === true

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''
    const redirectTo = `${origin}/reset-password`

    if (sendEmail) {
      // Send password reset email via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo,
      })

      if (resetError) {
        return Response.json({ error: resetError.message }, { status: 500 })
      }

      return Response.json({ sent: true }, { status: 200 })
    }

    // Generate a one-time recovery link using Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: { redirectTo },
    })

    if (linkError) {
      return Response.json({ error: linkError.message }, { status: 500 })
    }

    return Response.json(
      { resetLink: linkData.properties.action_link },
      { status: 200 }
    )
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
