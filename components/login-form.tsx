'use client'

import { useState } from 'react'
import { login } from '@/app/auth/actions'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await login(formData)
    if (result?.success) {
      setMessage('Magic link sent! Check your email.')
    } else {
      setMessage('Something went wrong.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
      <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>
      {message ? (
        <p className="text-green-600 bg-green-50 p-3 rounded">{message}</p>
      ) : (
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input 
            name="email" 
            type="email" 
            placeholder="you@example.com" 
            required 
            className="p-3 border rounded"
          />
          <button disabled={loading} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Sending...' : 'Sign In'}
          </button>
        </form>
      )}
    </div>
  )
}
