import Google from '@auth/core/providers/google';
import { defineConfig } from 'auth-astro';

export default defineConfig({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
});