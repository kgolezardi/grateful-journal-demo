import { createClient } from '@/utils/supabase/server'
import { getEntriesByDate } from '@/app/journal/actions' 
import { logout } from '@/app/auth/actions'
import LoginForm from '@/components/login-form'
import GratitudeJournal from '@/components/gratitude-journal' 
import OnboardingFlow from '@/components/onboarding-flow'
import SettingsMenu from '@/components/settings-menu'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoginForm />
      </main>
    )
  }

  // Check Relationship
  const { data: relationship } = await supabase
    .from('relationships')
    .select('*, user_a_profile:profiles!user_a(display_name), user_b_profile:profiles!user_b(display_name)')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')
    .single()

  // Check Profile
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (relationship) {
    // 1. Get Partner Name
    const isUserA = relationship.user_a === user.id 
    // @ts-ignore
    const partnerName = isUserA ? relationship.user_b_profile?.display_name : relationship.user_a_profile?.display_name

    // 2. Fetch TODAY'S entries (Timezone Safe Fix)
    const today = new Date()
    // Shift time back by 5 hours (approx EST offset) to prevent "Tomorrow" bug in the evenings
    // This keeps the server "date" consistent with Western Hemisphere users
    today.setHours(today.getHours() - 5) 
    
    const todayStr = today.toISOString().split('T')[0]
    const entries = await getEntriesByDate(relationship.id, todayStr)

    return (
      <main className="min-h-screen bg-white flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-md flex justify-between items-center mb-6 sticky top-0 bg-white z-50 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gratitude</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {myProfile?.display_name} & {partnerName || 'Partner'}
            </p>
          </div>
          <SettingsMenu />
        </div>

        <GratitudeJournal 
          initialEntries={entries} 
          currentUserId={user.id}
          partnerName={partnerName || 'Partner'}
          relationshipId={relationship.id}
        />
      </main>
    )
  }

  // Onboarding
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <OnboardingFlow 
        initialProfile={myProfile} 
        userEmail={user.email!} 
      />
    </main>
  )
}