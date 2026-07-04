import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@components': fileURLToPath(new URL('./components', import.meta.url)),
            '@hooks': fileURLToPath(new URL('./hooks', import.meta.url)),
            '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        },
    },
});
