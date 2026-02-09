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
  // UPDATED: Fetches avatar_url for both users in the join
  // Note: 'select(*)' now includes the new user_a_ack and user_b_ack columns
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
    // Check specific acknowledgment column for the current user
    const hasAcknowledged = isUserA ? relationship.user_a_ack : relationship.user_b_ack
    
    if (hasAcknowledged) {
      showJournal = true
    } else {
      showSuccessModal = true
    }
  }

  // --- VIEW 1: JOURNAL (Matched & Acknowledged) ---
  if (showJournal && relationship) {
    // 1. Get Partner Name & Avatar
    const isUserA = relationship.user_a === user.id 
    // @ts-ignore
    const partnerProfile = isUserA ? relationship.user_b_profile : relationship.user_a_profile
    
    const partnerName = partnerProfile?.display_name
    const partnerAvatarUrl = partnerProfile?.avatar_url

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
            <h1 className="text-xl font-bold text-gray-900">Grateful</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {myProfile?.display_name} & {partnerName || 'Partner'}
            </p>
          </div>
          <SettingsMenu 
            currentUserId={user.id} 
            currentAvatarUrl={myProfile?.avatar_url} 
          />
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

  // --- VIEW 2: ONBOARDING (Intro, Waiting, or Success Modal) ---
  // If relationship exists but !showJournal, showSuccessModal will be true
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
