'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ReadingStatus } from '@/lib/types'

export default function EditBookPage() {
  const params = useParams()
  const bookId = params.id as string
  
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ReadingStatus>('wil_lezen')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBook()
  }, [bookId])

  const loadBook = async () => {
    const { data: book } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (book) {
      setTitle(book.title)
      setAuthor(book.author)
      setDescription(book.description || '')
      setStatus(book.status)
      setStartDate(book.start_date || '')
      setEndDate(book.end_date || '')
      setRating(book.rating)
      setReview(book.review || '')
      setIsPublic(book.is_public)

      // Load tags
      const { data: bookTags } = await supabase
        .from('book_tags')
        .select('tag_id, tags(name)')
        .eq('book_id', bookId)

      const tagNames = bookTags?.map(bt => (bt.tags as any).name).join(', ') || ''
      setTags(tagNames)
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update book
    const { error: bookError } = await supabase
      .from('books')
      .update({
        title,
        author,
        description: description || null,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        rating,
        review: review || null,
        is_public: isPublic,
      })
      .eq('id', bookId)

    if (bookError) {
      setError(bookError.message)
      setSaving(false)
      return
    }

    // Update tags - delete existing and re-create
    await supabase.from('book_tags').delete().eq('book_id', bookId)

    if (tags.trim()) {
      const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean)
      
      for (const tagName of tagNames) {
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', tagName)
          .single()

        let tagId = existingTag?.id

        if (!tagId) {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ user_id: user.id, name: tagName })
            .select('id')
            .single()
          
          tagId = newTag?.id
        }

        if (tagId) {
          await supabase
            .from('book_tags')
            .insert({ book_id: bookId, tag_id: tagId })
        }
      }
    }

    router.push(`/dashboard/books/${bookId}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-neutral-600">Laden...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-light text-neutral-900 mb-8">Boek bewerken</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border border-neutral-200 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
            Titel *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-neutral-700 mb-1">
            Auteur *
          </label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
            Beschrijving
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
            Status *
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none"
          >
            <option value="wil_lezen">Wil lezen</option>
            <option value="bezig">Aan het lezen</option>
            <option value="gelezen">Gelezen</option>
          </select>
        </div>

        {(status === 'bezig' || status === 'gelezen') && (
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700 mb-1">
              Startdatum
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none"
            />
          </div>
        )}

        {status === 'gelezen' && (
          <>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-neutral-700 mb-1">
                Einddatum
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Beoordeling {rating && <span className="text-neutral-600 font-normal">({rating}/5)</span>}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-all hover:scale-110 ${
                      rating && star <= rating 
                        ? 'text-yellow-400' 
                        : 'text-neutral-300 hover:text-yellow-200'
                    }`}
                  >
                    {rating && star <= rating ? '★' : '☆'}
                  </button>
                ))}
                {rating && (
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900 ml-3"
                  >
                    Wissen
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="review" className="block text-sm font-medium text-neutral-700 mb-1">
                Persoonlijke opmerking
              </label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none resize-none"
                placeholder="Wat vond je van dit boek?"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-neutral-700 mb-1">
            Tags (gescheiden door komma's)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none"
            placeholder="fictie, thriller, nederlands"
          />
        </div>

        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-neutral-900 focus:ring-neutral-900 border-neutral-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-neutral-700">
            Maak dit boek zichtbaar voor vrienden
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-neutral-900 text-white py-2 px-4 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Bezig...' : 'Wijzigingen opslaan'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  )
}
