import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AddFriendForm from './AddFriendForm'

export default async function FriendsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get accepted friends
  const { data: friendships } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id,
      friend_id,
      status,
      profiles!friendships_friend_id_fkey(id, username, display_name)
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted')

  // Get pending requests (where I'm the receiver)
  const { data: pendingRequests } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id,
      profiles!friendships_user_id_fkey(id, username, display_name)
    `)
    .eq('friend_id', user.id)
    .eq('status', 'pending')

  const friends = friendships?.map(f => {
    const friendProfile = f.profiles as any
    return {
      id: f.id,
      userId: friendProfile.id,
      username: friendProfile.username,
      displayName: friendProfile.display_name,
    }
  }) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-neutral-900 mb-2">Vrienden</h1>
        <p className="text-neutral-600">Voeg vrienden toe en bekijk hun boeken</p>
      </div>

      {/* Add Friend */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900 mb-4">Vriend toevoegen</h2>
        <AddFriendForm />
      </div>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-light text-neutral-900 mb-4">Verzoeken</h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => {
              const profile = request.profiles as any
              return (
                <div
                  key={request.id}
                  className="bg-white p-4 rounded-lg border border-neutral-200 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {profile.display_name || profile.username}
                    </p>
                    <p className="text-sm text-neutral-600">@{profile.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={`/api/friends/accept`} method="POST">
                      <input type="hidden" name="friendshipId" value={request.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                      >
                        Accepteren
                      </button>
                    </form>
                    <form action={`/api/friends/reject`} method="POST">
                      <input type="hidden" name="friendshipId" value={request.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
                      >
                        Weigeren
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h2 className="text-xl font-light text-neutral-900 mb-4">Mijn vrienden</h2>
        {friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/dashboard/friends/${friend.userId}`}
                className="bg-white p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
              >
                <p className="font-medium text-neutral-900">
                  {friend.displayName || friend.username}
                </p>
                <p className="text-sm text-neutral-600 mt-1">@{friend.username}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
            <p className="text-neutral-600">Je hebt nog geen vrienden toegevoegd</p>
          </div>
        )}
      </div>
    </div>
  )
}
