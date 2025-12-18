import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import '../styles/layout.css';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* CONTENU */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
