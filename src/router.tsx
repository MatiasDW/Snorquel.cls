import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { StorefrontPage } from "./routes/storefront";

const rootRoute = createRootRoute({
  component: () => (
    <div className="shell">
      <main>
        <Outlet />
      </main>
    </div>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: StorefrontPage,
});

const routeTree = rootRoute.addChildren([dashboardRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
