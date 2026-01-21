import { NextRequest, NextResponse } from 'next/server'

function createNonCacheableRedirect(url: URL): NextResponse {
  const response = NextResponse.redirect(url)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('better-auth.session_token')?.value

  // Handle homepage redirect (with no-cache to prevent stale redirects)
  if (pathname === '/') {
    const destination = sessionToken ? '/dashboard' : '/login'
    return createNonCacheableRedirect(new URL(destination, request.url))
  }

  // Redirect authenticated users away from login page (with no-cache)
  if (pathname === '/login' && sessionToken) {
    return createNonCacheableRedirect(new URL('/dashboard', request.url))
  }

  // Protected routes are handled by their layout (proper session validation)

  // Continue with security headers for non-redirect requests
  const isDev = process.env.NODE_ENV === 'development'
  const response = NextResponse.next()

  if (!isDev) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'unsafe-inline'`,
      "img-src 'self' blob: data: https://avatars.githubusercontent.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "connect-src 'self' https://api.geoapify.com",
      'upgrade-insecure-requests',
    ]
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
