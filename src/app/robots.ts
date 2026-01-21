import type {MetadataRoute} from 'next'
import {getBaseUrl} from '@/lib/url'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getBaseUrl()

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/dashboard',
                    '/dashboard/',
                    '/tasks/',
                    '/wheel',
                    '/wheel/',
                    '/history',
                    '/history/',
                    '/settings',
                    '/settings/',
                    '/invite/',
                    '/api/',
                    '/offline',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    }
}
