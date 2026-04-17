/**
 * Admin Layout
 * Layout with sidebar navigation for admin pages
 */

import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  Upload,
  Menu,
  X,
  BarChart3,
  Flag,
  Users,
  Globe,
  ReceiptText,
  BookOpen,
  Bot,
  RefreshCw,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Automatisation', href: '/admin/automation', icon: Bot },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Audience', href: '/admin/audience', icon: Globe },
  { name: 'Enseignes', href: '/admin/stores', icon: Store },
  { name: 'Articles', href: '/admin/products', icon: Package },
  { name: 'Import', href: '/admin/import', icon: Upload },
  { name: 'Tickets', href: '/admin/ticket-import', icon: ReceiptText },
  { name: 'Catalogues', href: '/admin/catalogs', icon: BookOpen },
  { name: 'Synchronisation', href: '/admin/sync', icon: RefreshCw },
  { name: 'Modération', href: '/admin/moderation', icon: Flag },
  { name: 'Statistiques', href: '/admin/stats', icon: BarChart3 },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden cursor-default"
          onClick={() => setSidebarOpen(false)}
          tabIndex={-1}
          aria-label="Fermer le menu"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900/80 backdrop-blur-[14px]
          border-r border-white/10 transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button (mobile only) */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h2 className="text-lg font-semibold text-white">Menu Admin</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-white/[0.22]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Administration</h1>
            <p className="text-xs text-white/70">A KI PRI SA YÉ</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${
                    active
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to site link */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.22]">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour au site
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Top bar */}
        <header className="bg-slate-900/60 backdrop-blur-[14px] border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>

            <div className="flex-1 lg:ml-0" />

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">Administrateur</p>
                <p className="text-xs text-white/70">admin@akiprisaye.fr</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
