'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Stats {
  totalBooks: number
  booksRead: number
  booksReading: number
  booksToRead: number
  averageRating: number
  booksThisYear: number
  booksThisMonth: number
  topAuthors: { author: string; count: number }[]
  recentlyFinished: any[]
  monthlyProgress: { month: string; count: number }[]
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all books
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)

    if (!books) {
      setLoading(false)
      return
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Calculate stats
    const totalBooks = books.length
    const booksRead = books.filter(b => b.status === 'gelezen').length
    const booksReading = books.filter(b => b.status === 'bezig').length
    const booksToRead = books.filter(b => b.status === 'wil_lezen').length

    // Average rating
    const ratedBooks = books.filter(b => b.rating)
    const averageRating = ratedBooks.length > 0
      ? ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length
      : 0

    // Books this year
    const booksThisYear = books.filter(b => {
      if (!b.end_date) return false
      return new Date(b.end_date).getFullYear() === currentYear
    }).length

    // Books this month
    const booksThisMonth = books.filter(b => {
      if (!b.end_date) return false
      const date = new Date(b.end_date)
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth
    }).length

    // Top authors (only from read books)
    const readBooks = books.filter(b => b.status === 'gelezen')
    const authorCounts: Record<string, number> = {}
    readBooks.forEach(b => {
      authorCounts[b.author] = (authorCounts[b.author] || 0) + 1
    })
    const topAuthors = Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Recently finished
    const recentlyFinished = books
      .filter(b => b.status === 'gelezen' && b.end_date)
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
      .slice(0, 5)

    // Monthly progress (last 6 months)
    const monthlyProgress: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1)
      const monthName = date.toLocaleDateString('nl-NL', { month: 'short' })
      const count = books.filter(b => {
        if (!b.end_date) return false
        const endDate = new Date(b.end_date)
        return endDate.getFullYear() === date.getFullYear() && 
               endDate.getMonth() === date.getMonth()
      }).length
      monthlyProgress.push({ month: monthName, count })
    }

    setStats({
      totalBooks,
      booksRead,
      booksReading,
      booksToRead,
      averageRating,
      booksThisYear,
      booksThisMonth,
      topAuthors,
      recentlyFinished,
      monthlyProgress
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Laden...</p>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-gray-900 mb-2">Statistieken</h1>
        <p className="text-gray-600">Jouw leesoverzicht en voortgang</p>
      </div>

      {/* Main stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Totaal boeken</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalBooks}</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Uitgelezen</div>
          <div className="text-3xl font-bold text-teal-600">{stats.booksRead}</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Aan het lezen</div>
          <div className="text-3xl font-bold text-amber-600">{stats.booksReading}</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Gemiddelde rating</div>
          <div className="text-3xl font-bold text-yellow-600">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
            {stats.averageRating > 0 && <span className="text-xl">⭐</span>}
          </div>
        </div>
      </div>

      {/* This year/month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-lg border border-teal-200">
          <div className="text-sm text-teal-700 mb-1">Dit jaar ({new Date().getFullYear()})</div>
          <div className="text-4xl font-bold text-teal-900 mb-2">{stats.booksThisYear}</div>
          <div className="text-sm text-teal-700">boeken uitgelezen</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700 mb-1">Deze maand</div>
          <div className="text-4xl font-bold text-blue-900 mb-2">{stats.booksThisMonth}</div>
          <div className="text-sm text-blue-700">boeken uitgelezen</div>
        </div>
      </div>

      {/* Monthly progress chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">📊 Leesvoortgang (laatste 6 maanden)</h2>
        <div className="space-y-4">
          {stats.monthlyProgress.map((month, i) => {
            const maxCount = Math.max(...stats.monthlyProgress.map(m => m.count), 1)
            const percentage = (month.count / maxCount) * 100
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 capitalize">{month.month}</span>
                  <span className="text-gray-600">{month.count} boek{month.count !== 1 ? 'en' : ''}</span>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                    style={{ width: `${Math.max(percentage, month.count > 0 ? 10 : 0)}%` }}
                  >
                    {month.count > 0 && (
                      <span className="text-white text-xs font-semibold">
                        {month.count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Totaal laatste 6 maanden: <span className="font-semibold text-gray-900">
              {stats.monthlyProgress.reduce((sum, m) => sum + m.count, 0)} boeken
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Gemiddeld: <span className="font-semibold text-gray-900">
              {(stats.monthlyProgress.reduce((sum, m) => sum + m.count, 0) / 6).toFixed(1)} per maand
            </span>
          </div>
        </div>
      </div>

      {/* Top authors */}
      {stats.topAuthors.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meest gelezen auteurs</h2>
          <div className="space-y-3">
            {stats.topAuthors.map((author, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold text-sm">
                    {i + 1}
                  </div>
                  <span className="text-gray-900">{author.author}</span>
                </div>
                <span className="text-gray-600 text-sm">{author.count} boek{author.count !== 1 ? 'en' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently finished */}
      {stats.recentlyFinished.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent uitgelezen</h2>
          <div className="space-y-3">
            {stats.recentlyFinished.map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/books/${book.id}`}
                className="flex items-center justify-between hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{book.title}</div>
                  <div className="text-sm text-gray-600">{book.author}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(book.end_date).toLocaleDateString('nl-NL')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
