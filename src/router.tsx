import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { installCareerArcEvents } from "./game/events-career-arcs";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Register authored long-form career arcs in the same live event bank used by
  // the shipped UI. Registration is idempotent and happens after module init,
  // avoiding the circular-initialization trap that legacy event banks had.
  installCareerArcEvents();

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
    // GitHub Pages serves the generated SPA route fallbacks as directories and
    // canonicalizes them with a trailing slash. Match that public URL shape so
    // WebKit never has to arbitrate between Pages' canonical redirect and the
    // router trying to remove the slash during hydration.
    trailingSlash: portable ? "never" : "always",
    ...(usePortableHashHistory ? { history: createHashHistory() } : {}),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};