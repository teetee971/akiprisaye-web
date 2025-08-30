import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Nav() {
  const Item = (to, txt) => (
    <li style={{display:"inline-block", marginRight:16}}><Link to={to}>{txt}</Link></li>
  );
  return (
    <nav style={{padding:12, borderBottom:"1px solid #eee"}}>
      <ul style={{listStyle:"none", margin:0, padding:0}}>
        {Item("/", "Accueil")}
        {Item("/produits", "Produits")}
        {Item("/favoris", "Favoris")}
        {Item("/vie-chere", "Vie chère")}
        {Item("/compte", "Compte")}
      </ul>
    </nav>
  );
}

const Page = ({title, children}) => (
  <div style={{padding:16}}>
    <h1 style={{marginTop:8}}>{title}</h1>
    {children}
  </div>
);

const Accueil   = () => <Page title="A KI PRI SA YÉ">Bienvenue 👋</Page>;
const Produits  = () => <Page title="Produits">Liste / recherche…</Page>;
const Favoris   = () => <Page title="Favoris">Vos produits suivis…</Page>;
const VieChere  = () => <Page title="Vie chère">Cartes, indices, podium…</Page>;
const Compte    = () => <Page title="Compte">Profil & réglages…</Page>;
const Produit   = () => <Page title="Fiche produit">Détails produit…</Page>;

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/produits" element={<Produits />} />
        <Route path="/produit/:id" element={<Produit />} />
        <Route path="/favoris" element={<Favoris />} />
        <Route path="/vie-chere" element={<VieChere />} />
        <Route path="/compte" element={<Compte />} />
      </Routes>
    </BrowserRouter>
  );
}
