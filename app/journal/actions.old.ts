'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveEntry(text: string) {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return { success: false, message: 'Unauthorized' }

  // Find the Active Relationship
  // We need to attach this entry to the relationship, not just the user.
  const { data: rel } = await supabase
    .from('relationships')
    .select('id')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')
    .single()

  if (!rel) return { success: false, message: 'No active relationship found' }

  // Insert with Relationship ID
  const { error } = await supabase
    .from('entries')
    .insert({ 
      content: text, 
      user_id: user.id, 
      relationship_id: rel.id 
    })

  if (error) return { success: false, message: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function getEntries(relationshipId?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (relationshipId) {
    query = query.eq('relationship_id', relationshipId)
  }

  const { data } = await query // TODO: this is super interesting. What happens before await?
  return data || [] 
}

export async function updateEntry(id: number, content: string) {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  
  // RLS Policy "Users can update own entries" will handle security,
  // but checking user existence is good practice.
  if (!user) return { success: false, message: 'Unauthorized' }

  const { error } = await supabase
    .from('entries')
    .update({ content })
    .eq('id', id)
    .eq('user_id', user.id) // Double safety: ensure I own it

  if (error) return { success: false, message: error.message }
  
  revalidatePath('/')
  return { success: true }
}

export async function deleteEntry(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('entries').delete().eq('id', id)
  return { success: !error }
}