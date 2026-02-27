import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://hagoproduce.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/portal/login'],
        disallow: ['/dashboard', '/admin', '/accounting', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
