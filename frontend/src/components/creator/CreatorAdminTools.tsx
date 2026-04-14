import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Building2, Users, Wrench } from 'lucide-react';

interface CreatorAdminToolsProps {
  isAdmin: boolean;
}

const CreatorAdminTools: React.FC<CreatorAdminToolsProps> = ({ isAdmin }) => (
  <section className="order-1 md:order-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    <h2 className="sr-only">Outils d'administration</h2>
    {isAdmin ? (
      <>
        <Link
          to="/admin"
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm"
        >
          <BarChart3 className="text-blue-400" size={24} />
          <span className="font-bold">Admin Global</span>
        </Link>
        <Link
          to="/admin/stores"
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm"
        >
          <Building2 className="text-emerald-400" size={24} />
          <span className="font-bold">Enseignes</span>
        </Link>
        <Link
          to="/admin/calculs-batiment"
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm"
        >
          <Wrench className="text-amber-400" size={24} />
          <span className="font-bold">Calculs BTP</span>
        </Link>
        <Link
          to="/admin/users"
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm"
        >
          <Users className="text-purple-400" size={24} />
          <span className="font-bold">Utilisateurs</span>
        </Link>
      </>
    ) : (
      <>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-2 shadow-sm opacity-80">
          <div className="flex gap-4 items-center">
            <BarChart3 className="text-blue-400" size={24} />
            <span className="font-bold">Admin Global</span>
          </div>
          <p className="text-xs text-amber-300">Admin requis</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-2 shadow-sm opacity-80">
          <div className="flex gap-4 items-center">
            <Building2 className="text-emerald-400" size={24} />
            <span className="font-bold">Enseignes</span>
          </div>
          <p className="text-xs text-amber-300">Admin requis</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-2 shadow-sm opacity-80">
          <div className="flex gap-4 items-center">
            <Wrench className="text-amber-400" size={24} />
            <span className="font-bold">Calculs BTP</span>
          </div>
          <p className="text-xs text-amber-300">Admin requis</p>
        </div>
        <Link
          to="/mon-compte"
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm"
        >
          <Users className="text-purple-400" size={24} />
          <span className="font-bold">Mon compte créateur</span>
        </Link>
      </>
    )}
  </section>
);

export default CreatorAdminTools;
