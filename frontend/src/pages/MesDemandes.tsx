import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { Ticket, TicketStatus } from '../types/ticket';
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from '../types/ticket';
import ticketService from '../services/ticketService';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/**
 * Page de suivi des demandes utilisateur
 *
 * Permet de:
 * - Rechercher un ticket par numéro
 * - Afficher l'historique des tickets (si email fourni)
 * - Voir le statut et l'avancement
 */
export default function MesDemandes() {
  const [searchTicketNumber, setSearchTicketNumber] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearchByNumber = async () => {
    if (!searchTicketNumber.trim()) {
      setError('Veuillez saisir un numéro de ticket');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const ticket = await ticketService.getTicket(searchTicketNumber.trim());
      if (ticket) {
        setSelectedTicket(ticket);
        setTickets([ticket]);
      } else {
        setError('Ticket introuvable');
        setTickets([]);
        setSelectedTicket(null);
      }
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchByEmail = async () => {
    if (!searchEmail.trim()) {
      setError('Veuillez saisir votre email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userTickets = await ticketService.getUserTickets(searchEmail.trim());
      setTickets(userTickets);
      setSelectedTicket(null);

      if (userTickets.length === 0) {
        setError('Aucun ticket trouvé pour cet email');
      }
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open':
      case 'in_progress':
      case 'under_review':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'duplicate':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'under_review':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'resolved':
      case 'closed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'duplicate':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <HeroImage
        src={PAGE_HERO_IMAGES.mesDemandes}
        alt="Mes demandes"
        gradient="from-slate-950 to-slate-800"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          📬 Mes demandes
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Vos demandes en cours et leur statut
        </p>
      </HeroImage>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Search Options */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search by ticket number */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                Rechercher par numéro
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchTicketNumber}
                  onChange={(e) => setSearchTicketNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchByNumber()}
                  placeholder="Ex: TKT-20260114-001"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearchByNumber}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                >
                  {isLoading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
            </div>

            {/* Search by email */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-400" />
                Mes tickets par email
              </h2>
              <div className="space-y-3">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchByEmail()}
                  placeholder="votre@email.com"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSearchByEmail}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                >
                  {isLoading ? 'Recherche...' : 'Afficher mes tickets'}
                </button>
              </div>
            </div>
          </section>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Selected ticket detail */}
          {selectedTicket && (
            <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-2">
                    {selectedTicket.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-mono text-blue-400">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}
                    >
                      {TICKET_STATUS_LABELS[selectedTicket.status]}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-slate-700 text-gray-300">
                      {TICKET_TYPE_LABELS[selectedTicket.type]}
                    </span>
                  </div>
                </div>
                {getStatusIcon(selectedTicket.status)}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {selectedTicket.category && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Catégorie</h3>
                    <p className="text-gray-300">{selectedTicket.category}</p>
                  </div>
                )}

                {selectedTicket.responseMessage && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-400 mb-2">Réponse</h3>
                    <p className="text-gray-300">{selectedTicket.responseMessage}</p>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Historique</h3>
                  <div className="space-y-2">
                    {selectedTicket.statusHistory.map((change, index) => (
                      <div
                        key={`${String(change.changedAt)}-${change.to}-${index}`}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                        <div>
                          <p className="text-gray-300">
                            <span className="font-medium">{TICKET_STATUS_LABELS[change.to]}</span>
                            {change.note && <span className="text-gray-400"> - {change.note}</span>}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(change.changedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Tickets list */}
          {tickets.length > 0 && !selectedTicket && (
            <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-5 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-gray-100">
                  Résultats ({tickets.length} ticket{tickets.length > 1 ? 's' : ''})
                </h2>
              </div>
              <div className="divide-y divide-slate-700">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full p-5 hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-100">{ticket.title}</h3>
                      {getStatusIcon(ticket.status)}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs font-mono text-blue-400">{ticket.ticketNumber}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(ticket.status)}`}
                      >
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-700 text-gray-300">
                        {TICKET_TYPE_LABELS[ticket.type]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">Créé le {formatDate(ticket.createdAt)}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Info section */}
          <section className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
            <h3 className="text-base font-semibold text-blue-300 mb-3">💡 Comment ça marche ?</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">1.</span>
                <span>
                  Recherchez votre ticket par numéro ou affichez tous vos tickets via email
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">2.</span>
                <span>Consultez le statut et l'historique de votre demande</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">3.</span>
                <span>
                  Recevez une notification par email en cas de mise à jour (si email fourni)
                </span>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
