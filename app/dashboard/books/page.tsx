'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ReadingStatus } from '@/lib/types'

const statusLabels: Record<ReadingStatus, string> = {
  'wil_lezen': 'Wil lezen',
  'bezig': 'Aan het lezen',
  'gelezen': 'Gelezen'
}

const statusColors: Record<ReadingStatus, string> = {
  'wil_lezen': 'bg-blue-100 text-blue-800',
  'bezig': 'bg-yellow-100 text-yellow-800',
  'gelezen': 'bg-green-100 text-green-800'
}

type Tab = 'alle' | 'wil_lezen' | 'bezig' | 'gelezen'

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
    { id: 'wil_lezen' as Tab, name: 'Verlanglijstje', icon: '📚' },
    { id: 'bezig' as Tab, name: 'Aan het lezen', icon: '📖' },
    { id: 'gelezen' as Tab, name: 'Gelezen', icon: '✅' },
  ]

  const filteredBooks = activeTab === 'alle' 
    ? books 
    : books.filter(b => b.status === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-light text-neutral-900">Mijn boeken</h1>
        <Link
          href="/dashboard/books/new"
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Nieuw boek
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-neutral-200 p-1 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600">Laden...</p>
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/dashboard/books/${book.id}`}
              className="bg-white p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-all hover:shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[book.status as ReadingStatus]}`}>
                  {statusLabels[book.status as ReadingStatus]}
                </span>
                {book.rating && (
                  <div className="text-sm text-neutral-600">
                    {'★'.repeat(book.rating)}
                  </div>
                )}
              </div>
              
              <h3 className="font-medium text-neutral-900 mb-1">{book.title}</h3>
              <p className="text-sm text-neutral-600 mb-2">{book.author}</p>
              
              {book.description && (
                <p className="text-sm text-neutral-500 line-clamp-2">{book.description}</p>
              )}
              
              {book.end_date && (
                <p className="text-xs text-neutral-500 mt-3">
                  Gelezen op {new Date(book.end_date).toLocaleDateString('nl-NL')}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
          <p className="text-neutral-600 mb-4">
            {activeTab === 'alle' && 'Je hebt nog geen boeken toegevoegd'}
            {activeTab === 'wil_lezen' && 'Je verlanglijstje is nog leeg'}
            {activeTab === 'bezig' && 'Je leest momenteel geen boeken'}
            {activeTab === 'gelezen' && 'Je hebt nog geen boeken uitgelezen'}
          </p>
          <Link
            href="/dashboard/books/new"
            className="inline-block bg-neutral-900 text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Voeg je eerste boek toe
          </Link>
        </div>
      )}
    </div>
  )
}
