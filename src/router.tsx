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
    ...(usePortableHashHistory ? { history: createHashHistory() } : {}),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
