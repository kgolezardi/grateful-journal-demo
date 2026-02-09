'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// FETCH: Get entries for a specific date range or single date
export async function getEntriesByDate(relationshipId: string, date: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('entries')
    .select('*')
    .eq('relationship_id', relationshipId)
    .eq('entry_date', date)
    .order('created_at', { ascending: true }) // Keep them in order of entry
  
  return data || []
}

// SAVE: Sync the list for a specific date
export async function saveDailyGratitude(texts: string[], date: string) {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return { success: false, message: 'Unauthorized' }

  // 1. Find Active Relationship
  const { data: rel } = await supabase
    .from('relationships')
    .select('id')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')
    .single()

  if (!rel) return { success: false, message: 'No active relationship' }

  // 2. TRANSACTION-LIKE LOGIC:
  // Since we are "syncing" the day's list, we delete old entries for THIS user on THIS date
  // and insert the new ones.
  
  const { error: deleteError } = await supabase
    .from('entries')
    .delete()
    .eq('user_id', user.id)
    .eq('entry_date', date)

  if (deleteError) return { success: false, message: deleteError.message }

  // 3. Insert new entries
  // Filter out empty strings just in case
  const validTexts = texts.filter(t => t.trim().length > 0)
  
  if (validTexts.length > 0) {
    const { error: insertError } = await supabase
      .from('entries')
      .insert(
        validTexts.map(text => ({
          content: text,
          user_id: user.id,
          relationship_id: rel.id,
          entry_date: date
        }))
      )
      
    if (insertError) return { success: false, message: insertError.message }
  }

  revalidatePath('/')
  return { success: true }
}
