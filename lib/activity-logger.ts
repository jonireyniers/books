import { createClient } from '@/lib/supabase/client'

type ActivityType = 'finished_book' | 'started_book' | 'rated_book' | 'added_review' | 'added_friend'

export async function logActivity(
  activityType: ActivityType,
  bookId?: string,
  metadata?: Record<string, any>
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  await supabase.from('activities').insert({
    user_id: user.id,
    activity_type: activityType,
    book_id: bookId || null,
    metadata: metadata || null
  })
}
