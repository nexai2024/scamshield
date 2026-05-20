import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://scamshield.ai';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/marketing/screenshots', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
