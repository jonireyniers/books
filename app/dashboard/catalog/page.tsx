'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BookResult {
  id: string
  title: string
  authors?: string[]
  publishedDate?: string
  coverUrl?: string
  isbn?: string
  source: 'openlibrary' | 'google'
  description?: string
  pageCount?: number
  publisher?: string
  language?: string
}

export default function CatalogPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const searchBooks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearchPerformed(true)

    try {
      // Search both APIs in parallel
      const [openLibraryRes, googleBooksRes] = await Promise.all([
        fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`),
        fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`)
      ])

      const [openLibraryData, googleBooksData] = await Promise.all([
        openLibraryRes.json(),
        googleBooksRes.json()
      ])

      // Transform Open Library results
      const openLibraryBooks: BookResult[] = (openLibraryData.docs || []).map((book: any) => ({
        id: `ol-${book.key}`,
        title: book.title,
        authors: book.author_name || [],
        publishedDate: book.first_publish_year?.toString(),
        coverUrl: book.cover_i 
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : undefined,
        isbn: book.isbn?.[0],
        source: 'openlibrary' as const
      }))

      // Transform Google Books results
      const googleBooks: BookResult[] = (googleBooksData.items || []).map((item: any) => ({
        id: `gb-${item.id}`,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || [],
        publishedDate: item.volumeInfo.publishedDate,
        coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier,
        source: 'google' as const,
        description: item.volumeInfo.description,
        pageCount: item.volumeInfo.pageCount,
        publisher: item.volumeInfo.publisher,
        language: item.volumeInfo.language
      }))

      // Combine and deduplicate results (prioritize Google Books for better metadata)
      const allBooks = [...googleBooks, ...openLibraryBooks]
      const uniqueBooks = allBooks.filter((book, index, self) => 
        index === self.findIndex(b => 
          b.title.toLowerCase() === book.title.toLowerCase() && 
          b.authors?.[0]?.toLowerCase() === book.authors?.[0]?.toLowerCase()
        )
      )

      setResults(uniqueBooks)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const addBookToLibrary = async (book: BookResult) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('books').insert({
      user_id: user.id,
      title: book.title,
      author: book.authors?.[0] || 'Onbekende auteur',
      description: book.description || null,
      status: 'verlanglijst',
      isbn: book.isbn || null,
      cover_image_url: book.coverUrl || null,
      page_count: book.pageCount || null,
      published_date: book.publishedDate || null,
      publisher: book.publisher || null,
      language: book.language || null
    })

    if (!error) {
      router.push('/dashboard/books')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-gray-900 mb-2">Catalogus</h1>
        <p className="text-gray-600">Doorzoek miljoenen boeken via Open Library en Google Books</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={searchBooks}>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-3">
            Zoek een boek
          </label>
          <div className="flex gap-3">
            <input
              id="search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bijv. 'Harry Potter', 'J.K. Rowling' of ISBN..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Zoeken...' : 'Zoeken'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Zoek op titel, auteur of ISBN voor de beste resultaten
          </p>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Zoeken...</p>
        </div>
      )}

      {!loading && searchPerformed && results.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen resultaten gevonden</h3>
          <p className="text-gray-600">
            Probeer een andere zoekterm of controleer de spelling
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{results.length} resultaten</span> gevonden voor "{query}"
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-48 object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem] flex-1">
                      {book.title}
                    </h3>
                    {book.source === 'google' && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded flex-shrink-0">
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {book.authors?.[0] || 'Onbekende auteur'}
                  </p>
                  {book.publishedDate && (
                    <p className="text-xs text-gray-500 mb-2">
                      Gepubliceerd: {book.publishedDate.split('-')[0]}
                    </p>
                  )}
                  {book.pageCount && (
                    <p className="text-xs text-gray-500 mb-4">
                      {book.pageCount} pagina's
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => addBookToLibrary(book)}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                      title="Voeg toe aan 'Wil lezen'"
                    >
                      + Toevoegen
                    </button>
                    {book.source === 'google' ? (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + (book.authors?.[0] || ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                        title="Zoek op Google"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </a>
                    ) : (
                      <a
                        href={`https://openlibrary.org${book.id.replace('ol-', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                        title="Bekijk op Open Library"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchPerformed && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Doorzoek de catalogus</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Zoek naar boeken in de Open Library database en voeg ze direct toe aan je collectie
          </p>
          <div className="max-w-sm mx-auto space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Zoek een boek</p>
                <p className="text-xs text-gray-600">Typ de titel, auteur of ISBN</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Bekijk resultaten</p>
                <p className="text-xs text-gray-600">Kies uit duizenden boeken</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Voeg toe</p>
                <p className="text-xs text-gray-600">Direct opgeslagen in je collectie</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
