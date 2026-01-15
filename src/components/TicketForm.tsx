import React, { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { TicketType, CreateTicketData } from '../types/ticket';
import {
  TICKET_TYPE_LABELS,
  TICKET_CATEGORY_OPTIONS,
} from '../types/ticket';
import ticketService from '../services/ticketService';

interface TicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
  onCancel?: () => void;
  defaultType?: TicketType;
}

export default function TicketForm({ onSuccess, onCancel, defaultType }: TicketFormProps) {
  const [formData, setFormData] = useState<CreateTicketData>({
    type: defaultType || 'suggestion',
    title: '',
    description: '',
    category: '',
    userEmail: '',
    userName: '',
    relatedUrl: typeof window !== 'undefined' ? window.location.href : '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setErrorMessage('Le titre est obligatoire');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('La description est obligatoire');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const ticket = await ticketService.createTicket(formData);
      setTicketNumber(ticket.ticketNumber);
      setSubmitStatus('success');
      
      // Réinitialiser le formulaire après 2 secondes
      setTimeout(() => {
        setFormData({
          type: defaultType || 'suggestion',
          title: '',
          description: '',
          category: '',
          userEmail: '',
          userName: '',
          relatedUrl: typeof window !== 'undefined' ? window.location.href : '',
        });
        setSubmitStatus('idle');
        if (onSuccess) {
          onSuccess(ticket.ticketNumber);
        }
      }, 2000);
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          Demande envoyée avec succès !
        </h3>
        <p className="text-gray-300 mb-4">
          Votre ticket a été enregistré avec le numéro :
        </p>
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <code className="text-xl font-mono text-blue-400">{ticketNumber}</code>
        </div>
        <p className="text-sm text-gray-400">
          Vous pouvez suivre l'avancement de votre demande dans la section "Mes demandes"
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type de ticket */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
          Type de demande *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Catégorie */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
          Catégorie (optionnel)
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionner une catégorie</option>
          {TICKET_CATEGORY_OPTIONS.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Titre */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
          Titre *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Résumé court de votre demande"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.title.length}/200 caractères
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Décrivez votre demande en détail..."
          rows={6}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.description.length}/2000 caractères
        </p>
      </div>

      {/* Nom (optionnel) */}
      <div>
        <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
          Votre nom (optionnel)
        </label>
        <input
          type="text"
          id="userName"
          name="userName"
          value={formData.userName}
          onChange={handleChange}
          placeholder="Ex: Jean Dupont"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email (optionnel) */}
      <div>
        <label htmlFor="userEmail" className="block text-sm font-medium text-gray-300 mb-2">
          Votre email (optionnel)
        </label>
        <input
          type="email"
          id="userEmail"
          name="userEmail"
          value={formData.userEmail}
          onChange={handleChange}
          placeholder="email@exemple.com"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Pour être notifié de l'avancement (conforme RGPD)
        </p>
      </div>

      {/* Error message */}
      {submitStatus === 'error' && errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Envoyer la demande
            </>
          )}
        </button>
      </div>

      {/* Privacy note */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-xs text-gray-400">
          <strong className="text-blue-400">Confidentialité :</strong> Vos informations sont
          utilisées uniquement pour le traitement de votre demande. L'email est optionnel et ne
          sera pas partagé. Conforme RGPD.
        </p>
      </div>
    </form>
  );
}
