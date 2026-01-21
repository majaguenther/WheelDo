import type {Metadata, Viewport} from 'next'
import {cookies} from 'next/headers'
import Script from 'next/script'
import {Geist, Geist_Mono} from 'next/font/google'
import {Providers} from '@/components/providers'
import {getThemeScript, isValidThemeId} from '@/lib/themes'
import {getBaseUrl} from '@/lib/url'
import type {ThemeId} from '@/types/theme'
import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    metadataBase: new URL(getBaseUrl()),
    title: {
        default: 'WheelDo - Focus on One Task at a Time',
        template: '%s | WheelDo',
    },
    description:
        'A todo app that helps you focus by limiting you to one task at a time. Spin the wheel when indecisive!',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'WheelDo',
    },
    icons: {
        apple: '/icons/apple-touch-icon.png',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'WheelDo',
    },
    twitter: {
        card: 'summary_large_image',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        {media: '(prefers-color-scheme: light)', color: '#ffffff'},
        {media: '(prefers-color-scheme: dark)', color: '#0f172a'},
    ],
}

async function getThemeFromCookie(): Promise<ThemeId> {
    const cookieStore = await cookies()
    const themeCookie = cookieStore.get('theme')
    const themeId = themeCookie?.value ?? 'default'
    return isValidThemeId(themeId) ? themeId : 'default'
}

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode
}>) {
    // Read theme from cookie - no DB query, no auth check
    const themeId = await getThemeFromCookie()
    // Theme script is generated from trusted preset data, not user input
    const themeScript = getThemeScript(themeId)

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {/* Theme script - runs before hydration to prevent FOUC */}
            {/* Content is safe: generated from predefined color presets, not user input */}
            <Script
                id="theme-script"
                strategy="beforeInteractive"
            >{themeScript}</Script>
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        >
        <Providers initialThemeId={themeId}>{children}</Providers>
        </body>
        </html>
    )
}
