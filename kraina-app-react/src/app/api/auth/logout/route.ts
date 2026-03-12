import { supabase } from '@/lib/supabase'

export async function POST(_request: Request) {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return Response.json({ message: 'Logged out successfully' }, { status: 200 })
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
