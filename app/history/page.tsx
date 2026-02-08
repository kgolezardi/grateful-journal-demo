import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Fetch ENDED relationships
  // Since we fixed the policy scoping, we can try a direct join!
  const { data: history } = await supabase
    .from('relationships')
    .select(`
      *,
      user_a_profile:profiles!user_a(display_name),
      user_b_profile:profiles!user_b(display_name)
    `)
    .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
    .eq('status', 'ended')
    .order('ended_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full text-gray-600 shadow-sm hover:bg-gray-100">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Past Relationships</h1>
        </div>

        <div className="space-y-4">
          {!history || history.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No history found.</p>
          ) : (
            history.map((rel: any) => {
              // Determine partner name
              const isUserA = rel.user_a === user!.id
              const partnerName = isUserA 
                ? rel.user_b_profile?.display_name 
                : rel.user_a_profile?.display_name

              return (
                <Link 
                  key={rel.id} 
                  href={`/history/${rel.id}`}
                  className="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{partnerName || 'Unknown Partner'}</h3>
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        Ended: {new Date(rel.ended_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-blue-600 font-medium text-sm">View Journal &rarr;</span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
