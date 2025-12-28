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
    .select('*')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted')

  // Get pending requests (where I'm the receiver)
  const { data: pendingRequests } = await supabase
    .from('friendships')
    .select('*')
    .eq('friend_id', user.id)
    .eq('status', 'pending')

  // Get sent requests (where I'm the sender)
  const { data: sentRequests } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')

  // Get all profiles for the friends/requests
  const allUserIds = new Set<string>()
  friendships?.forEach(f => {
    allUserIds.add(f.user_id === user.id ? f.friend_id : f.user_id)
  })
  pendingRequests?.forEach(r => allUserIds.add(r.user_id))
  sentRequests?.forEach(r => allUserIds.add(r.friend_id))

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', Array.from(allUserIds))

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  const friends = friendships?.map(f => {
    const friendId = f.user_id === user.id ? f.friend_id : f.user_id
    const profile = profileMap.get(friendId)
    return {
      id: f.id,
      userId: friendId,
      username: profile?.username,
      displayName: profile?.display_name,
    }
  }) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-2">Vrienden</h1>
        <p className="text-neutral-600">Voeg vrienden toe om elkaars boekenlijsten te bekijken en inspiratie op te doen.</p>
      </div>

      {/* Add Friend */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-medium text-neutral-900 mb-1">Vriend toevoegen</h2>
        <p className="text-sm text-neutral-600 mb-4">Zoek vrienden op basis van hun gebruikersnaam</p>
        <AddFriendForm />
      </div>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-light text-neutral-900 mb-4">Verzoeken ontvangen</h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => {
              const profile = profileMap.get(request.user_id)
              if (!profile) return null
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

      {/* Sent Requests */}
      {sentRequests && sentRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-light text-neutral-900 mb-4">Verzoeken verstuurd</h2>
          <div className="space-y-2">
            {sentRequests.map((request) => {
              const profile = profileMap.get(request.friend_id)
              if (!profile) return null
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
                  <div className="text-sm text-neutral-500">
                    Wacht op acceptatie...
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
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-medium text-neutral-900 mb-2">Nog geen vrienden</h3>
            <p className="text-neutral-600 max-w-md mx-auto">
              Voeg vrienden toe via hun gebruikersnaam om hun openbare boekenlijsten te bekijken en leesinspiratie op te doen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
