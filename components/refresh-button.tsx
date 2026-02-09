'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [isSpinning, setIsSpinning] = useState(false)

  const handleRefresh = () => {
    setIsSpinning(true)
    window.location.reload()
    
    // Stop spinning after 1s (visual feedback only, since refresh is async void)
    setTimeout(() => setIsSpinning(false), 1000)
  }

  return (
    <button 
      onClick={handleRefresh}
      className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
      aria-label="Refresh"
    >
      <RefreshCw 
        size={20} 
        className={isSpinning ? "animate-spin" : ""} 
      />
    </button>
  )
}
