import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Produits from "./pages/Produits";
import About from "./pages/About";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produits" element={<Produits />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

export default App;