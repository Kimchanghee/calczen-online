import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://calczen.online',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [tailwind({ applyBaseStyles: true }), sitemap()],
  vite: {
    ssr: { noExternal: ['lucide-react'] },
  },
});
