import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            reportsDirectory: './coverage',
            exclude: [
                'src/**/__tests__/**',
                'src/**/*.test.{js,jsx}',
                'src/**/*.spec.{js,jsx}',
                'node_modules/**'
            ]
        }
    },
    server: {
        port: 3000,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
        },
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
