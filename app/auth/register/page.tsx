'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check if username is available first
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUser) {
      setError('Username is al in gebruik')
      setLoading(false)
      return
    }

    // Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: username,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check if email confirmation is required
    if (authData.user && !authData.session) {
      // Email confirmation is required
      setError(null)
      setLoading(false)
      // Show success message instead of error
      router.push('/auth/login?message=Controleer je email om je account te activeren')
      return
    }

    // If user is immediately logged in (no email confirmation required)
    if (authData.user && authData.session) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username.toLowerCase(),
          display_name: username,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setError('Er ging iets mis bij het aanmaken van je profiel. Probeer opnieuw in te loggen.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
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
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2 tracking-tight">Account aanmaken</h1>
          <p className="text-neutral-500">Begin met het bijhouden van je boeken</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white p-8 rounded-xl border border-neutral-200">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-900 mb-2">
                Gebruikersnaam
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                placeholder="jouwgebruikersnaam"
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                placeholder="••••••••"
              />
              <p className="text-xs text-neutral-500 mt-2">Minimaal 6 karakters</p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3.5 px-4 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-6"
            style={{ backgroundColor: '#155e68' }}
          >
            {loading ? 'Account aanmaken...' : 'Registreren'}
          </button>

          <p className="text-center text-sm text-neutral-600 mt-6">
            Al een account?{' '}
            <Link href="/auth/login" className="text-neutral-900 hover:underline font-medium">
              Log hier in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
