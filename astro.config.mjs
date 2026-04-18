// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    maxDuration: 10,
    webAnalytics: { enabled: false },
  }),
  integrations: [auth()],
});