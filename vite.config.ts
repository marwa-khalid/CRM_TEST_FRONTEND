import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Dev-only: which backend the /api proxy forwards to. Defaults to the deployed
  // Railway backend so `npm run dev` works out of the box; set VITE_DEV_API_TARGET
  // to http://localhost:8080 in .env.development if you run the backend locally.
  const devApiTarget =
    env.VITE_DEV_API_TARGET || 'https://crm-test-backend-production.up.railway.app';

  return {
    plugins: [react()],
    resolve: {
      // react-pdf pins pdfjs-dist 5.4.296, but the app also has 5.7.284 at the top
      // level (used by splitLicencePdf). pdf.js refuses to render when the worker
      // version != the API version, so force a SINGLE pdfjs-dist (react-pdf's copy)
      // everywhere — API, worker, and splitLicencePdf all resolve to 5.4.296.
      alias: {
        'pdfjs-dist': path.resolve('node_modules/react-pdf/node_modules/pdfjs-dist'),
      },
      dedupe: ['pdfjs-dist'],
    },
    server: {
      host: '0.0.0.0', // Allows access from any IP address (external access)
      port: 5174,
      open: true,
      cors: true,
      strictPort: true,
      allowedHosts: ['moody-streets-build.loca.lt'],
      // Proxy /api/* to the backend so the browser only ever talks to
      // localhost:5174 (same-origin). That makes the httpOnly auth cookie
      // first-party, so it's actually sent on subsequent requests. We also strip
      // the cookie's `Secure` flag and downgrade `SameSite=None` -> `Lax`, because
      // those are rejected over plain http://localhost by some browsers (Safari).
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              const cookies = proxyRes.headers['set-cookie'];
              if (Array.isArray(cookies)) {
                proxyRes.headers['set-cookie'] = cookies.map((c) =>
                  c
                    .replace(/;\s*Secure/gi, '')
                    .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
                );
              }
            });
          },
        },
      },
    },
    assetsInclude: ['**/*.docx'], // <--- Add this line
  };
});
