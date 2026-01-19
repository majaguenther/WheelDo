import type {MetadataRoute} from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/dashboard',
        name: 'WheelDo - Focus on One Task at a Time',
        short_name: 'WheelDo',
        description:
            'A todo app that helps you focus by limiting you to one task at a time. Spin the wheel when indecisive!',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6366f1',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icons/icon-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        screenshots: [
            {
                src: '/screenshots/mobile-1.png',
                sizes: '540x720',
                type: 'image/png',
            },
            {
                src: '/screenshots/desktop-1.png',
                sizes: '1280x720',
                type: 'image/png',
                form_factor: 'wide',
            },
        ],
    }
}
