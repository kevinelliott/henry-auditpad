'use client'

import { useState } from 'react'
import { Shield, Github, Chrome } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOAuth(provider: 'google' | 'github') {
    setLoading(provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-sky-400" />
            <span className="text-2xl font-bold text-white">AuditPad</span>
          </div>
          <p className="text-slate-400 text-sm">Sign in to your audit dashboard</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 space-y-4">
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <Chrome className="w-5 h-5" />
            {loading === 'google' ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <Github className="w-5 h-5" />
            {loading === 'github' ? 'Redirecting...' : 'Continue with GitHub'}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
