import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' para funcionar em subpasta (ex.: GitHub Pages dentro dos Joguinhos)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
