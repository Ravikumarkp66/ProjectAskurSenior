import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: process.env.API_PROXY_TARGET || 'http://localhost:5000',
                changeOrigin: true
            }
        }
    },
    build: {
        sourcemap: false, // Disable sourcemaps in production
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    animations: ['framer-motion'],
                    charts: ['recharts'],
                    utils: ['axios']
                }
            }
        }
    }
});
