import { createClient } from '@/utils/supabase/server'
import { getEntries } from '@/app/journal/actions'
import { logout } from '@/app/auth/actions'
import LoginForm from '@/components/login-form'
import JournalUI from '@/components/journal-ui'

export default async function Home() {
  const supabase = await createClient()
  
  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Not Logged In? Show Login Form
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoginForm />
      </main>
    )
  }

  // 3. Logged In? Fetch Data & Show Journal
  const entries = await getEntries()

  return (
    <main className="min-h-screen bg-white p-10 flex flex-col items-center">
      <div className="w-full max-w-lg flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My App</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:inline">{user.email}</span>
          <form action={logout}>
            <button className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Pass the server data to your client component */}
      <JournalUI initialEntries={entries} email={user.email} />
    </main>
  )
}
