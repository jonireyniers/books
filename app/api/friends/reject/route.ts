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

  console.log('Rejecting friendship:', { friendshipId, userId: user.id })

  // First, check if the friendship exists and who is the recipient
  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .single()

  console.log('Found friendship:', friendship, 'Error:', fetchError)

  if (fetchError || !friendship) {
    return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
  }

  // Only allow rejection if current user is the recipient (friend_id)
  if (friendship.friend_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized - you can only reject requests sent to you' }, { status: 403 })
  }

  // Delete friendship request
  const { error: deleteError, count } = await supabase
    .from('friendships')
    .delete({ count: 'exact' })
    .eq('id', friendshipId)

  console.log('Delete result:', { error: deleteError, count })

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Revalidate the friends page to show updated list
  revalidatePath('/dashboard/friends')
  
  return NextResponse.json({ success: true })
}
