'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logout } from '@/app/auth/actions'
import { removePartner } from '@/app/onboarding/actions'
import { LogOut, UserX, History, Edit, Camera, User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function SettingsMenu({ 
  currentUserId, 
  currentAvatarUrl 
}: { 
  currentUserId: string, 
  currentAvatarUrl: string | null 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // --- ACTIONS ---

  const handleRemovePartner = async () => {
    if (confirm("Are you sure? This will disconnect you from your partner.")) {
      await removePartner()
      router.refresh()
    }
  }

  const handleEditName = async () => {
    const newName = prompt("Enter your new display name:")
    if (newName && newName.trim()) {
      const { updateName } = await import('@/app/onboarding/actions')
      await updateName(newName)
      router.refresh()
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return

      setUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${currentUserId}/${Date.now()}.${fileExt}`

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUserId)

      if (updateError) throw updateError

      // 4. Update UI immediately
      setAvatarUrl(publicUrl)
      router.refresh() // Refreshes server components (like the header) if needed

    } catch (error) {
      alert('Error uploading image')
      console.error(error)
    } finally {
      setUploading(false)
      setIsOpen(false) // Close menu after selection
    }
  }

  return (
    <div className="relative">
      {/* TRIGGER: Shows Avatar instead of 3 dots */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors bg-gray-100 flex items-center justify-center"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : avatarUrl ? (
          <Image 
            src={avatarUrl} 
            alt="Profile" 
            width={40} 
            height={40} 
            className="object-cover w-full h-full"
          />
        ) : (
          <User className="w-6 h-6 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-12 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* AVATAR UPLOAD OPTION */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium"
            >
              <Camera size={16} className="text-blue-500" /> 
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />

            <div className="my-1 border-t border-gray-100" />

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
