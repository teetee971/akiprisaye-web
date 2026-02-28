import React from 'react'
import { Link } from 'react-router-dom'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Abonnements & Options
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-3xl">
            Commence en gratuit. Passe ensuite en Pro ou Business selon ton niveau
            d’exploitation (analyses avancées, alertes prix, API, exports, multi-territoires).
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-3">

          {/* GRATUIT */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Gratuit
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Découvrir et contribuer.
            </p>
            <div className="mt-6 text-4xl font-extrabold text-slate-900 dark:text-white">
              0 €
            </div>

            <ul className="mt-8 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>✓ 60 scans / mois</li>
              <li>✓ Accès prix & agrégats</li>
              <li>✓ Contribution citoyenne</li>
            </ul>

            <Link
              to="/signup"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              Commencer
            </Link>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border-2 border-black dark:border-white bg-white dark:bg-slate-900 shadow-md p-8 flex flex-col relative">
            <div className="absolute -top-3 right-6 bg-black text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-3 py-1 rounded-full">
              Recommandé
            </div>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Pro
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Pour pros, associations, médias, analystes.
            </p>

            <div className="mt-6 text-4xl font-extrabold text-slate-900 dark:text-white">
              49 € <span className="text-base font-medium">/mois</span>
            </div>

            <ul className="mt-8 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>✓ 1000 scans / mois</li>
              <li>✓ Historique avancé</li>
              <li>✓ Alertes prix</li>
              <li>✓ Accès API</li>
            </ul>

            <Link
              to="/checkout?plan=pro"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-slate-900 px-5 py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              Choisir Pro
            </Link>
          </div>

          {/* BUSINESS */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Business
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Pour équipes et exploitation intensive.
            </p>

            <div className="mt-6 text-4xl font-extrabold text-slate-900 dark:text-white">
              99 € <span className="text-base font-medium">/mois</span>
            </div>

            <ul className="mt-8 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>✓ Scans illimités</li>
              <li>✓ 9 territoires</li>
              <li>✓ 5 sièges équipe</li>
              <li>✓ Exports avancés</li>
            </ul>

            <Link
              to="/checkout?plan=business"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              Choisir Business
            </Link>
          </div>

        </section>

      </div>
    </div>
  )
}
