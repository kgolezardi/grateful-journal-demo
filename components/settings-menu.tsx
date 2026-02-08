'use client'

import { useState } from 'react'
import { logout } from '@/app/auth/actions'
import { removePartner } from '@/app/onboarding/actions'
import { MoreVertical, LogOut, UserX, History, Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleRemovePartner = async () => {
    if (confirm("Are you sure? This will disconnect you from your partner.")) {
      await removePartner()
      router.refresh()
    }
  }

  const handleEditName = async () => {
    const newName = prompt("Enter your new display name:")
    if (newName && newName.trim()) {
      // We can reuse the onboarding action for this!
      const { updateName } = await import('@/app/onboarding/actions')
      await updateName(newName)
      router.refresh()
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={24} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <button 
              onClick={handleEditName}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
            >
              <Edit size={16} /> Edit Profile Name
            </button>

            <Link 
              href="/history" 
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
            >
              <History size={16} /> Past Relationships
            </Link>
            
            <div className="my-1 border-t border-gray-100" />

            <button 
              onClick={handleRemovePartner}
              className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              <UserX size={16} /> Remove Partner
            </button>
            
            <form action={logout}>
              <button className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 w-full text-left">
                <LogOut size={16} /> Log Out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
