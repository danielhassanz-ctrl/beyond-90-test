import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();
  const portable = import.meta.env["VITE_PORTABLE_SINGLE_FILE"] === "1";
  const usePortableHashHistory = portable && !import.meta.env.SSR;
  const basepath = portable
    ? "/"
    : import.meta.env.BASE_URL === "/"
      ? "/"
      : import.meta.env.BASE_URL.replace(/\/$/, "");

  const router = createRouter({
    routeTree,
    basepath,
    // GitHub Pages serves route fallback directories as `/route/`. Normalize
    // those URLs back to the generated TanStack route IDs (`/route`) so a hard
    // refresh/bookmark hydrates the same screen as an in-app navigation.
    trailingSlash: "never",
    ...(usePortableHashHistory ? { history: createHashHistory() } : {}),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
