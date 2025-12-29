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
  const [showTooltip, setShowTooltip] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

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
    <div className="min-h-screen bg-neutral-50">
      {/* Header - Clean and minimal */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Subtle and elegant */}
            <Link href="/dashboard" className="flex items-center group">
              <div className="w-20 h-20 flex items-center justify-center transition-all group-hover:scale-105">
                <Image 
                  src="/bookly.png" 
                  alt="Bookly" 
                  width={150} 
                  height={150}
                  className="rounded-xl"
                  priority
                />
              </div>
            </Link>

            {/* Navigation - Minimal and spacious */}
            <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative text-sm font-medium transition-all group ${
                    pathname === item.href
                      ? 'text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <span className="relative">
                    {item.name}
                    {/* Animated underline on hover */}
                    <span 
                      className={`absolute -bottom-1 left-0 h-px transition-all duration-300 ${
                        pathname === item.href 
                          ? 'w-full' 
                          : 'w-0 group-hover:w-full'
                      }`}
                      style={{ backgroundColor: '#155e68' }}
                    />
                  </span>
                  {item.href === '/dashboard/lending' && pendingRequests > 0 && (
                    <span className="absolute -top-1 -right-3 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-semibold shadow-sm">
                      {pendingRequests}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            {/* User Profile - Minimal */}
            <div className="flex items-center gap-3">
              {username && (
                <div 
                  className="relative group"
                >
                  {/* Circle */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer transition-all hover:scale-110 hover:shadow-xl"
                    style={{ backgroundColor: '#155e68' }}
                  >
                    {username[0].toUpperCase()}
                  </div>

                  {/* Invisible bridge to keep hover active */}
                  <div className="absolute top-full right-0 w-full h-2 opacity-0 group-hover:opacity-0" />

                  {/* Dropdown menu - appears on hover of circle or menu itself */}
                  <div className="absolute top-full mt-2 right-0 pointer-events-none opacity-0 invisible group-hover:pointer-events-auto group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white rounded-xl border border-neutral-200 shadow-xl z-50 overflow-hidden min-w-[180px]">
                    <div className="px-4 py-3 border-b border-neutral-200">
                      <p className="text-sm font-semibold text-neutral-900">{username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      Uitloggen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  )
}
