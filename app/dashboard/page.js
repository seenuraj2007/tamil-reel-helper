'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
// --- NEW: Import Components ---
import UsageCard from '../../app/components/UsageCard'
import WelcomeAnimation from '../../app/components/WelcomeAnimation'
import ResultModal from '../../app/components/ResultModal'

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [goal, setGoal] = useState('sales')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
      } else {
        setUserEmail(session.user.email)
        
        // Fetch Real Usage from DB
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_usage, monthly_limit')
          .eq('user_id', session.user.id)
          .single()

        if (profile) {
          // Set State for UsageCard
          setRealUsage(profile.plan_usage || 0) // assuming state variable, see below
        }
        
        setTimeout(() => {
          setLoadingAuth(false)
        }, 2500)
      }
    }
    checkSession()
  }, [router])

  // State for UsageCard (Needs to be managed here for now)
  const [realUsage, setRealUsage] = useState(0)
  const [realLimit, setRealLimit] = useState(30)

  function showToast(message, type = 'success') {
    setToast({ show: true, msg: message, type })
    setTimeout(() => {
      setToast({ show: false, msg: '', type })
    }, 3000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleGenerate() {
    if (!niche.trim()) {
      showToast('Please enter your business niche', 'error')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session.user.id

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, audience, platform, goal, userId })
      })

      if (!res.ok) {
        const errorData = await res.json()
        showToast(errorData.error || 'Something went wrong', 'error')
        setLoading(false)
        return
      }

      const data = await res.json()
      setResult(data)
      setShowModal(true)
      showToast('Marketing Plan Generated Successfully!', 'success')
      
      // Update Local Usage State
      setRealUsage(prev => prev + 1)

    } catch (err) {
      console.error('Fetch error:', err)
      showToast('Network error.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loadingAuth) {
    return <WelcomeAnimation />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      
      {/* Styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
      `}</style>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[60] px-6 py-3 rounded-lg shadow-xl font-medium text-white transition-all transform ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2 rounded-lg font-bold text-xl shadow-md">B</div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">BizPlan AI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-xs font-medium text-slate-400 uppercase tracking-wider">{userEmail}</div>
          <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded transition">Logout</button>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        
        {/* LEFT: UsageCard Component */}
        <UsageCard 
          userEmail={userEmail} 
          usage={realUsage} 
          limit={realLimit} 
        />

        {/* RIGHT: Tool & Modal */}
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
                <input className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="e.g. Boutique Coffee Shop" value={niche} onChange={e => setNiche(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target</label>
                <input className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="e.g. IT Professionals" value={audience} onChange={e => setAudience(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Platform</label>
                <select className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" value={platform} onChange={e => setPlatform(e.target.value)}>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Goal</label>
                <select className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" value={goal} onChange={e => setGoal(e.target.value)}>
                  <option value="sales">Drive Sales</option>
                  <option value="brand">Brand Awareness</option>
                  <option value="engagement">Boost Engagement</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-2">
                <button onClick={handleGenerate} disabled={loading} className={`w-full rounded-xl text-white font-bold py-4 shadow-lg transform transition hover:-translate-y-1 text-sm uppercase tracking-wide ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}>
                  {loading ? 'Generating...' : 'Generate Strategy'}
                </button>
              </div>
            </div>
          </div>

          {/* Modal Component */}
          <ResultModal
            showModal={showModal}
            result={result}
            niche={niche}
            platform={platform}
            showToast={showToast}
            onClose={() => setShowModal(false)}
          />
        </div>
      </div>
    </div>
  )
}