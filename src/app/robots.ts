import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/settings/',
          '/dashboard/',
          '/transactions/',
          '/budgets/',
          '/goals/',
          '/categories/',
          '/wallets/',
          '/reports/',
          '/import/',
          '/billing/',
          '/*?*', // Evita indexação de URLs com parâmetros de query
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/login',
          '/signup',
          '/docs/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/settings/',
          '/dashboard/',
          '/transactions/',
          '/budgets/',
          '/goals/',
          '/categories/',
          '/wallets/',
          '/reports/',
          '/import/',
          '/billing/',
        ],
      },
    ],
    sitemap: 'https://gastometria.com.br/sitemap.xml',
  }
}
