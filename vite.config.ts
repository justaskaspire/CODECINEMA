import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isVercel = Boolean((globalThis as any).process?.env?.VERCEL);

export default defineConfig({
  base: isVercel ? "/" : "/CODECINEMA/",
  plugins: [react()],
});
