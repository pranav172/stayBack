import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Don't run auth checks on auth callback route
  // Let the callback handle session creation first
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/auth/callback')) {
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - require login
  const protectedRoutes = ['/home', '/chat', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect to home if already logged in and visiting landing page
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return response
}
