import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(() => {
  const portable = process.env["PORTABLE_SINGLE_FILE"] === "1";

  return {
    base: portable ? "./" : process.env["DEPLOY_BASE"] ?? "/",
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tanstackStart({
        spa: {
          enabled: true,
        },
        server: { entry: "server" },
      }),
      react(),
      ...(portable ? [viteSingleFile()] : []),
    ],
  };
});
