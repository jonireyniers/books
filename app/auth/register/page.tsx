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
  const [showPassword, setShowPassword] = useState(false)
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
