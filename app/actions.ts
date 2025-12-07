'use server'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  // 1. Domain Validation (Zero Trust)
  // TODO: Move allowed domains to config or env
  const allowedDomains = ['muj.manipal.edu', 'manipal.edu'] 
  const domain = email.split('@')[1]
  
  if (!allowedDomains.some(d => domain?.endsWith(d))) {
    return { error: 'Access Denied: strictly for college students only.' }
  }

  // 2. Magic Link / OTP
  console.log('Attempting Supabase SignInWithOtp for:', email)
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Allow signups
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Supabase Auth Error:', error)
    return { error: error.message }
  }

  console.log('Supabase SignInWithOtp Success')

  // 3. Success (Client will show "Check your email")
  return { success: true }
}
