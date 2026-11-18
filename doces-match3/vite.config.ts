import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' para funcionar em subpasta. A versão final vai para ../doces/, que é a pasta
// publicada junto com os Joguinhos (o cartão "Doces" do menu abre doces/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../doces', emptyOutDir: true },
});
