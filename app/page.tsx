import { createClient } from '@/utils/supabase/server'
import { getEntries } from '@/app/journal/actions'
import LoginForm from '@/components/login-form'
import JournalUI from '@/components/journal-ui'
import OnboardingFlow from '@/components/onboarding-flow'
import SettingsMenu from '@/components/settings-menu'

export default async function Home() {
  const supabase = await createClient()
  
  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoginForm />
      </main>
    )
  }

  // 2. Relationship Check (The "Gatekeeper")
  // We check if the user is already in an ACTIVE relationship.
  const { data: relationship } = await supabase
    .from('relationships')
    .select('*, user_a_profile:profiles!user_a(display_name), user_b_profile:profiles!user_b(display_name)')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')
    .single()

  // 3. Profile Check (For the onboarding state)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // SCENARIO A: Fully Partnered -> Show the App
  if (relationship) {
    const entries = await getEntries(relationship.id)
    
    // Determine partner's name for the UI
    const isUserA = relationship.user_a === user.id
    // @ts-ignore (Supabase types can be tricky with joins, ignoring for prototype speed)
    const partnerName = isUserA ? relationship.user_b_profile?.display_name : relationship.user_a_profile?.display_name
    
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
        {/* HEADER */}
        <div className="w-full max-w-xl flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Our Journal</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              You & {partnerName || 'Partner'}
            </p>
          </div>
          
        <SettingsMenu />
        </div>

        <JournalUI 
          initialEntries={entries} 
          currentUserId={user.id}
          relationshipId={relationship.id} // <--- This is new
        />
      </main>
    )
  }

  // SCENARIO B: Not Partnered -> Show Onboarding Wizard
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <OnboardingFlow 
        initialProfile={profile} 
        userEmail={user.email!} 
      />
    </main>
  )
}
