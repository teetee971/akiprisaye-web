import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './layout/Footer';
import FabActions from './ui/FabActions';

export default function Layout() {
  const navigate = useNavigate();
  const [showCartToast, setShowCartToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const handleItemAdded = () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }

      setShowCartToast(true);
      toastTimeoutRef.current = window.setTimeout(() => {
        setShowCartToast(false);
      }, 3000);
    };

    window.addEventListener('ti-panier:item-added', handleItemAdded);
    return () => {
      window.removeEventListener('ti-panier:item-added', handleItemAdded);
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:pb-10" role="main">
        <Outlet />
      </main>

      {showCartToast && (
        <div className="fixed bottom-24 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-emerald-500/40 bg-slate-900/95 p-3 text-sm shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <span>Ajouté au panier</span>
            <button
              type="button"
              onClick={() => {
                setShowCartToast(false);
                navigate('/comparaison-panier');
              }}
              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Voir panier
            </button>
          </div>
        </div>
      )}

      <FabActions />
      <Footer />
    </div>
  );
}
