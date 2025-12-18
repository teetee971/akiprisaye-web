import React from 'react'
import { GlassContainer } from '../components/ui/GlassContainer'
import { GlassCard } from '../components/ui/GlassCard'
import { PLANS } from '../lib/pricing'

export function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <GlassContainer>
        <h1 className="text-3xl font-bold text-white mb-8">Tarification</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-2">Gratuit</h3>
            <p className="text-3xl font-bold text-blue-400 mb-4">{PLANS.FREE.price}€</p>
            <p className="text-sm text-gray-300">Accès aux données publiques de base</p>
          </GlassCard>
          
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-2">Citoyen</h3>
            <p className="text-3xl font-bold text-blue-400 mb-4">{PLANS.CITIZEN.price}€/mois</p>
            <p className="text-sm text-gray-300">Alertes personnalisées et historiques</p>
          </GlassCard>
          
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-3xl font-bold text-blue-400 mb-4">{PLANS.PRO.price}€/mois</p>
            <p className="text-sm text-gray-300">API et données avancées</p>
          </GlassCard>
          
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-2">Entreprise</h3>
            <p className="text-2xl font-bold text-blue-400 mb-4">
              {PLANS.ENTERPRISE.min}€ - {PLANS.ENTERPRISE.max}€
            </p>
            <p className="text-sm text-gray-300">Solutions sur mesure</p>
          </GlassCard>
          
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-2">Institution</h3>
            <p className="text-2xl font-bold text-blue-400 mb-4">
              {PLANS.INSTITUTION.min}€ - {PLANS.INSTITUTION.max}€
            </p>
            <p className="text-sm text-gray-300">Licence collectivité</p>
          </GlassCard>
        </div>
      </GlassContainer>
    </div>
  )
}

export default Pricing
