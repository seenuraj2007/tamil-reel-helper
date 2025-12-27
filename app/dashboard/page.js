'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function Dashboard() {
  const router = useRouter()

  // --- User Info State ---
  const [userEmail, setUserEmail] = useState('')
  const [loadingAuth, setLoadingAuth] = useState(true)

  // --- Tool State ---
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [goal, setGoal] = useState('sales')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [realUsage, setRealUsage] = useState(0) // NEW: Real usage count
  const [realLimit, setRealLimit] = useState(30) // NEW: Limit

  // --- Pop-up Modal State ---
  const [showModal, setShowModal] = useState(false)

  // --- Toast Notification State ---
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

  // 1. Check Session
  useEffect(() => {
    async function loadUserData() {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }

      setUserEmail(session.user.email)
      const currentUserId = session.user.id

      // 2. NEW: Fetch Real Usage from DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_usage, monthly_limit')
        .eq('user_id', currentUserId)
        .single()

      if (profile) {
        setRealUsage(profile.plan_usage || 0)
        setRealLimit(profile.monthly_limit || 30)
      }

      // Animation Delay
      setTimeout(() => {
        setLoadingAuth(false)
      }, 2500)
    }
    loadUserData()
  }, [router])

  // 2. Toast Helper Function
  function showToast(message, type = 'success') {
    setToast({ show: true, msg: message, type })
    setTimeout(() => {
      setToast({ show: false, msg: '', type })
    }, 3000)
  }

  // 3. Logout Function
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // 4. Generate Plan Function
  async function handleGenerate() {
    if (!niche.trim()) {
      showToast('Please enter your business niche', 'error')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // 1. Get User ID from Session
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session.user.id

      // 2. Send Request with userId
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche,
          audience,
          platform,
          goal,
          userId // NEW: Send user ID to backend
        })
      })

      if (!res.ok) {
        const errorData = await res.json()

        // Check if limit reached error
        if (res.status === 429 || errorData.error.includes('limit')) {
          showToast('Monthly limit reached! Upgrade to Pro.', 'error')
        } else {
          showToast(errorData.error || 'Something went wrong', 'error')
        }
        setLoading(false)
        return
      }

      const data = await res.json()
      setResult(data)
      setShowModal(true)

      // 3. Increment Local State (Optimistic UI Update)
      setRealUsage(prev => prev + 1)
      showToast('Marketing Plan Generated Successfully!', 'success')

    } catch (err) {
      console.error('Fetch error:', err)
      showToast('Network error.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- Beautiful Loading Screen (Welcome Animation) ---
  if (loadingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 overflow-hidden">

        {/* Background Ambient Glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        {/* Animated Logo Circle */}
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
          {/* Spinner Ring */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-pulse"></div>
            {/* Inner Logo */}
            <div className="absolute inset-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              B
            </div>
          </div>

          {/* Text Animation */}
          <div className="mt-8 text-center space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Welcome Back!
            </h1>
            <p className="text-emerald-400 text-sm font-medium animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Preparing your workspace...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">

      {/* Custom Animations (Tailwind) */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>

      {/* --- Toast Notification (Top Right) --- */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[60] px-6 py-3 rounded-lg shadow-xl font-medium text-white transition-all transform ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* --- Navbar --- */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2 rounded-lg font-bold text-xl shadow-md">B</div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">BizPlan AI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-xs font-medium text-slate-400 uppercase tracking-wider">
            {userEmail}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* --- Main Dashboard Layout --- */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">

        {/* Left: Sidebar / Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 truncate w-32">{userEmail}</div>
                <div className="text-xs text-emerald-600 font-semibold">Free Plan</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Usage</h3>
            <div className="text-4xl font-extrabold mb-1">{realUsage}</div>
            <div className="text-xs text-slate-400">Plans generated</div>

            {/* Progress Bar Logic */}
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3">
              {/* Calculate Percentage */}
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min((realUsage / realLimit) * 100, 100)}%` }}></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {Math.round((realUsage / realLimit) * 100)}% of {realLimit} monthly limit
            </div>
          </div>
        </div>

        {/* Right: Tool Area */}
        <div className="lg:col-span-3 space-y-8">

          {/* Tool Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 p-8 border-b border-slate-100">
              <h1 className="text-2xl font-bold text-white mb-1">AI Marketing Generator</h1>
              <p className="text-slate-400 text-sm mt-1">Create professional strategies in seconds.</p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Niche</label>
                <input
                  className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="e.g. Boutique Coffee Shop"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Audience</label>
                <input
                  className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="e.g. IT Professionals"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Platform</label>
                <select
                  className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={platform} onChange={e => setPlatform(e.target.value)}
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Goal</label>
                <select
                  className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={goal} onChange={e => setGoal(e.target.value)}
                >
                  <option value="sales">Drive Sales</option>
                  <option value="brand">Brand Awareness</option>
                  <option value="engagement">Boost Engagement</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full rounded-xl text-white font-bold py-4 shadow-lg transform transition hover:-translate-y-1 text-sm uppercase tracking-wide ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
                >
                  {loading ? 'Processing...' : 'Generate Strategy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- POP-UP MODAL (Result) --- */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl z-10 animate-in fade-in zoom-in duration-300">

            {/* Modal Header */}
            <div className="bg-slate-900 p-6 rounded-t-3xl flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">Marketing Blueprint</h2>
                <p className="text-slate-400 text-sm mt-1">{niche} - {platform}</p>
              </div>
              <div className="flex gap-2">
                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
                  title="Save as PDF"
                >
                  🖨️
                </button>
                {/* Close Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white transition text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">

              {/* Strategy */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Core Strategy</h3>
                <div className="bg-emerald-50 p-5 border border-emerald-100 rounded-xl text-slate-800 font-medium leading-relaxed">
                  {result.strategy}
                </div>
              </div>

              {/* Pro Tip */}
              {result.proTip && (
                <div className="flex gap-4 bg-amber-50 p-5 rounded-xl border border-amber-100">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Expert Insight</h3>
                    <p className="text-slate-800 text-sm">{result.proTip}</p>
                  </div>
                </div>
              )}

              {/* NEW: Best Time to Post */}
              {result.bestPostTime && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Best Time to Post</h3>
                      <p className="text-slate-800 text-sm font-medium">{result.bestPostTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">7-Day Execution Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.schedule && result.schedule.map((dayPlan, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:border-emerald-300 transition">
                      <div className="font-bold text-emerald-600 mb-1 flex items-center gap-2">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded text-xs">Day {i + 1}</span>
                      </div>
                      <div className="text-sm text-slate-800">{dayPlan}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              {result.hashtags && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Targeted Hashtags</h3>
                  <div className="bg-slate-900 text-slate-50 p-4 rounded-xl font-mono text-sm flex justify-between items-center gap-4">
                    <span>{result.hashtags}</span>
                    <button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold transition"
                      onClick={() => {
                        navigator.clipboard.writeText(result.hashtags)
                        showToast('Hashtags Copied!', 'success')
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-8 py-4 rounded-b-3xl flex justify-between items-center border-t border-slate-200">
              <span className="text-xs text-slate-400">BizPlan AI Generated</span>

              <div className="flex gap-2">
                {/* NEW: Copy All Button */}
                <button
                  onClick={() => {
                    const allText = `Strategy:\n${result.strategy}\n\nPro Tip:\n${result.proTip}\n\nBest Time to Post:\n${result.bestPostTime}\n\nSchedule:\n${result.schedule.join('\n')}\n\nHashtags:\n${result.hashtags}`
                    navigator.clipboard.writeText(allText)
                    showToast('Full Plan Copied!', 'success')
                  }}
                  className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition text-xs"
                >
                  Copy All
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="bg-slate-200 text-slate-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}