import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "manifest.json",
          dest: "",
        },
        {
          src: "components.json",
          dest: "",
        },
        {
          src: "contentScript.js",
          dest: "",
        },
        {
          src: "background.js",
          dest: "",
        },
        {
          src: "styles.css",
          dest: "",
        },
        {
          src: "icon16.png",
          dest: "",
        },
        {
          src: "icon48.png",
          dest: "",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
