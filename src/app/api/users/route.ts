import { createServiceClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { allowed } = rateLimit(`create-user:${ip}`, { limit: 10, windowSeconds: 60 })

    if (!allowed) {
      return Response.json(
        { error: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, phone, address, role, assemblyRate, disassemblyRate, isActive } = body

    if (!email || !password || !firstName || !lastName || !phone) {
      return Response.json(
        { error: 'Wymagane pola: email, hasło, imię, nazwisko, telefon.' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        address: address || null,
        role: role || 'employee',
        assembly_rate: assemblyRate ?? 0,
        disassembly_rate: disassemblyRate ?? 0,
        is_active: isActive ?? true,
      })
      .select()
      .single()

    if (userError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      return Response.json({ error: userError.message }, { status: 500 })
    }

    return Response.json(userData, { status: 201 })
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
