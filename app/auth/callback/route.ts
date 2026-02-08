import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // This code takes the "code" from the URL and exchanges it for a user session
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Success! Send them to the dashboard
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // If something broke, send them back to home with an error
  return NextResponse.redirect(`${origin}/?error=auth`)
}
