'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (profile?.username) {
        setUsername(profile.username)
      } else {
        // Create profile if it doesn't exist
        const emailUsername = user.email?.split('@')[0] || 'user'
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: emailUsername,
            display_name: emailUsername,
          })
        
        if (!error) {
          setUsername(emailUsername)
        }
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Mijn boeken', href: '/dashboard/books' },
    { name: 'Catalogus', href: '/dashboard/catalog' },
    { name: 'Statistieken', href: '/dashboard/statistics' },
    { name: 'Leesdoelen', href: '/dashboard/goals' },
    { name: 'Vrienden', href: '/dashboard/friends' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-12">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Mijn Leeslijst</span>
              </Link>
              
              <div className="hidden sm:flex sm:space-x-8 sm:items-center">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-teal-600 border-b-2 border-teal-600 pb-4'
                        : 'text-gray-600 hover:text-gray-900 pb-4 border-b-2 border-transparent'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {username && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-semibold">
                    {username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{username}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
