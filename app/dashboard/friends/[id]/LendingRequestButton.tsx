'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LendingRequestButtonProps {
  bookId: string
  ownerId: string
  bookTitle: string
}

export default function LendingRequestButton({ bookId, ownerId, bookTitle }: LendingRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if request already exists
    const { data: existing } = await supabase
      .from('lending_requests')
      .select('*')
      .eq('requester_id', user.id)
      .eq('book_id', bookId)
      .eq('status', 'pending')
      .single()

    if (existing) {
      setError('Je hebt al een openstaand verzoek voor dit boek')
      setLoading(false)
      return
    }

    // Check of het boek al is uitgeleend aan iemand anders
    const { data: otherRequests } = await supabase
      .from('lending_requests')
      .select('*')
      .eq('book_id', bookId)
      .eq('status', 'approved')

    if (otherRequests && otherRequests.length > 0) {
      setError('Dit boek is al uitgeleend aan iemand anders')
      setLoading(false)
      return
    }

    // Create request
    const { error: insertError } = await supabase
      .from('lending_requests')
      .insert({
        requester_id: user.id,
        owner_id: ownerId,
        book_id: bookId,
        message: message || null,
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setMessage('')
      }, 2000)
    }

    setLoading(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
      >
        📚 Vragen om te lenen
      </button>
    )
  }

  return (
    <div className="mt-3 p-4 bg-teal-50 rounded-lg border border-teal-200">
      {success ? (
        <div className="text-center text-teal-800">
          <div className="text-2xl mb-2">✅</div>
          <p className="font-medium">Verzoek verstuurd!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-teal-900 mb-1">
              Vraag om "{bookTitle}" te lenen
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optioneel: voeg een bericht toe..."
              rows={3}
              className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Versturen...' : 'Verstuur verzoek'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setMessage('')
                setError(null)
              }}
              className="px-4 py-2 border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
