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
import { Loader2, Heart, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = {
  display_name: string | null
  target_partner_email: string | null
}

export default function OnboardingFlow({ 
  initialProfile, 
  userEmail,
  showSuccessModal = false
}: { 
  initialProfile: Profile | null, 
  userEmail: string,
  showSuccessModal?: boolean
}) {
  const router = useRouter()
  
  // Determine initial step
  const getInitialStep = () => {
    if (showSuccessModal) return 'SUCCESS'
    if (!initialProfile?.display_name) return 'NAME'
    if (initialProfile?.target_partner_email) return 'WAITING'
    return 'INVITE'
  }

  const [step, setStep] = useState<'NAME' | 'INVITE' | 'WAITING' | 'SUCCESS'>(getInitialStep())
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(initialProfile?.display_name || '')
  const [partnerEmail, setPartnerEmail] = useState(initialProfile?.target_partner_email || '')
  
  // -- ACTION: Handle the "Let's be grateful" click --
  const handleStartJournaling = async () => {
    setLoading(true)
    await acknowledgeMatch() // Sets the DB flag to true
    router.refresh() // Reloads page -> Page.tsx sees flag -> Shows Journal
  }

  // -- STEP 1: NAME SUBMISSION --
  const handleNameSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await updateName(name)
    setLoading(false)
    setStep('INVITE')
  }

  // -- STEP 2: PARTNER INVITE --
  const handleInviteSubmit = async () => {
    if (!partnerEmail.trim() || partnerEmail === userEmail) return
    setLoading(true)
    await requestPartner(partnerEmail)
    setLoading(false)
    setStep('WAITING')
  }

  // -- STEP 3: POLLING --
  useEffect(() => {
    if (step !== 'WAITING') return

    const check = async () => {
      const result = await checkMatchStatus()
      if (result.status === 'matched') {
        setStep('SUCCESS')
      }
    }

    // Run immediately, then poll
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

  // -- RENDER: SUCCESS --
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

  if (step === 'WAITING') {
    return (
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Waiting for Partner</h2>
          <p className="text-gray-500 mt-2">
            Ask them to enter <strong>{userEmail}</strong> on their screen.
          </p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-2xl mb-8">
          <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">You invited</p>
          <p className="text-xl font-medium text-gray-900">{partnerEmail}</p>
        </div>

        <button 
          onClick={handleWithdraw}
          disabled={loading}
          className="text-red-500 font-medium hover:bg-red-50 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <XCircle size={20} /> Withdraw Request
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
          <button 
            onClick={handleNameSubmit}
            disabled={!name.trim() || loading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8 hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // RENDER: INVITE (Default fallback)
  return (
    <div className="max-w-md w-full">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-3xl font-bold text-gray-900">Find Partner</h2>
        <form action={logout}>
           <button className="text-sm text-gray-400 hover:text-gray-600">Log Out</button>
        </form>
      </div>
      <p className="text-gray-500 mb-8">Enter your partner's email to connect.</p>
      
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
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </div>
    </div>
  )
}
