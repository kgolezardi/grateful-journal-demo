import { createClient } from '@/utils/supabase/server'
import { getEntriesByDate } from '@/app/journal/actions'
import GratitudeJournal from '@/components/gratitude-journal'
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

  // 1. Fetch Relationship & Partner Name
  const { data: rel } = await supabase
    .from('relationships')
    .select(`*, user_a_profile:profiles!user_a(display_name), user_b_profile:profiles!user_b(display_name)`)
    .eq('id', id)
    .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
    .single()

  if (!rel) return notFound()

  const isUserA = rel.user_a === user!.id
  // @ts-ignore
  const partnerName = isUserA ? rel.user_b_profile?.display_name : rel.user_a_profile?.display_name

  // 2. Find the LAST day entries were made in this relationship
  // This ensures the page doesn't open to "Today" (which would be blank for an old relationship)
  const { data: lastEntry } = await supabase
    .from('entries')
    .select('entry_date')
    .eq('relationship_id', rel.id)
    .order('entry_date', { ascending: false })
    .limit(1)
    .single()

  // Default to today if no entries found (weird edge case)
  const startDate = lastEntry?.entry_date || new Date().toISOString().split('T')[0]

  // 3. Fetch entries for that start date
  const entries = await getEntriesByDate(rel.id, startDate)

  return (
    <main className="min-h-screen bg-white flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md flex items-center gap-4 mb-6 sticky top-0 bg-white z-50 py-4">
        <Link href="/history" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Memory Lane</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            With {partnerName}
          </p>
        </div>
      </div>

      <GratitudeJournal 
        initialEntries={entries} 
        currentUserId={user!.id} 
        partnerName={partnerName || 'Partner'}
        relationshipId={rel.id}
        readOnly={true}
        initialDate={startDate}
      />
    </main>
  )
}
