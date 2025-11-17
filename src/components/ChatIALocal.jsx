import { useEffect, useMemo, useState } from 'react';
import { logMessage } from '@/firebase_log_service.js';

const translations = {
  creole: {
    welcome: 'Bonjou, ès ou vlé konpare pri on pwodui lokal ? ',
    placeholder: 'Ékri ou kestyon...',
    send: 'Envoyé',
    replies: {
      savon: 'Savon Dove ka koute 3,85€ a Jarry, men 2,10€ an Métropol. Ou vlé signalé sa ?',
      budget: 'Di mwen konbyen ou pé dépensé, é mwen ké chaché on panier pli bon pri pou vou.',
      entraide: 'Ou vlé afiché on ti mésaj an mode "Dépanne ton voisin" ? Moun pé wè i an anonim.',
      octroi: 'L’octroi de mer sé on taks lokal ki aplike sou pwodui ki sòti an déor. I ka édé pwodiksyon péyi.',
      abus: 'Ou pé fè on signalman an 1 klik. Sé pa jist si sa tro chè !',
      default: 'Mwen pa tro sèten, ou pé réformilé ou kestyon ?'
    },
    langChanged: 'Lang ajustée. Ou pé kontinyé an lang ou chwazi.'
  },
  fr: {
    welcome: 'Bonjour, envie de comparer les prix d’un produit local ?',
    placeholder: 'Écrivez votre question...',
    send: 'Envoyer',
    replies: {
      savon: 'Le savon Dove est à 3,85€ à Jarry, mais 2,10€ en métropole. Voulez-vous le signaler ?',
      budget: 'Indiquez-moi votre budget et je vous compose un panier au meilleur prix.',
      entraide: 'Souhaitez-vous publier un message "Dépanne ton voisin" ? Il restera anonyme.',
      octroi: 'L’octroi de mer est une taxe locale sur les produits importés pour soutenir la production locale.',
      abus: 'Vous pouvez signaler un prix abusif en un clic. Ce n’est pas juste si c’est trop cher !',
      default: 'Je ne suis pas certain, pouvez-vous reformuler votre question ?'
    },
    langChanged: 'Langue mise à jour. Vous pouvez continuer dans cette langue.'
  },
  es: {
    welcome: 'Hola, ¿quieres comparar el precio de un producto local?',
    placeholder: 'Escribe tu pregunta...',
    send: 'Enviar',
    replies: {
      savon: 'El jabón Dove cuesta 3,85€ en Jarry pero 2,10€ en la metrópoli. ¿Quieres reportarlo?',
      budget: 'Dime tu presupuesto y busco una cesta al mejor precio para ti.',
      entraide: '¿Quieres publicar un mensaje tipo "Ayuda a tu vecino"? Se mostrará de forma anónima.',
      octroi: 'El “octroi de mer” es un impuesto local a los productos importados para apoyar la producción local.',
      abus: 'Puedes reportar un precio abusivo en un clic. ¡No es justo si está demasiado caro!',
      default: 'No estoy seguro, ¿puedes reformular la pregunta?'
    },
    langChanged: 'Idioma actualizado. Puedes seguir en este idioma.'
  }
};

const getLocale = (lang) => translations[lang] ?? translations.fr;

export default function ChatIALocal() {
  const [lang, setLang] = useState('creole');
  const locale = useMemo(() => getLocale(lang), [lang]);
  const [messages, setMessages] = useState([
    { from: 'ia', text: getLocale('creole').welcome }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].from === 'ia') {
        return [{ ...prev[0], text: locale.welcome }];
      }
      return [...prev, { from: 'ia', text: locale.langChanged }];
    });
  }, [locale]);

  const getResponse = (value) => {
    const msg = value.toLowerCase();
    if (msg.includes('savon')) return locale.replies.savon;
    if (msg.includes('budget')) return locale.replies.budget;
    if (msg.includes('entraide') || msg.includes('voisin') || msg.includes('besoin')) {
      return locale.replies.entraide;
    }
    if (msg.includes('octroi') || msg.includes('taxe')) return locale.replies.octroi;
    if (msg.includes('prix abusif') || msg.includes('arnaque') || msg.includes('trop cher')) return locale.replies.abus;
    return locale.replies.default;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    await logMessage('user', input, lang);

    setTimeout(async () => {
      const response = getResponse(input);
      const iaMsg = { from: 'ia', text: response };
      setMessages((prev) => [...prev, iaMsg]);
      await logMessage('ia', response, lang);
    }, 500);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full z-50">
      <div className="shadow-2xl rounded-2xl bg-white p-4 space-y-3 border border-gray-200">
        <div className="text-xl font-bold">🧠 Chat IA Lokal</div>

        <label className="block text-sm font-medium text-gray-700">
          Langue
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="creole">🇬🇵 Créole</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="es">🇪🇸 Español</option>
          </select>
        </label>

        <div className="h-48 overflow-y-auto bg-gray-50 p-2 rounded-md border border-gray-200">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                'text-sm my-1 ' +
                (msg.from === 'user' ? 'text-right text-blue-600' : 'text-left text-green-800')
              }
            >
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={locale.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={sendMessage}
            type="button"
          >
            {locale.send}
          </button>
        </div>
      </div>
    </div>
  );
}
