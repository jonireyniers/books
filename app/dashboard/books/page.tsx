'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ReadingStatus } from '@/lib/types'
import QuickStatusChange from './QuickStatusChange'

const statusLabels: Record<ReadingStatus, string> = {
  'wil_lezen': 'Wil lezen',
  'bezig': 'Aan het lezen',
  'gelezen': 'Gelezen',
  'verlanglijst': 'Verlanglijst'
}

const statusColors: Record<ReadingStatus, string> = {
  'wil_lezen': 'bg-blue-50 text-blue-700 border border-blue-200',
  'bezig': 'bg-amber-50 text-amber-700 border border-amber-200',
  'gelezen': 'bg-teal-50 text-teal-700 border border-teal-200',
  'verlanglijst': 'bg-purple-50 text-purple-700 border border-purple-200'
}

type Tab = 'alle' | 'wil_lezen' | 'bezig' | 'gelezen' | 'verlanglijst'

export default function BooksPage() {
  const [activeTab, setActiveTab] = useState<Tab>('alle')
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBooks()
  }, [activeTab])

  const loadBooks = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (activeTab !== 'alle') {
      query = query.eq('status', activeTab)
    }

    const { data } = await query
    setBooks(data || [])
    setLoading(false)
  }

  const tabs = [
    { id: 'alle' as Tab, name: 'Alle boeken', count: books.length },
    { id: 'verlanglijst' as Tab, name: 'Verlanglijst', icon: '⭐' },
    { id: 'wil_lezen' as Tab, name: 'Wil lezen', icon: '📚' },
    { id: 'bezig' as Tab, name: 'Aan het lezen', icon: '📖' },
    { id: 'gelezen' as Tab, name: 'Gelezen', icon: '✅' },
  ]

  const filteredBooks = activeTab === 'alle' 
    ? books 
    : books.filter(b => b.status === activeTab)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-gray-900 mb-1">Mijn boeken</h1>
          <p className="text-gray-600">Je persoonlijke collectie</p>
        </div>
        <Link
          href="/dashboard/catalog"
          className="inline-flex items-center px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          Boek toevoegen
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600">Laden...</p>
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/dashboard/books/${book.id}`}
              className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-teal-500 transition-all overflow-hidden"
            >
              {book.cover_image_url && (
                <div className="w-full h-48 bg-gray-100">
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <QuickStatusChange 
                    bookId={book.id}
                    currentStatus={book.status as ReadingStatus}
                    onStatusChange={loadBooks}
                  />
                  {book.rating && (
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < book.rating ? 'fill-current' : 'fill-gray-200'}`} viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                
                {book.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{book.description}</p>
                )}
                
                {book.end_date && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Gelezen op {new Date(book.end_date).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="max-w-sm mx-auto">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'alle' && 'Nog geen boeken toegevoegd'}
              {activeTab === 'verlanglijst' && 'Je verlanglijst is leeg'}
              {activeTab === 'wil_lezen' && 'Geen boeken in deze categorie'}
              {activeTab === 'bezig' && 'Geen boeken in deze status'}
              {activeTab === 'gelezen' && 'Nog geen uitgelezen boeken'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'alle' && 'Voeg je eerste boek toe om te beginnen.'}
              {activeTab === 'verlanglijst' && 'Voeg boeken toe die je nog niet hebt maar graag wilt aanschaffen.'}
              {activeTab === 'wil_lezen' && 'Voeg boeken toe die je al hebt en binnenkort wilt gaan lezen.'}
              {activeTab === 'bezig' && 'Begin met een boek en markeer het als "Aan het lezen".'}
              {activeTab === 'gelezen' && 'Markeer boeken als gelezen wanneer je klaar bent.'}
            </p>
            <Link
              href="/dashboard/books/new"
              className="inline-flex items-center px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Boek toevoegen
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
