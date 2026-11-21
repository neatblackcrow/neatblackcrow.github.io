import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://neatblackcrow.github.io',
  base: '/',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    solidJs(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          th: 'th-TH',
        },
      },
    }),
  ],
});
