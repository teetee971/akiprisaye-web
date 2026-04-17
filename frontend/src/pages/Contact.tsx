import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const CONTACT_EMAIL = 'contact@akiprisaye.fr';

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide.');
      return;
    }

    const subject = formData.subject.trim() || 'Demande via le site A KI PRI SA YÉ';
    const body = [`Nom : ${trimmedName}`, `Email : ${trimmedEmail}`, '', trimmedMessage].join('\n');

    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    toast.success('Votre messagerie va s’ouvrir pour envoyer le message.');
    window.open(mailtoUrl);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Contact – A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Contactez l'équipe A KI PRI SA YÉ pour une question, un partenariat ou une demande institutionnelle."
        />
        <meta property="og:title" content="Contact – A KI PRI SA YÉ" />
        <meta
          property="og:description"
          content="Un contact clair et honnête : formulaire qui ouvre votre messagerie, email direct et demandes pro."
        />
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <HeroImage
            src={PAGE_HERO_IMAGES.contact}
            alt="Contact — nous contacter"
            gradient="from-slate-900 to-blue-950"
            height="h-40 sm:h-52"
          >
            <h1 className="text-3xl font-bold text-white drop-shadow sm:text-4xl">✉️ Contact</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 drop-shadow sm:text-base">
              Une question, une demande partenaire ou un besoin institutionnel ? Nous privilégions
              un contact simple, clair et traçable.
            </p>
          </HeroImage>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Envoyer un message</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Ce formulaire ouvre votre messagerie avec un email prérempli. Pas de faux envoi
                silencieux : vous voyez exactement ce qui part.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Nom *</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Email *</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Sujet</span>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Ex. partenariat, question produit, licence institutionnelle"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Message *</span>
                <textarea
                  name="message"
                  rows={7}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Décrivez votre besoin, le territoire concerné et votre objectif."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Ouvrir mon email
              </button>
            </form>
          </section>

          <aside id="pro" className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-950/70 p-2 text-blue-300">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Email direct</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-sm text-blue-300 transition hover:text-blue-200"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-950/70 p-2 text-emerald-300">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Délais indicatifs</p>
                  <p className="text-sm text-slate-400">Retour habituel sous 2 jours ouvrés.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-950/70 p-2 text-violet-300">
                  <MessageSquare className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Demandes recommandées</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-400">
                    <li>• partenariat local ou enseigne</li>
                    <li>• licence institutionnelle</li>
                    <li>• question sur les données ou la méthodologie</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm font-semibold text-white">
                Vous préférez explorer avant d’écrire ?
              </p>
              <div className="mt-4 grid gap-3">
                <Link
                  to="/transparence"
                  className="inline-flex items-center justify-between rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Voir la page Transparence
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-between rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Consulter les offres
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
