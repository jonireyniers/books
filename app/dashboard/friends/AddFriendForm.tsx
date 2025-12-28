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

    // Check if search is empty
    if (!username.trim()) {
      setError('Voer een gebruikersnaam in')
      setLoading(false)
      return
    }

    // Find user by username (case-insensitive)
    const { data: friendProfiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', username.trim())

    console.log('Search results:', friendProfiles, 'Error:', searchError)

    if (searchError) {
      console.error('Database error:', searchError)
      setError('Er ging iets mis bij het zoeken')
      setLoading(false)
      return
    }

    if (!friendProfiles || friendProfiles.length === 0) {
      setError(`Gebruiker "${username}" niet gevonden. Controleer de spelling.`)
      setLoading(false)
      return
    }

    const friendProfile = friendProfiles[0]

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
          className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
