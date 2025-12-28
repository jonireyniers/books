'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ReadingStatus } from '@/lib/types'
import { logActivity } from '@/lib/activity-logger'

export default function EditBookPage() {
  const params = useParams()
  const bookId = params.id as string
  
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [searchingCover, setSearchingCover] = useState(false)
  const [status, setStatus] = useState<ReadingStatus>('verlanglijst')
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

  const searchCover = async () => {
    if (!title.trim()) return
    
    setSearchingCover(true)
    try {
      const query = author.trim() ? `${title} ${author}` : title
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
      )
      const data = await response.json()
      
      if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        setCoverImageUrl(data.items[0].volumeInfo.imageLinks.thumbnail.replace('http:', 'https:'))
      }
    } catch (error) {
      console.error('Cover search error:', error)
    } finally {
      setSearchingCover(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Afbeelding moet kleiner zijn dan 2MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Alleen afbeeldingen zijn toegestaan')
      return
    }

    setUploadingImage(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setCoverImageUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
        console.log('Storage not configured, using data URL')
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(fileName)
        
        setCoverImageUrl(publicUrl)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Er ging iets mis bij het uploaden')
    } finally {
      setUploadingImage(false)
    }
  }

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
      setCoverImageUrl(book.cover_image_url || '')
      setPageCount(book.page_count ? book.page_count.toString() : '')
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

    // Get old values to detect changes
    const { data: oldBook } = await supabase
      .from('books')
      .select('status, rating, review')
      .eq('id', bookId)
      .single()

    // Update book
    const { error: updateError } = await supabase
      .from('books')
      .update({
        title,
        author,
        description: description || null,
        cover_image_url: coverImageUrl || null,
        page_count: pageCount ? parseInt(pageCount) : null,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        rating,
        review: review || null,
        is_public: isPublic,
      })
      .eq('id', bookId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Log activities based on changes
    if (status === 'gelezen' && oldBook?.status !== 'gelezen') {
      await logActivity('finished_book', bookId)
    } else if (status === 'bezig' && oldBook?.status !== 'bezig') {
      await logActivity('started_book', bookId)
    }
    
    if (rating && rating !== oldBook?.rating) {
      await logActivity('rated_book', bookId)
    }
    
    if (review && review !== oldBook?.review) {
      await logActivity('added_review', bookId)
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
            placeholder="Bijv. Harry Potter en de Steen der Wijzen"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
            placeholder="Bijv. J.K. Rowling"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
            placeholder="Waar gaat het boek over? (optioneel)"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none resize-none text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="pageCount" className="block text-sm font-medium text-neutral-700 mb-1">
            Aantal pagina's
          </label>
          <input
            id="pageCount"
            type="number"
            min="1"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
            placeholder="Bijv. 350"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Wordt gebruikt voor de leaderboard (optioneel)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Cover afbeelding
          </label>
          <div className="space-y-3">
            {/* URL Input */}
            <div>
              <label htmlFor="coverImageUrl" className="block text-xs text-neutral-600 mb-1">
                Via URL
              </label>
              <div className="flex gap-2">
                <input
                  id="coverImageUrl"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder="https://example.com/cover.jpg"
                />
                <button
                  type="button"
                  onClick={searchCover}
                  disabled={searchingCover || !title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {searchingCover ? 'Zoeken...' : '🔍 Zoek'}
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="coverImageFile" className="block text-xs text-neutral-600 mb-1">
                Of upload vanaf apparaat
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 transition-colors text-center">
                    <span className="text-sm text-neutral-600">
                      {uploadingImage ? '⏳ Uploaden...' : '📁 Kies een afbeelding'}
                    </span>
                    <input
                      id="coverImageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Max 2MB • JPG, PNG, WebP
              </p>
            </div>

            {/* Preview */}
            {coverImageUrl && (
              <div className="flex items-start gap-3">
                <div className="relative w-32 h-48 rounded-lg overflow-hidden border border-neutral-200 flex-shrink-0">
                  <img 
                    src={coverImageUrl} 
                    alt="Book cover preview" 
                    className="w-full h-full object-cover"
                    onError={() => setCoverImageUrl('')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  ✕ Verwijder
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
            Status *
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          >
            <option value="verlanglijst">Verlanglijst (wil aanschaffen)</option>
            <option value="wil_lezen">Wil lezen (in bezit)</option>
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
