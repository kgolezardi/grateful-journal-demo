import { createClient } from '@/utils/supabase/server'
import { getEntries } from '@/app/journal/actions'
import JournalUI from '@/components/journal-ui'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function HistoryDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { id } = await params

  // Fetch Relationship (Security Check)
  // Ensure the user was actually part of this relationship
  const { data: rel } = await supabase
    .from('relationships')
    .select(`
      *,
      user_a_profile:profiles!user_a(display_name),
      user_b_profile:profiles!user_b(display_name)
    `)
    .eq('id', id)
    .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
    .single()

  if (!rel) return notFound()

  // Fetch Entries for this specific relationship
  const entries = await getEntries(rel.id)

  // Determine Partner Name
  const isUserA = rel.user_a === user!.id
  const partnerName = isUserA 
    ? rel.user_b_profile?.display_name 
    : rel.user_a_profile?.display_name

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-xl flex items-center gap-4 mb-6 sticky top-0 bg-gray-50 z-10 py-4">
        <Link href="/history" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Memory Lane</h1>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            With {partnerName || 'Partner'}
          </p>
        </div>
      </div>

      <JournalUI 
        initialEntries={entries} 
        currentUserId={user!.id} 
        relationshipId={rel.id}
        readOnly={true} 
      />
    </main>
  )
}
