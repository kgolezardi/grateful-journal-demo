'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'

export default function AvatarUploader({ 
  uid, 
  url, 
  onUploadComplete 
}: { 
  uid: string, 
  url: string | null,
  onUploadComplete: (newUrl: string) => void 
}) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      // Naming convention: userId/timestamp.ext 
      // Using timestamp forces the browser to refresh the image instead of showing a cached old one
      const filePath = `${uid}/${Date.now()}.${fileExt}`

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 2. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update Profile in Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', uid)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      onUploadComplete(publicUrl)

    } catch (error) {
      alert('Error uploading avatar!')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {/* AVATAR DISPLAY */}
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-stone-200 flex items-center justify-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <User className="w-10 h-10 text-stone-400" />
          )}
        </div>

        {/* UPLOAD BUTTON OVERLAY */}
        <label 
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
          htmlFor="single"
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">
        Tap to change
      </p>
    </div>
  )
}
