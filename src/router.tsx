/**
 * Router configuration for simplified automatic pages
 * 
 * This router demonstrates the intended routing structure for the simplified pages.
 * Currently, the app uses the routing defined in main.jsx for compatibility with
 * the existing layout and navigation structure.
 * 
 * To use this router, replace the routing in main.jsx with:
 * import { RouterProvider } from "react-router-dom";
 * import { router } from "./router";
 * 
 * Then render: <RouterProvider router={router} />
 */
import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import News from "./pages/News";
import Pricing from "./pages/Pricing";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/comparer", element: <Compare /> },
  { path: "/actualites", element: <News /> },
  { path: "/tarifs", element: <Pricing /> }
]);
