'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveEntry(text: string) {
  const supabase = await createClient()
  
  // We can just rely on the RLS policies and default values we set in SQL!
  // But checking the user here is a good double-check.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const { error } = await supabase
    .from('entries')
    .insert({ content: text, user_id: user.id })

  if (error) return { success: false }

  revalidatePath('/')
  return { success: true }
}

export async function getEntries() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })
  
  return data || []
}

export async function deleteEntry(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('entries').delete().eq('id', id)
  return { success: !error }
}