import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const base = process.env.VITE_BASE ?? "/";
const siteUrl = (process.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

function socialImage(): Plugin {
  return {
    name: "social-image",
    transformIndexHtml: (html) => html.replaceAll("%SOCIAL_IMAGE%", `${siteUrl}${base}og.png`),
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), socialImage()],
});
