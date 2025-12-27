'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  
  // --- Auth States ---
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // --- Form States ---
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // --- Validation Helpers ---
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  function getPasswordStrength(pass) {
    if (!pass) return 0
    if (pass.length < 6) return 1
    if (pass.length < 8) return 2
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) return 3
    return 4
  }

  async function handleAuth(event) {
    event.preventDefault()

    // --- Signup Validation ---
    if (!isLogin) {
      if (!name.trim()) {
        setError("Please enter your name.")
        return
      }
      if (!validateEmail(email)) {
        setError("Please enter a valid email address.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
      if (getPasswordStrength(password) < 2) {
        setError("Password is too weak. Use 8+ characters with symbols.")
        return
      }
    } else {
      // Login Validation
      if (!email.trim() || !password.trim()) {
        setError("Please enter email & password")
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      let authError

      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        authError = loginError
      } else {
        // Signup with Name
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        })
        authError = signUpError
      }

      if (authError) throw authError

      router.push('/dashboard')

    } catch (err) {
      console.error('Auth Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        
        {/* --- LEFT SIDE: Visuals --- */}
        <div className="md:w-1/2 bg-slate-900 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3 rounded-lg w-max font-bold text-2xl shadow-lg mb-6 inline-block">
              B
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back!' : 'Start Planning Today'}
            </h1>
            <p className="text-slate-400 text-base">
              {isLogin 
                ? 'Log in to access your marketing dashboard.' 
                : 'Join thousands of small businesses growing with AI.'}
            </p>
          </div>
          
          <div className="hidden md:block">
            <div className="flex gap-4 text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 21"></path></svg>
                <span>Secure Login</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4 6-6l-4-6a2 2 0 01-2.828 0-1.414L12 12z"></path></svg>
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Form --- */}
        <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`pb-4 border-b-2 text-sm font-semibold transition-colors duration-200 ${isLogin ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`pb-4 border-b-2 text-sm font-semibold transition-colors duration-200 ml-8 ${!isLogin ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          {/* General Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 010 18 0 9h-4.5"></path></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Name Field (Signup Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  className={`w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition text-slate-900 ${name ? 'border-emerald-500' : 'border-slate-300'}`}
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                className={`w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition text-slate-900 ${!validateEmail(email) && email.length > 0 ? 'border-red-500 text-red-900 placeholder-red-300' : 'border-slate-300'}`}
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition pr-10 text-slate-900 ${getPasswordStrength(password) < 2 ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="•••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {/* Toggle Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 012-12 3 3 0 00-6 0 0 1.414L12.586 5.586a2 2 0 00-2.828 0-1.414L10 12a2 2 0 00-2-828 0-1.414l-2.414 2.414a2 2 0 010-2.828 0-1.414L6 12a2 2 0 010-2.828 0-1.414l-2.414 2.414a2 2 0 010-2.828 0-1.414L6 10a2 2 0 00-2.828 0-1.414l2.414 2.414a2 2 0 000-2.828 0-1.414L17 14a2 2 0 000-2.828 0-1.414l1.172 1.172a2 2 0 001-2.828 0-1.414L9 2.828a2 2 0 000-2.828 0-1.414L17 16a2 2 0 000-2.828 0-1.414l1.172 1.172a2 2 0 001-2.828 0-1.414L17 20a2 2 0 000-2.828 0-1.414l1.172 1.172a2 2 0 000-2.828 0-1.414L17 22a2 2 0 000-2.828 0-1.414L15.172 15.172a2 2 0 000-2.828 0-1.414L17 24a2 2 0 000-2.828 0-1.414L15 2.828a2 2 0 000-2.828 0-1.414z"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 12s4-8 8-8 0 000-8 0 01-8 8 8 4 8 4 0 010 18 0 9h4.5"></path></svg>
                  )}
                </button>
              </div>              
              {/* Password Strength Bar (Signup Only) */}
              {!isLogin && password.length > 0 && (
                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-1.5 transition-all duration-300 ${
                      getPasswordStrength(password) === 1 ? 'bg-red-500 w-1/4' :
                      getPasswordStrength(password) === 2 ? 'bg-yellow-400 w-2/4' :
                      getPasswordStrength(password) === 3 ? 'bg-emerald-500 w-3/4' :
                      'bg-emerald-600 w-full'
                    }`}
                  ></div>
                </div>
              )}
            </div>

            {/* Confirm Password (Signup Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                <input
                  type="password"
                  className={`w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition text-slate-900 ${password !== confirmPassword ? 'border-red-500 text-red-900 placeholder-red-300' : 'border-slate-300'}`}
                  placeholder="•••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl text-white font-bold py-4 shadow-lg transform transition hover:-translate-y-0.5 text-sm uppercase tracking-wide ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}