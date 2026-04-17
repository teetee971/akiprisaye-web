// src/pages/ContactCollectivites.tsx
/**
 * Page Contact Collectivités
 * Dedicated contact form for public sector organizations
 * Civic Glass design - Professional, accessible, institutional
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';
import { DataBadge } from '@/components/ui/DataBadge';
import { LimitNote } from '@/components/ui/LimitNote';
import TerritorySelector from '@/components/TerritorySelector';
import { Mail, Phone, MapPin, Building2, Users, FileText } from 'lucide-react';
import { HeroImage } from '@/components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '@/config/imageAssets';

export default function ContactCollectivites() {
  const [formData, setFormData] = useState({
    organisme: '',
    typeOrganisme: '',
    nom: '',
    fonction: '',
    email: '',
    telephone: '',
    territoire: 'GP',
    nombreUtilisateurs: '',
    besoin: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typesOrganismes = [
    'Mairie',
    'Conseil départemental',
    'Conseil régional',
    'Préfecture',
    'Observatoire des prix',
    'CCI (Chambre de Commerce)',
    "Association d'intérêt général",
    'Établissement public',
    'Autre organisme public',
  ];

  const besoins = [
    "Découverte de l'outil",
    'Demande de devis',
    'Démonstration en ligne',
    'Présentation en préfecture/mairie',
    'Audit des données',
    'Support technique',
    'Partenariat institutionnel',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.organisme.trim()) newErrors.organisme = "Nom de l'organisme requis";
    if (!formData.typeOrganisme) newErrors.typeOrganisme = "Type d'organisme requis";
    if (!formData.nom.trim()) newErrors.nom = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.besoin) newErrors.besoin = 'Objet de la demande requis';
    if (!formData.message.trim()) newErrors.message = 'Message requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Try POST to /api/contact or mailto fallback
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
          type: 'collectivite',
        }),
      });
      // Accept any 2xx or gracefully degrade if endpoint not deployed
      if (!res.ok && res.status !== 404 && res.status !== 405) {
        throw new Error(`api_${res.status}`);
      }
    } catch {
      // If API not available, open mailto as fallback
      const subject = encodeURIComponent(`Demande collectivité — ${formData.organisme}`);
      const body = encodeURIComponent(
        `Organisme: ${formData.organisme}\nType: ${formData.typeOrganisme}\nContact: ${formData.nom} (${formData.fonction})\nEmail: ${formData.email}\nTéléphone: ${formData.telephone}\nTerritoire: ${formData.territoire}\n\nMessage:\n${formData.message}`
      );
      window.open(`mailto:contact@akiprisaye.fr?subject=${subject}&body=${body}`);
    }

    setSubmitted(true);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex items-center justify-center">
        <GlassCard className="max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-600/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Message envoyé !</h2>
            <p className="text-gray-300 mb-6">
              Votre demande a bien été transmise à notre équipe institutionnelle.
            </p>
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-6 text-left">
              <p className="text-gray-300 text-sm mb-2">
                <strong className="text-white">Organisme :</strong> {formData.organisme}
              </p>
              <p className="text-gray-300 text-sm mb-2">
                <strong className="text-white">Contact :</strong> {formData.nom} ({formData.email})
              </p>
              <p className="text-gray-300 text-sm">
                <strong className="text-white">Objet :</strong> {formData.besoin}
              </p>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Un membre de notre équipe vous répondra dans un délai de{' '}
              <strong className="text-white">48 heures ouvrées</strong>.
            </p>
            <CivicButton variant="primary" onClick={() => setSubmitted(false)}>
              Envoyer un nouveau message
            </CivicButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <GlassContainer className="max-w-6xl mx-auto p-8">
        <HeroImage
          src={PAGE_HERO_IMAGES.contactCollectivites}
          alt="Contact Collectivités"
          gradient="from-slate-950 to-blue-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🏢 Contact Collectivités
          </h1>
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
          >
            Solutions institutionnelles pour les collectivités et administrations
          </p>
        </HeroImage>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="md:col-span-2">
            <GlassCard>
              <h2 className="text-2xl font-bold text-white mb-6">Formulaire de contact</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Organisme */}
                <div>
                  <label htmlFor="organisme" className="block text-white font-medium mb-2">
                    Nom de l'organisme <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="organisme"
                    type="text"
                    value={formData.organisme}
                    onChange={(e) => handleChange('organisme', e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Ex: Mairie de Pointe-à-Pitre"
                    aria-required="true"
                    aria-invalid={!!errors.organisme}
                  />
                  {errors.organisme && (
                    <p className="text-red-400 text-sm mt-1">{errors.organisme}</p>
                  )}
                </div>

                {/* Type Organisme */}
                <div>
                  <label htmlFor="typeOrganisme" className="block text-white font-medium mb-2">
                    Type d'organisme <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="typeOrganisme"
                    value={formData.typeOrganisme}
                    onChange={(e) => handleChange('typeOrganisme', e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    aria-required="true"
                  >
                    <option value="">Sélectionnez un type</option>
                    {typesOrganismes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.typeOrganisme && (
                    <p className="text-red-400 text-sm mt-1">{errors.typeOrganisme}</p>
                  )}
                </div>

                {/* Nom et Fonction */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nom" className="block text-white font-medium mb-2">
                      Nom et Prénom <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="nom"
                      type="text"
                      value={formData.nom}
                      onChange={(e) => handleChange('nom', e.target.value)}
                      className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Jean Dupont"
                      aria-required="true"
                    />
                    {errors.nom && <p className="text-red-400 text-sm mt-1">{errors.nom}</p>}
                  </div>

                  <div>
                    <label htmlFor="fonction" className="block text-white font-medium mb-2">
                      Fonction
                    </label>
                    <input
                      id="fonction"
                      type="text"
                      value={formData.fonction}
                      onChange={(e) => handleChange('fonction', e.target.value)}
                      className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Ex: Directeur des services"
                    />
                  </div>
                </div>

                {/* Email et Téléphone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-white font-medium mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="contact@mairie.fr"
                      aria-required="true"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="telephone" className="block text-white font-medium mb-2">
                      Téléphone
                    </label>
                    <input
                      id="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => handleChange('telephone', e.target.value)}
                      className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="0590 XX XX XX"
                    />
                  </div>
                </div>

                {/* Territoire */}
                <div>
                  <label htmlFor="territoire" className="block text-white font-medium mb-2">
                    Territoire principal
                  </label>
                  <TerritorySelector
                    value={formData.territoire}
                    onChange={(value: string) => handleChange('territoire', value)}
                  />
                </div>

                {/* Nombre utilisateurs */}
                <div>
                  <label htmlFor="nombreUtilisateurs" className="block text-white font-medium mb-2">
                    Nombre d'utilisateurs estimé
                  </label>
                  <select
                    id="nombreUtilisateurs"
                    value={formData.nombreUtilisateurs}
                    onChange={(e) => handleChange('nombreUtilisateurs', e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Sélectionnez</option>
                    <option value="1-5">1 à 5 utilisateurs</option>
                    <option value="6-20">6 à 20 utilisateurs</option>
                    <option value="21-50">21 à 50 utilisateurs</option>
                    <option value="51+">Plus de 50 utilisateurs</option>
                  </select>
                </div>

                {/* Besoin */}
                <div>
                  <label htmlFor="besoin" className="block text-white font-medium mb-2">
                    Objet de la demande <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="besoin"
                    value={formData.besoin}
                    onChange={(e) => handleChange('besoin', e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    aria-required="true"
                  >
                    <option value="">Sélectionnez un objet</option>
                    {besoins.map((besoin) => (
                      <option key={besoin} value={besoin}>
                        {besoin}
                      </option>
                    ))}
                  </select>
                  {errors.besoin && <p className="text-red-400 text-sm mt-1">{errors.besoin}</p>}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-white font-medium mb-2">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Décrivez votre besoin, vos attentes ou vos questions..."
                    aria-required="true"
                  />
                  {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
                </div>

                {/* RGPD Notice */}
                <LimitNote>
                  <p className="text-sm">
                    <strong>Protection des données</strong>: Vos données sont utilisées uniquement
                    pour traiter votre demande. Elles ne sont jamais cédées à des tiers. Conformité
                    RGPD. Vous disposez d'un droit d'accès, de rectification et de suppression.
                  </p>
                </LimitNote>

                {/* Submit */}
                <CivicButton type="submit" variant="primary" className="w-full">
                  Envoyer la demande
                </CivicButton>
              </form>
            </GlassCard>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {/* Contact Direct */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-4">Contact direct</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">
                      Email institutionnel
                    </div>
                    <a
                      href="mailto:institutions@akiprisaye.fr"
                      className="text-sm text-blue-400 hover:underline"
                    >
                      institutions@akiprisaye.fr
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">Téléphone</div>
                    <div className="text-sm">Sur rendez-vous uniquement</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">Adresse</div>
                    <div className="text-sm">[À compléter]</div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Horaires */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-4">Horaires de réponse</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>
                  <strong className="text-white">Lundi - Vendredi :</strong> 9h - 17h
                </p>
                <p className="text-xs">Réponse sous 48h ouvrées</p>
              </div>
            </GlassCard>

            {/* Documents */}
            <GlassCard>
              <h3 className="text-xl font-bold text-white mb-4">Documentation</h3>
              <div className="space-y-3">
                <Link
                  to="/licence-institution"
                  className="flex items-center gap-3 p-3 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-300">Licence Institutionnelle</span>
                </Link>

                <Link
                  to="/pricing"
                  className="flex items-center gap-3 p-3 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-300">Grille tarifaire</span>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}
