import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy JioSaavn API via Cloudflare Worker to avoid TLS drops
      '/saavn-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/saavn-api/, ''),
        secure: false,
      },
      // Proxy YouTube directly (since Piped instances are down globally)
      '/youtube-api': {
        target: 'https://www.youtube.com', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/youtube-api/, ''),
        secure: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      },
      // Proxy TMDB API
      '/tmdb-api': {
        target: 'https://api.themoviedb.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tmdb-api/, ''),
        secure: true,
      },
    },
  },
})
