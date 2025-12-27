'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteBookButton({ bookId }: { bookId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je dit boek wilt verwijderen?')) {
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)

    if (!error) {
      router.push('/dashboard/books')
      router.refresh()
    } else {
      alert('Er ging iets mis bij het verwijderen')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
    >
      {loading ? 'Bezig...' : 'Verwijderen'}
    </button>
  )
}
