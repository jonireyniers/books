'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AddFriendForm() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find user by username
    const { data: friendProfile, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (searchError || !friendProfile) {
      setError('Gebruiker niet gevonden')
      setLoading(false)
      return
    }

    if (friendProfile.id === user.id) {
      setError('Je kan jezelf niet toevoegen als vriend')
      setLoading(false)
      return
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`)
      .single()

    if (existing) {
      setError('Deze persoon is al een vriend of er is al een verzoek verstuurd')
      setLoading(false)
      return
    }

    // Create friendship request
    const { error: createError } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendProfile.id,
        status: 'pending',
      })

    if (createError) {
      setError('Er ging iets mis')
      setLoading(false)
      return
    }

    setSuccess(true)
    setUsername('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
          Vriendschapsverzoek verstuurd!
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="gebruikersnaam"
          required
          className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Bezig...' : 'Toevoegen'}
        </button>
      </div>
    </form>
  )
}
