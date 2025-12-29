import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const friendshipId = formData.get('friendshipId') as string

  // Delete friendship (works for both directions)
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Revalidate the friends page and dashboard to show updated lists
  revalidatePath('/dashboard/friends')
  revalidatePath('/dashboard')
  
  return NextResponse.json({ success: true })
}
