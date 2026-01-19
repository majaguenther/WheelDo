import type {Metadata, Viewport} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import {Providers} from '@/components/providers'
import {getSession} from '@/lib/auth-server'
import {db} from '@/lib/db'
import {getThemeScript, isValidThemeId} from '@/lib/themes'
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
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL || 'https://wheel-do.vercel.app/'
    ),
    title: {
        default: 'WheelDo - Focus on One Task at a Time',
        template: '%s | WheelDo',
    },
    description:
        'A todo app that helps you focus by limiting you to one task at a time. Spin the wheel when indecisive!',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'WheelDo',
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

async function getUserThemeId(): Promise<ThemeId> {
    try {
        const session = await getSession()
        if (!session?.user?.id) {
            return 'default'
        }

        const user = await db.user.findUnique({
            where: {id: session.user.id},
            select: {themeId: true},
        })

        const themeId = user?.themeId ?? 'default'
        return isValidThemeId(themeId) ? themeId : 'default'
    } catch {
        return 'default'
    }
}

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode
}>) {
    const themeId = await getUserThemeId()
    // Theme script is generated from trusted preset data, not user input
    const themeScript = getThemeScript(themeId)

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {/* Inline script to apply theme before hydration (prevents FOUC) */}
            <script dangerouslySetInnerHTML={{__html: themeScript}}/>
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        >
        <Providers initialThemeId={themeId}>{children}</Providers>
        </body>
        </html>
    )
}
