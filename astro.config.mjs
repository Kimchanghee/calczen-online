import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://calczen.online',
  output: 'static',
  // Preserve both legacy /blog/.../ URLs and current slashless calculator URLs.
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    ssr: { noExternal: ['lucide-react'] },
  },
});
