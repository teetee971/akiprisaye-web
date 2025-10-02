import React from "react";
import Navbar from "./Navbar";
import Carousel from "./Carousel";
import Produits from "./Produits";
import Apropos from "./Apropos";

export default function App() {
  return (
    <div>
      <Navbar />
      <Carousel />
      <Produits />
      <Apropos />
    </div>
  );
}