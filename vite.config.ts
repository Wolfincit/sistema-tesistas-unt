import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleApiRequest } from './server/index.mjs'

function untRepositorioApiPlugin(): Plugin {
  const attachMiddleware = (middlewares: any) => {
    middlewares.use(async (req: any, res: any, next: any) => {
      if (
        req.url &&
        (req.url.startsWith('/api/repositorio/') ||
          req.url.startsWith('/api/drive/') ||
          req.url.startsWith('/api/db/') ||
          req.url.startsWith('/api/files/'))
      ) {
        try {
          const handled = await handleApiRequest(req, res);
          if (handled) return;
        } catch (err) {
          console.error('[UNT Repositorio API Error]', err);
        }
      }
      next();
    });
  };

  return {
    name: 'unt-repositorio-api',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    untRepositorioApiPlugin(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true, // Permite acceso bajo cualquier dominio o túnel institucional
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  }
})
