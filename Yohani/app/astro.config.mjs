// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: { host: true, port: 4323 },
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
        manifest: {
          name: "Yohani · uñas que hablan de ti",
          short_name: "Yohani",
          description: "Reserva una hora con Yohani.",
          lang: "es",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#e23d86",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          navigateFallback: null,
          globPatterns: ["**/*.{js,css,ico,png,jpg,svg,woff2,webmanifest}"],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8084",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  },
});
