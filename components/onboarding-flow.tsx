'use client'

import { useState, useEffect } from 'react'
import { 
  updateName, 
  requestPartner, 
  checkMatchStatus, 
  removePartner, 
  acknowledgeMatch 
} from '@/app/onboarding/actions'
import { logout } from '@/app/auth/actions'
import { Loader2, Heart, XCircle, Smartphone, UserCircle2, Link2, Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AvatarUploader from '@/components/avatar-uploader'

type Profile = {
  display_name: string | null
  target_partner_email: string | null
  avatar_url: string | null 
}

export default function OnboardingFlow({ 
  initialProfile, 
  userEmail,
  userId,
  showSuccessModal = false 
}: { 
  initialProfile: Profile | null, 
  userEmail: string,
  userId: string,
  showSuccessModal?: boolean
}) {
  const router = useRouter()
  
  // Update Initial Step Logic
  const getInitialStep = () => {
    if (showSuccessModal) return 'SUCCESS'
    if (!initialProfile?.display_name) return 'NAME'
    if (!initialProfile?.avatar_url) return 'AVATAR' 
    if (initialProfile?.target_partner_email) return 'WAITING'
    return 'INVITE'
  }

  const [step, setStep] = useState<'NAME' | 'AVATAR' | 'INVITE' | 'WAITING' | 'SUCCESS'>(getInitialStep())
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(initialProfile?.display_name || '')
  const [partnerEmail, setPartnerEmail] = useState(initialProfile?.target_partner_email || '')
  const [currentAvatar, setCurrentAvatar] = useState(initialProfile?.avatar_url || null)
  const [copied, setCopied] = useState(false)
  
  // -- ACTION: Handle Gratitude Click --
  const handleStartJournaling = async () => {
    setLoading(true)
    await acknowledgeMatch()
    router.refresh()
  }

  // -- STEP 1: NAME SUBMISSION --
  const handleNameSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await updateName(name)
    setLoading(false)
    setStep('AVATAR') 
  }

  // -- STEP 3: PARTNER INVITE --
  const handleInviteSubmit = async () => {
    if (!partnerEmail.trim() || partnerEmail === userEmail) return
    setLoading(true)
    await requestPartner(partnerEmail)
    setLoading(false)
    setStep('WAITING')
  }

  // -- STEP 4: POLLING --
  useEffect(() => {
    if (step !== 'WAITING') return
    const check = async () => {
      const result = await checkMatchStatus()
      if (result.status === 'matched') setStep('SUCCESS')
    }
    check()
    const interval = setInterval(check, 3000)
    return () => clearInterval(interval)
  }, [step])

  const handleWithdraw = async () => {
    if (!confirm('Stop waiting for this partner?')) return
    setLoading(true)
    await removePartner()
    setPartnerEmail('')
    setLoading(false)
    setStep('INVITE')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(userEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // -- RENDERERS --

  if (step === 'SUCCESS') {
    return (
      <div className="max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="text-red-500 w-12 h-12 fill-red-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">It's a Match!</h2>
        <p className="text-gray-500 mb-8">You are now connected.</p>
        <button 
          onClick={handleStartJournaling} 
          disabled={loading}
          className="w-full bg-gray-900 text-white p-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          Let's be grateful
        </button>
      </div>
    )
  }

  // --- UPDATED: WAITING SCREEN ---
  if (step === 'WAITING') {
    return (
      <div className="max-w-md w-full">
        {/* Top Loading Animation */}
        <div className="flex flex-col items-center mb-8">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Waiting for Partner...</h2>
          <p className="text-gray-500 text-sm mt-1">Tell them to follow these steps:</p>
        </div>
        
        {/* Step-by-Step Instructions */}
        <div className="space-y-4 mb-8">
          
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-blue-600">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">1. Open the App</h3>
              <p className="text-xs text-gray-500 mt-0.5">They need to install/open the app on their phone.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-blue-600">
              <UserCircle2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-sm">2. Sign In</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-1">They must log in using:</p>
              
              <p className="font-bold text-gray-900 text-sm break-all">
                {partnerEmail}
              </p>
            </div>
          </div>

          {/* Step 3 (UNIFORM STYLE) */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-blue-600">
              <Link2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm">3. Connect to You</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">They must enter <strong>YOUR</strong> email:</p>
              
              <button 
                onClick={copyToClipboard}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-between group hover:border-blue-400 transition-colors"
              >
                <span className="font-mono text-sm text-gray-800 font-medium truncate pr-2">{userEmail}</span>
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400 group-hover:text-blue-500" />}
              </button>
            </div>
          </div>

        </div>

        {/* Red Cancel Button */}
        <button 
          onClick={handleWithdraw} 
          disabled={loading} 
          className="w-full text-red-500 font-medium hover:bg-red-50 px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <XCircle size={20} /> Cancel Request
        </button>
      </div>
    )
  }

  if (step === 'NAME') {
    return (
      <div className="max-w-md w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
        <p className="text-gray-500 mb-8">What should we call you?</p>
        <div className="space-y-4">
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your First Name"
            className="w-full text-2xl p-4 border-b-2 border-gray-200 focus:border-blue-500 outline-none bg-transparent placeholder-gray-300 transition-colors"
            autoFocus
          />
          <button onClick={handleNameSubmit} disabled={!name.trim() || loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg disabled:opacity-50 mt-8 hover:bg-blue-700 transition-colors">
            Continue
          </button>
        </div>
      </div>
    )
  }

  if (step === 'AVATAR') {
    return (
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Hi, {name}!</h2>
        <p className="text-gray-500 mb-8">Add a photo so your partner sees you.</p>
        
        <AvatarUploader 
          uid={userId}
          url={currentAvatar}
          onUploadComplete={(url) => setCurrentAvatar(url)}
        />

        <div className="w-full mt-10">
           <button 
            onClick={() => setStep('INVITE')}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors"
          >
            {currentAvatar ? 'Looks Good' : 'Skip for now'}
          </button>
        </div>
      </div>
    )
  }

  // --- INPUT SCREEN ---
  return (
    <div className="max-w-md w-full">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-3xl font-bold text-gray-900">Link Accounts</h2>
        <form action={logout}>
           <button className="text-sm text-gray-400 hover:text-gray-600">Log Out</button>
        </form>
      </div>
      <p className="text-gray-500 mb-8 leading-relaxed">
        Enter your partner's email. <br/>
        <span className="text-sm text-gray-400">They must also enter yours on their screen.</span>
      </p>
      
      <div className="space-y-6">
        <input 
          type="email"
          value={partnerEmail}
          onChange={(e) => setPartnerEmail(e.target.value)}
          placeholder="partner@example.com"
          className="w-full text-xl p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all"
          autoFocus
        />
        <button 
          onClick={handleInviteSubmit}
          disabled={!partnerEmail.trim() || loading}
          className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? 'Connecting...' : "I'm Ready"}
        </button>
      </div>
    </div>
  )
}
