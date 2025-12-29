'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters zijn')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
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
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2 tracking-tight">Nieuw wachtwoord</h1>
          <p className="text-neutral-500">Kies een nieuw wachtwoord voor je account</p>
        </div>

        {success ? (
          <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Wachtwoord gereset!</h2>
            <p className="text-neutral-600">
              Je wachtwoord is succesvol gewijzigd. Je wordt doorgestuurd naar het dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="bg-white p-8 rounded-xl border border-neutral-200">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 mb-6">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                  Nieuw wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-900 mb-2">
                  Bevestig wachtwoord
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:outline-none transition-colors text-neutral-900"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3.5 px-4 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-6"
              style={{ backgroundColor: '#155e68' }}
            >
              {loading ? 'Bezig...' : 'Wachtwoord resetten'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
