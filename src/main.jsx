import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Accueil from './pages/Accueil';
import Produits from './pages/Produits';
import Favoris from './pages/Favoris';
import VieChere from './pages/VieChere';
import Compte from './pages/Compte';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Accueil />,
      },
      {
        path: "produits",
        element: <Produits />,
      },
      {
        path: "favoris",
        element: <Favoris />,
      },
      {
        path: "vie-chere",
        element: <VieChere />,
      },
      {
        path: "compte",
        element: <Compte />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
