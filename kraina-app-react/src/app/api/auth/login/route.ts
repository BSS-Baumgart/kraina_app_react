import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
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
        { status: 401 }
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
