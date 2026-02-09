'use client'

import { useState } from 'react'
import { sendLoginCode, verifyLoginCode } from '@/app/auth/actions'
import { Loader2, Mail, ArrowRight } from 'lucide-react'

export default function LoginForm() {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // Constants
  const CODE_LENGTH = 8

  // -- STEP 1: SEND CODE --
  const handleSendCode = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const result = await sendLoginCode(email)
    
    setLoading(false)
    if (result.success) {
      setStep('OTP')
    } else {
      setError(result.error || 'Failed to send code')
    }
  }

  // -- STEP 2: VERIFY CODE --
  const handleVerifyCode = async () => {
    // Only allow verify if code is full length (optional, but good UX)
    if (code.length !== CODE_LENGTH) {
      setError(`Code must be ${CODE_LENGTH} digits`)
      return
    }
    
    setLoading(true)
    setError('')

    const result = await verifyLoginCode(email, code)
    
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    }
  }

  // Handle "Enter" key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'EMAIL') handleSendCode()
      else handleVerifyCode()
    }
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
      
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-500 text-sm">
          {step === 'EMAIL' 
            ? 'Enter your email to start' 
            : `Code sent to ${email}`}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* INPUT FIELDS */}
        {step === 'EMAIL' ? (
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </div>
        ) : (
          <div className="relative w-full">
            {/* The Magic Trick: 
               A real input covers the entire area but is invisible (opacity-0).
               This captures focus, typing, pasting, and backspace natively.
            */}
            <input 
              type="text" 
              value={code}
              onChange={(e) => {
                // Only allow numbers and limit length
                const val = e.target.value.replace(/[^0-9]/g, '')
                if (val.length <= CODE_LENGTH) setCode(val)
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-default z-10"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              onKeyDown={handleKeyDown}
            />

            {/* VISUAL BOXES */}
            <div className="flex justify-between gap-1 sm:gap-2">
              {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                const digit = code[index]
                const isActive = index === code.length
                const isFilled = index < code.length

                return (
                  <div 
                    key={index}
                    className={`
                      w-8 h-12 sm:w-10 sm:h-14 
                      rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all
                      ${isActive ? 'border-blue-500 ring-4 ring-blue-100 bg-white z-0 scale-110' : ''}
                      ${isFilled ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-400'}
                    `}
                  >
                    {digit || ''}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}

        {/* ACTION BUTTON */}
        <button 
          onClick={step === 'EMAIL' ? handleSendCode : handleVerifyCode}
          disabled={loading || (step === 'EMAIL' ? !email : code.length !== CODE_LENGTH)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step === 'EMAIL' ? (
            <>
              Continue 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            'Verify & Sign In'
          )}
        </button>

        {/* BACK BUTTON (OTP Step Only) */}
        {step === 'OTP' && (
          <button 
            onClick={() => {
              setStep('EMAIL')
              setCode('')
              setError('')
            }}
            className="text-gray-400 text-sm hover:text-gray-600 py-2 transition-colors"
          >
            Wrong email? Go back
          </button>
        )}
      </div>
    </div>
  )
}
