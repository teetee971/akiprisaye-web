import Navbar from "./Navbar";

export default function Layout({children}){
  return (
    <div className="min-h-dvh bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <Navbar />
      <main className="container py-6">{children}</main>
      <footer className="mt-12 border-t py-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} A KI PRI SA YÉ — Toutes les données affichées sont à titre indicatif.
      </footer>
    </div>
  );
}
