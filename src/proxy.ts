import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/dashboard', '/tasks', '/wheel', '/history', '/settings']
const authPaths = ['/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('better-auth.session_token')?.value

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  // Auth redirects
  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isDev = process.env.NODE_ENV === 'development'

  const response = NextResponse.next()

  // Only apply strict CSP in production
  // In development, Next.js/Turbopack uses inline scripts that can't have nonces
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

  // Security headers (apply in both dev and prod)
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
