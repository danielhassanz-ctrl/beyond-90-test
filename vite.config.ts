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
      ...(portable
        ? [
            viteSingleFile({
              overrideConfig: {
                build: {
                  // TanStack Start's SSR manifest expects a CSS manifest entry.
                  // Keep CSS splitting enabled; the single-file plugin still
                  // inlines the emitted stylesheet into the final HTML.
                  cssCodeSplit: true,
                },
              },
            }),
          ]
        : []),
    ],
  };
});
