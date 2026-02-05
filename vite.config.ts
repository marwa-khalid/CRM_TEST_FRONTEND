import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allows access from any IP address (external access)
    port: 5173,      
    open: true,      
    cors: true,      
    strictPort: true,
    allowedHosts: ['https://f437e4092f89.ngrok-free.app/'],
  },
});
