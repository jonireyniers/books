'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) {
      setMessage(msg)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if profile exists, create if it doesn't
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        // Create profile from user metadata or email
        const username = data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'user'
        const displayName = data.user.user_metadata?.display_name || username

        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username.toLowerCase(),
            display_name: displayName,
          })
      }

      router.push('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <Image 
              src="/bookly.png" 
              alt="Bookly" 
              width={120} 
              height={120} 
              className="rounded-xl"
              priority
            />
          </div>
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2 tracking-tight">Welkom terug</h1>
          <p className="text-neutral-500">Log in op je account</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl border border-neutral-200">
          {message && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm border border-blue-100 mb-6">
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                placeholder="jouw@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3.5 px-4 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-6"
            style={{ backgroundColor: '#155e68' }}
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>

          <p className="text-center text-sm text-neutral-600 mt-6">
            Nog geen account?{' '}
            <Link href="/auth/register" className="text-neutral-900 hover:underline font-medium">
              Registreer hier
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
