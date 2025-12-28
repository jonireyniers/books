'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    loadPendingRequests()
  }, [pathname])

  const loadPendingRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('lending_requests')
      .select('id')
      .eq('owner_id', user.id)
      .eq('status', 'pending')

    setPendingRequests(data?.length || 0)
  }

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
    { name: 'Aanbevelingen', href: '/dashboard/recommendations' },
    { name: 'Leen verzoeken', href: '/dashboard/lending' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link href="/dashboard" className="flex items-center hover:opacity-75 transition-opacity">
                <Image 
                  src="/bookly.png" 
                  alt="Bookly" 
                  width={48} 
                  height={48} 
                  className="object-contain"
                />
              </Link>
              
              <div className="hidden sm:flex sm:space-x-1 sm:items-center">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-semibold transition-all px-3 py-2 rounded-lg relative ${
                      pathname === item.href
                        ? 'text-teal-600 bg-teal-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                    {item.href === '/dashboard/lending' && pendingRequests > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
                        {pendingRequests}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {username && (
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold">
                    {username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{username}</span>
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
