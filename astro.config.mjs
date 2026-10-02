// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Astro genera las páginas. Vite empaqueta el proyecto.
// React entra solo como islas interactivas. Tailwind entra por el plugin de Vite.
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
