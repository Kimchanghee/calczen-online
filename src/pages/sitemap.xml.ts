import type { APIRoute } from 'astro';
export const GET: APIRoute = () => {
  const paths = ['/', '/about', '/methodology'];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>https://calczen.online${p}</loc></url>`).join('\n')}\n</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
};
