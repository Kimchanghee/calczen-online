import type { APIRoute } from 'astro';
import { CALCULATORS, CATEGORY_LABEL } from '../lib/calculators';
export const GET: APIRoute = () => {
  const paths = ['/', ...CALCULATORS.map(c => `/calc/${c.slug}`), ...Object.keys(CATEGORY_LABEL).map(c => `/categories/${c}`), '/about', '/methodology'];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>https://calczen.online${p}</loc></url>`).join('\n')}\n</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
};
