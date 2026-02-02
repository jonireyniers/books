'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setResetLoading(false)
      return
    }

    setResetSuccess(true)
    setResetLoading(false)
  }

  if (showForgotPassword) {
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
            <h1 className="text-3xl font-semibold text-neutral-900 mb-2 tracking-tight">Wachtwoord vergeten</h1>
            <p className="text-neutral-500">We sturen je een reset link per email</p>
          </div>

          {resetSuccess ? (
            <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Check je email</h2>
              <p className="text-neutral-600 mb-6">
                We hebben een wachtwoord reset link gestuurd naar <strong>{resetEmail}</strong>
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false)
                  setResetSuccess(false)
                  setResetEmail('')
                }}
                className="text-neutral-900 hover:underline font-medium"
              >
                Terug naar login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="bg-white p-8 rounded-xl border border-neutral-200">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 mb-6">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="reset-email" className="block text-sm font-medium text-neutral-900 mb-2">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                  placeholder="jouw@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full text-white py-3.5 px-4 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                style={{ backgroundColor: '#155e68' }}
              >
                {resetLoading ? 'Bezig...' : 'Verstuur reset link'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-sm text-neutral-600 mt-4 hover:underline"
              >
                Terug naar login
              </button>
            </form>
          )}
        </div>
      </div>
    )
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                  Wachtwoord vergeten?
                </button>
              </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-500">Laden...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
