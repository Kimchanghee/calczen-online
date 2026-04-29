import type { APIRoute } from 'astro';
import { CALCULATORS } from '../lib/calculators';

const SITE = 'https://calczen.online';

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: SITE, priority: 1.0, changefreq: 'daily' },
    ...CALCULATORS.map((c) => ({
      loc: `${SITE}/calc/${c.slug}`,
      priority: 0.9,
      changefreq: 'weekly' as const,
    })),
    ...['loan', 'tax', 'labor', 'life'].map((cat) => ({
      loc: `${SITE}/categories/${cat}`,
      priority: 0.7,
      changefreq: 'weekly' as const,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
