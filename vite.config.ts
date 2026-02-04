import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      ignored: ["dev-dist/**"],
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "robots.txt",
        "log-pwa.ico"
      ],
      manifest: {
        name: "Insumos Barrera ERP",
        short_name: "InsumosBarrera",
        description: "Sistema de Gestión de Insumos Pasteleros",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        // Permitir rutas SPA para navegación offline
        navigateFallbackDenylist: [
          // Ejemplo: rutas de APIS o recursos que NO deben ser manejados por el SW
          /^\/api\//
        ],
        navigateFallbackAllowlist: [
          /^\/$/,
          /^\/ventas$/,
          /^\/dashboard$/,
          /^\/compras$/,
          /^\/inventario$/,
          /^\/clientes$/,
          /^\/proveedores$/,
          /^\/usuarios$/,
          /^\/transferencias$/,
          /^\/creditos$/,
          /^\/cuentasporpagar$/,
          /^\/reportes$/,
          /^\/categorias$/,
          /^\/todas\s*las\s*ventas$/i
        ]
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
