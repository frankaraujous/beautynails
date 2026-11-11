// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: { host: true, port: 4324 },
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
        manifest: {
          name: "Araujo’s Landscaping",
          short_name: "Araujo",
          description: "Ruta, estimados e invoices.",
          lang: "es",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#f4f0e8",
          theme_color: "#173028",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          navigateFallback: null,
          globPatterns: ["**/*.{js,css,ico,png,svg,woff2,webmanifest}"],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8085",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  },
});
