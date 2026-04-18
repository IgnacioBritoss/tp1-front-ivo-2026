import Google from '@auth/core/providers/google';
import { defineConfig } from 'auth-astro';

export default defineConfig({
  providers: [
    Google({
      // @ts-ignore
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      // @ts-ignore
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
});