// src/pages/LicenceInstitution.tsx
/**
 * Page Licence Institutionnelle
 * Dedicated page for public sector organizations
 * Civic Glass design - Professional, transparent, institutional
 */
import React from 'react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';
import { DataBadge } from '@/components/ui/DataBadge';
import { LimitNote } from '@/components/ui/LimitNote';
import { Download, FileText, Shield, CheckCircle } from 'lucide-react';
import { HeroImage } from '@/components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '@/config/imageAssets';

export default function LicenceInstitution() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <GlassContainer className="max-w-6xl mx-auto p-8">
        <HeroImage
          src={PAGE_HERO_IMAGES.licenceInstitution}
          alt="Licence Institutionnelle"
          gradient="from-slate-950 to-slate-800"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🏛️ Licence Institutionnelle</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Licence d'accès pour institutions et collectivités territoriales</p>
        </HeroImage>

        {/* Main Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* Périmètre Fonctionnel */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Périmètre Fonctionnel</h2>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-2">Fonctionnalités incluses :</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Accès complet aux données publiques agrégées</li>
                  <li>Tableaux de bord territoriaux personnalisés</li>
                  <li>Rapports publics institutionnels</li>
                  <li>Exports CSV et PDF illimités</li>
                  <li>API lecture seule (données agrégées)</li>
                  <li>Historique complet des données</li>
                  <li>Multi-utilisateurs (gestion interne)</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-white/[0.22]">
                <h3 className="font-semibold text-white mb-2">Territoires couverts :</h3>
                <p className="text-sm">
                  France hexagonale + 12 territoires DOM-ROM-COM (Guadeloupe, Martinique, Guyane, 
                  La Réunion, Mayotte, Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin, 
                  Wallis-et-Futuna, Polynésie française, Nouvelle-Calédonie, Terres australes françaises)
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Sources de Données */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Sources de Données</h2>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <p className="font-semibold text-white">
                100% de données publiques officielles
              </p>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.05] rounded-lg">
                  <div className="font-semibold text-white mb-1">INSEE</div>
                  <div className="text-sm">Statistiques démographiques, économiques et territoriales</div>
                </div>
                
                <div className="p-3 bg-white/[0.05] rounded-lg">
                  <div className="font-semibold text-white mb-1">OPMR (Observatoires des Prix)</div>
                  <div className="text-sm">Relevés de prix Outre-mer</div>
                </div>
                
                <div className="p-3 bg-white/[0.05] rounded-lg">
                  <div className="font-semibold text-white mb-1">DGCCRF</div>
                  <div className="text-sm">Données de consommation et prix</div>
                </div>
                
                <div className="p-3 bg-white/[0.05] rounded-lg">
                  <div className="font-semibold text-white mb-1">data.gouv.fr</div>
                  <div className="text-sm">Données publiques ouvertes</div>
                </div>
                
                <div className="p-3 bg-white/[0.05] rounded-lg">
                  <div className="font-semibold text-white mb-1">SIRENE (INSEE)</div>
                  <div className="text-sm">Référentiel des établissements</div>
                </div>
                
                <div className="p-3 bg-white/[0.05] rounded-lg">
                  <div className="font-semibold text-white mb-1">OpenStreetMap</div>
                  <div className="text-sm">Géolocalisation collaborative</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Méthodologie */}
        <GlassCard className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Méthodologie</h2>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-3">Collecte des données</h3>
              <p className="mb-3">
                Les données sont collectées exclusivement auprès des sources publiques officielles 
                listées ci-dessus. Aucune donnée propriétaire, aucun scraping sauvage.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li>Mise à jour mensuelle pour les données INSEE</li>
                <li>Mise à jour hebdomadaire pour les prix OPMR</li>
                <li>Actualisation quotidienne pour data.gouv.fr</li>
                <li>Synchronisation SIRENE trimestrielle</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-white/[0.22]">
              <h3 className="font-semibold text-white mb-3">Traitement et agrégation</h3>
              <p className="mb-3">
                Les données brutes sont agrégées et anonymisées pour produire des indicateurs 
                territoriaux. Aucune modification de fond, uniquement de la mise en forme.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li>Calculs statistiques standards (moyenne, médiane, écart-type)</li>
                <li>Agrégation territoriale par commune, département, région</li>
                <li>Comparaisons inter-territoires basées sur données publiques</li>
                <li>Aucune prédiction algorithmique ou IA non supervisée</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-white/[0.22]">
              <h3 className="font-semibold text-white mb-3">Limites et précautions</h3>
              <LimitNote>
                <ul className="space-y-2">
                  <li><strong>Exhaustivité</strong>: Les données dépendent de la complétude des sources publiques</li>
                  <li><strong>Actualité</strong>: Délai de publication variable selon les sources (voir badges de date)</li>
                  <li><strong>Précision</strong>: Les données sont des moyennes territoriales, pas des prix exacts</li>
                  <li><strong>Usage</strong>: Outil d'aide à la décision, ne constitue pas un conseil commercial</li>
                </ul>
              </LimitNote>
            </div>
          </div>
        </GlassCard>

        {/* Conformité RGPD */}
        <GlassCard className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Conformité RGPD</h2>
          </div>
          
          <div className="space-y-4 text-gray-300">
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h3 className="font-semibold text-blue-200 mb-3">Collecte minimale de données</h3>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li><strong>Utilisateurs institutionnels</strong>: Email, nom de l'organisme, territoire principal</li>
                <li><strong>Pas de géolocalisation stockée</strong>: Utilisation locale uniquement (navigateur)</li>
                <li><strong>Pas de tracking comportemental</strong>: Aucun cookie publicitaire ou analytics tiers</li>
                <li><strong>Stockage local prioritaire</strong>: Les listes et préférences restent sur l'appareil</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h3 className="font-semibold text-green-200 mb-3">Droits des utilisateurs</h3>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li>Droit d'accès aux données personnelles collectées</li>
                <li>Droit de rectification et de suppression</li>
                <li>Droit à la portabilité des données</li>
                <li>Droit d'opposition au traitement</li>
                <li>Contact DPO: contact@akiprisaye.fr</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <h3 className="font-semibold text-yellow-200 mb-3">Sécurité et traçabilité</h3>
              <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
                <li>Chiffrement TLS/SSL pour toutes les communications</li>
                <li>Hébergement sécurisé (Cloudflare Pages)</li>
                <li>Logs d'accès conservés 12 mois (obligation légale)</li>
                <li>Aucune cession de données à des tiers</li>
                <li>Audit de sécurité annuel disponible sur demande</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Conditions d'audit public */}
        <GlassCard className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Conditions d'Audit Public</h2>
          
          <div className="space-y-4 text-gray-300">
            <p className="text-white font-semibold">
              Transparence totale pour les organismes publics
            </p>
            
            <div className="space-y-3">
              <div className="p-4 bg-white/[0.05] rounded-lg">
                <h3 className="font-semibold text-white mb-2">Audit des données</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Accès complet à la documentation des sources</li>
                  <li>Traçabilité complète de la chaîne de traitement</li>
                  <li>Scripts d'agrégation disponibles sur demande</li>
                  <li>Historique des mises à jour accessible</li>
                </ul>
              </div>
              
              <div className="p-4 bg-white/[0.05] rounded-lg">
                <h3 className="font-semibold text-white mb-2">Audit technique</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Code source des composants publics open source</li>
                  <li>Architecture système documentée</li>
                  <li>Tests de charge et performance disponibles</li>
                  <li>Rapports de sécurité annuels</li>
                </ul>
              </div>
              
              <div className="p-4 bg-white/[0.05] rounded-lg">
                <h3 className="font-semibold text-white mb-2">Audit juridique</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>CGU/CGV consultables à tout moment</li>
                  <li>Conformité RGPD certifiée</li>
                  <li>Contrats institutionnels standards disponibles</li>
                  <li>Absence de clauses abusives</li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Tarification */}
        <GlassCard className="mb-12 bg-blue-900/10 border-blue-500/30">
          <h2 className="text-2xl font-bold text-white mb-6">Tarification Institutionnelle</h2>
          
          <div className="space-y-4 text-gray-300">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-3">Fourchette tarifaire</h3>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  500 € - 50 000 € / an
                </div>
                <p className="text-sm">
                  Tarification adaptée au périmètre, à la taille de l'organisme et au volume d'utilisation.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-3">Critères de tarification</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Nombre de territoires suivis</li>
                  <li>Nombre d'utilisateurs simultanés</li>
                  <li>Volume d'exports mensuels</li>
                  <li>Utilisation de l'API</li>
                  <li>Niveau d'accompagnement souhaité</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t border-blue-500/30">
              <p className="text-sm">
                <strong className="text-white">Transparence tarifaire</strong>: Devis détaillé fourni après analyse du besoin. 
                Aucun frais caché. Facturation annuelle. Résiliation possible avec préavis de 3 mois.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Data Sources Badge */}
        <div className="mb-8">
          <DataBadge source="INSEE · OPMR · DGCCRF · data.gouv.fr · SIRENE · OpenStreetMap" date="Mise à jour permanente" />
        </div>

        {/* CTA Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="border-blue-500/50">
            <div className="text-center">
              <Download className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Télécharger le dossier complet</h3>
              <p className="text-gray-300 text-sm mb-6">
                PDF avec périmètre, méthodologie, sources, conformité RGPD et grille tarifaire
              </p>
              <CivicButton
                variant="primary"
                className="w-full"
                onClick={() => alert('Dossier institutionnel en cours de génération. Contact: institutions@akiprisaye.fr')}
              >
                Télécharger le PDF
              </CivicButton>
            </div>
          </GlassCard>
          
          <GlassCard className="border-green-500/50">
            <div className="text-center">
              <FileText className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Demander un devis personnalisé</h3>
              <p className="text-gray-300 text-sm mb-6">
                Notre équipe vous accompagne dans l'analyse de vos besoins et l'établissement d'un devis sur mesure
              </p>
              <CivicButton
                variant="primary"
                className="w-full"
                onClick={() => window.location.href = '/contact-collectivites'}
              >
                Contacter notre équipe
              </CivicButton>
            </div>
          </GlassCard>
        </div>
      </GlassContainer>
    </div>
  );
}
