import { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeLocalStorage } from '../utils/safeLocalStorage';

interface BandeauMessage {
  id: string;
  type: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  link?: string;
  expiresAt?: string;
}

export function BandeauVieChere() {
  const [messages, setMessages] = useState<BandeauMessage[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed messages from safeLocalStorage
    const stored = safeLocalStorage.getItem('dismissed_bandeaux');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissed(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse dismissed bandeaux:', e);
      }
    }

    // Fetch from Firestore collection 'bandeau_messages'
    const fetchMessages = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, 'bandeau_messages'), where('active', '==', true));
        const snapshot = await getDocs(q);
        const firestoreMessages: BandeauMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BandeauMessage, 'id'>),
        }));
        setMessages(firestoreMessages);
      } catch (error) {
        console.error('Failed to fetch bandeau messages:', error);
        setMessages([]);
      }
    };

    fetchMessages();
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = new Set([...dismissed, id]);
    setDismissed(newDismissed);
    safeLocalStorage.setItem('dismissed_bandeaux', JSON.stringify([...newDismissed]));
  };

  const activMessages = messages.filter((m) => !dismissed.has(m.id));

  if (activMessages.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {activMessages.map((msg) => (
        <div
          key={msg.id}
          className={`
            px-4 py-3 flex items-center justify-between gap-3
            ${msg.type === 'urgent' ? 'bg-red-600 text-white' : ''}
            ${msg.type === 'warning' ? 'bg-yellow-500 text-slate-900' : ''}
            ${msg.type === 'info' ? 'bg-blue-600 text-white' : ''}
          `}
        >
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <strong className="font-bold">{msg.title}</strong>
              <span className="ml-2">{msg.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {msg.link && (
              <a
                href={msg.link}
                className="underline flex items-center gap-1 hover:opacity-80 transition-opacity"
                aria-label="En savoir plus sur cette alerte"
              >
                En savoir plus <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => handleDismiss(msg.id)}
              aria-label="Fermer cette alerte"
              className="hover:opacity-80 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
