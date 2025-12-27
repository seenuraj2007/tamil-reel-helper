'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  // UPDATED: Added 'event' parameter
  async function handleAuth(event) {
    event.preventDefault() // Important: Page reload stop pannu

    if (!email.trim() || !password.trim()) {
      alert('Please enter email & password')
      return
    }

    setLoading(true)

    try {
      let error

      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        error = loginError
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        error = signUpError
      }

      if (error) throw error

// Just Redirect
router.push('/dashboard')

    } catch (err) {
      console.error('Auth Error:', err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      
      {/* CHANGE: Added <form> tag instead of <div> */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Toggle Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button" // Ensure this doesn't submit the form
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 text-sm font-semibold transition ${isLogin ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-4 text-sm font-semibold transition ${!isLogin ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign Up
          </button>
        </div>

        {/* CHANGE: Wrap inputs & button in <form> */}
        <form onSubmit={handleAuth} className="p-8 space-y-6">
          
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-slate-500">
              Access your professional marketing dashboard.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              className="w-full border-slate-300 bg-white text-slate-900 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required // HTML5 validation
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              className="w-full border-slate-300 bg-white text-slate-900 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="•••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required // HTML5 validation
            />
          </div>

          {/* CHANGE: type="submit" added */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg text-white font-semibold py-3 px-6 shadow-lg transform transition hover:-translate-y-0.5 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
          >
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up Free'}
          </button>

        </form>
      </div>
    </div>
  )
}