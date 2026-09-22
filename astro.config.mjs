import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://calczen.online',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    ssr: { noExternal: ['lucide-react'] },
  },
});
