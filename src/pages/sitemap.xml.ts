import type { APIRoute } from 'astro';
import { CALCULATORS, CATEGORY_LABEL } from '../lib/calculators';
import { CONTENT_UPDATED } from '../lib/calc-content';

export const GET: APIRoute = () => {
  const paths = [
    '/',
    '/about',
    '/methodology',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/contact',
    ...Object.keys(CATEGORY_LABEL).map((c) => `/categories/${c}`),
    ...CALCULATORS.map((c) => `/calc/${c.slug}`),
  ];
  const body = paths.map((p) => `  <url><loc>https://calczen.online${p}</loc><lastmod>${CONTENT_UPDATED}</lastmod></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
};
