import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Success! Redirect to home
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/home`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/home`)
      } else {
        return NextResponse.redirect(`${origin}/home`)
      }
    }
    
    console.error('Auth callback error:', error)
  }

  // Error - redirect to landing page with error message
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
