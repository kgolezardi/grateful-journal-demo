// app/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveEntry(text: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('entries')
    .insert({ content: text })

  if (error) {
    console.error("Error saving:", error)
    return { success: false }
  }

  // This tells Next.js: "The data changed! Refresh any pages using this data."
  revalidatePath('/')
  return { success: true }
}

export async function getEntries() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false }) // Newest first

  if (error) {
    console.error("Error fetching entries:", error)
    return []
  }

  return data
}

export async function deleteEntry(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id) // Only delete the row with this specific ID

  if (error) {
    console.error("Error deleting:", error)
    return { success: false }
  }

  return { success: true }
}
