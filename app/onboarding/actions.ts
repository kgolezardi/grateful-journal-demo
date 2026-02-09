'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 1. Update Display Name
 */
export async function updateName(name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', (await supabase.auth.getUser()).data.user!.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  return { success: true }
}

/**
 * 2. Request Partner (Inputs the email)
 * The Database Trigger 'check_for_match' will run immediately after this update.
 * If the match is valid, the Relationship row will appear instantly.
 */
export async function requestPartner(partnerEmail: string) {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user!

  if (!user.email) return { success: false, error: 'User email missing' }
  if (user.email === partnerEmail) return { success: false, error: 'Cannot match with yourself' }

  const { error } = await supabase
    .from('profiles')
    .update({ target_partner_email: partnerEmail })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/')
  return { success: true }
}

/**
 * 3. Check Status (Used by the "Waiting Room" UI)
 * We check if a Relationship row exists for us.
 */
export async function checkMatchStatus() {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user!

  // A. Check for an active relationship
  // (The Trigger would have created this if the match was successful)
  const { data: relationship } = await supabase
    .from('relationships')
    .select('*, user_a_profile:user_a(display_name), user_b_profile:user_b(display_name)')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')
    .single()

  if (relationship) {
    return { status: 'matched', relationship }
  }

  // B. If no relationship, return my current target so UI knows we are waiting
  const { data: profile } = await supabase
    .from('profiles')
    .select('target_partner_email')
    .eq('id', user.id)
    .single()

  return { 
    status: 'waiting', 
    target_email: profile?.target_partner_email || null 
  }
}

/**
 * 4. Withdraw Request / Remove Partner
 */
export async function removePartner() {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user!

  // 1. Clear my target email (stops the waiting)
  await supabase
    .from('profiles')
    .update({ target_partner_email: null })
    .eq('id', user.id)

  // 2. End any active relationship (History is preserved because we don't DELETE the row)
  await supabase
    .from('relationships')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')

  revalidatePath('/')
  return { success: true }
}

/**
 * 5. Acknowledge Match
 * Sets the explicit 'ack' flag on the relationship table for the current user.
 */
export async function acknowledgeMatch() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  // 1. Find the active relationship
  const { data: relationship } = await supabase
    .from('relationships')
    .select('id, user_a, user_b')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')
    .single()

  if (!relationship) return

  // 2. Determine if I am User A or User B
  const isUserA = relationship.user_a === user.id
  
  // 3. Update the correct column dynamically
  const fieldToUpdate = isUserA ? 'user_a_ack' : 'user_b_ack'

  await supabase
    .from('relationships')
    .update({ [fieldToUpdate]: true })
    .eq('id', relationship.id)

  revalidatePath('/')
}
