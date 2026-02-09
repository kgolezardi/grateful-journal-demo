import { createClient } from '@/utils/supabase/server'
import { getEntriesByDate } from '@/app/journal/actions' 
import LoginForm from '@/components/login-form'
import GratitudeJournal from '@/components/gratitude-journal' 
import OnboardingFlow from '@/components/onboarding-flow'
import SettingsMenu from '@/components/settings-menu'
import RefreshButton from '@/components/refresh-button' // <--- IMPORT THIS

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
    .select('*, user_a_profile:profiles!user_a(display_name, avatar_url), user_b_profile:profiles!user_b(display_name, avatar_url)')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'active')
    .single()

  // Check Profile
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let showJournal = false
  let showSuccessModal = false

  if (relationship) {
    const isUserA = relationship.user_a === user.id
    const hasAcknowledged = isUserA ? relationship.user_a_ack : relationship.user_b_ack
    
    if (hasAcknowledged) {
      showJournal = true
    } else {
      showSuccessModal = true
    }
  }

  // --- VIEW 1: JOURNAL (Matched & Acknowledged) ---
  if (showJournal && relationship) {
    const isUserA = relationship.user_a === user.id 
    // @ts-ignore
    const partnerProfile = isUserA ? relationship.user_b_profile : relationship.user_a_profile
    
    const partnerName = partnerProfile?.display_name
    const partnerAvatarUrl = partnerProfile?.avatar_url

    // Fetch TODAY'S entries
    const today = new Date()
    today.setHours(today.getHours() - 5) 
    const todayStr = today.toISOString().split('T')[0]
    const entries = await getEntriesByDate(relationship.id, todayStr)

    return (
      <main className="min-h-screen bg-white flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-md flex justify-between items-center mb-6 sticky top-0 bg-white z-50 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grateful</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {myProfile?.display_name} & {partnerName || 'Partner'}
            </p>
          </div>
          
          {/* UPDATED: Flex container for buttons */}
          <div className="flex items-center gap-1">
            <RefreshButton />
            <SettingsMenu 
              currentUserId={user.id} 
              currentAvatarUrl={myProfile?.avatar_url} 
            />
          </div>
        </div>

        <GratitudeJournal 
          initialEntries={entries} 
          currentUserId={user.id}
          partnerName={partnerName || 'Partner'}
          relationshipId={relationship.id}
          currentUserAvatar={myProfile?.avatar_url}
          partnerAvatar={partnerAvatarUrl}
        />
      </main>
    )
  }

  // --- VIEW 2: ONBOARDING ---
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <OnboardingFlow 
        initialProfile={myProfile} 
        userEmail={user.email!}
        userId={user.id}
        showSuccessModal={showSuccessModal}
      />
    </main>
  )
}
