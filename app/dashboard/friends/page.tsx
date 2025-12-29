'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddFriendForm from './AddFriendForm'

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    console.log('loadData: Starting fresh data fetch')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get accepted friends - force fresh query
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')
    
    console.log('loadData: Accepted friendships:', friendships?.length, friendships)
    if (friendshipsError) console.error('Friendships error:', friendshipsError)

    // Get pending requests (where I'm the receiver) - force fresh query
    const { data: pendingReqs, error: pendingError } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending')
    
    console.log('loadData: Pending requests:', pendingReqs?.length, pendingReqs)
    if (pendingError) console.error('Pending error:', pendingError)

    // Get sent requests (where I'm the sender) - force fresh query
    const { data: sentReqs, error: sentError } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
    
    console.log('loadData: Sent requests:', sentReqs?.length, sentReqs)
    if (sentError) console.error('Sent error:', sentError)

    // Get all profiles for the friends/requests
    const allUserIds = new Set<string>()
    friendships?.forEach(f => {
      allUserIds.add(f.user_id === user.id ? f.friend_id : f.user_id)
    })
    pendingReqs?.forEach(r => allUserIds.add(r.user_id))
    sentReqs?.forEach(r => allUserIds.add(r.friend_id))

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', Array.from(allUserIds))

    const pMap = new Map(profiles?.map(p => [p.id, p]) || [])
    setProfileMap(pMap)

    const friendsList = friendships?.map(f => {
      const friendId = f.user_id === user.id ? f.friend_id : f.user_id
      const profile = pMap.get(friendId)
      return {
        id: f.id,
        userId: friendId,
        username: profile?.username,
        displayName: profile?.display_name,
      }
    }) || []

    console.log('loadData: Setting state - friends:', friendsList.length, 'pending:', (pendingReqs || []).length, 'sent:', (sentReqs || []).length)
    
    // Force new array references to trigger re-render
    setFriends([...friendsList])
    setPendingRequests([...(pendingReqs || [])])
    setSentRequests([...(sentReqs || [])])
    setRefreshKey(prev => prev + 1)
    setLoading(false)
    
    console.log('loadData: State updated')
  }

  async function handleAccept(friendshipId: string) {
    try {
      const formData = new FormData()
      formData.append('friendshipId', friendshipId)
      
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        // Reload data
        await loadData()
      }
    } catch (error) {
      console.error('Error accepting friend:', error)
    }
  }

  async function handleReject(friendshipId: string) {
    try {
      console.log('Rejecting friendship:', friendshipId)
      
      // Optimistically update UI first
      setPendingRequests(prev => {
        const updated = prev.filter(req => req.id !== friendshipId)
        console.log('Optimistic update - remaining requests:', updated.length)
        return updated
      })
      
      const formData = new FormData()
      formData.append('friendshipId', friendshipId)
      
      const response = await fetch('/api/friends/reject', {
        method: 'POST',
        body: formData,
      })
      
      console.log('Reject response:', response.status, response.ok)
      
      if (!response.ok) {
        // If API fails, reload to restore correct state
        const error = await response.json()
        console.error('Reject API error:', error)
        alert('Fout bij weigeren: ' + (error.error || 'Onbekende fout'))
        await loadData()
      } else {
        const result = await response.json()
        console.log('Reject successful:', result)
      }
    } catch (error) {
      console.error('Error rejecting friend:', error)
      alert('Er is een fout opgetreden. Probeer het opnieuw.')
      // Reload on error to restore correct state
      await loadData()
    }
  }

  async function handleRemove(friendshipId: string) {
    if (!confirm('Weet je zeker dat je deze vriend wilt verwijderen?')) {
      return
    }

    try {
      // Optimistically update UI first
      setFriends(prev => {
        const updated = prev.filter(f => f.id !== friendshipId)
        console.log('Optimistic remove - remaining friends:', updated.length)
        return updated
      })
      
      const formData = new FormData()
      formData.append('friendshipId', friendshipId)
      
      const response = await fetch('/api/friends/remove', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        // If API fails, reload to restore correct state
        console.error('Remove failed, reloading data')
        await loadData()
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      // Reload on error to restore correct state
      await loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neutral-500">Laden...</div>
      </div>
    )
  }

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
        <div key={`pending-${refreshKey}`}>
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
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                    >
                      Accepteren
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
                    >
                      Weigeren
                    </button>
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
              <div
                key={friend.id}
                className="bg-white p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors flex justify-between items-start"
              >
                <Link
                  href={`/dashboard/friends/${friend.userId}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-neutral-900">
                    {friend.displayName || friend.username}
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">@{friend.username}</p>
                </Link>
                <button
                  onClick={() => handleRemove(friend.id)}
                  className="text-neutral-400 hover:text-red-600 transition-colors p-1 ml-3"
                  title="Vriend verwijderen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
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
