
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { logMessage } from '../../firebase_log_service.js';

export default function ChatIALocal() {
  const [messages, setMessages] = useState([
    { from: 'ia', text: 'Bonjou, ès ou vlé konpare pri on pwodui lokal ?' }
  ]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('creole');

  const getResponse = (input) => {
    const msg = input.toLowerCase();
    if (msg.includes('savon')) {
      return 'Savon Dove ka koute 3,85€ a Jarry, men 2,10€ an Métropol. Ou vlé signalé sa ?';
    } else if (msg.includes('budget')) {
      return 'Di mwen konbyen ou pé dépensé, é mwen ké chaché on panier pli bon pri pou vou.';
    } else if (msg.includes('entraide') || msg.includes('voisin') || msg.includes('besoin')) {
      return 'Ou vlé afiché on ti mésaj an mode "Dépanne ton voisin" ? Moun pé wè i an anonim.';
    } else if (msg.includes('octroi') || msg.includes('taxe')) {
      return 'L’octroi de mer sé on taks lokal ki aplike sou pwodui ki sòti an déor. I ka édé pwodiksyon péyi.';
    } else if (msg.includes('prix abusif') || msg.includes('arnaque') || msg.includes('trop cher')) {
      return 'Ou pé fè on signalman an 1 klik. Sé pa jist si sa tro chè !';
    } else {
      return 'Mwen pa tro sèten, ou pé réformilé ou kestyon ?';
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages([...messages, userMsg]);
    await logMessage('user', input, lang);

    setTimeout(async () => {
      const response = getResponse(input);
      const iaMsg = { from: 'ia', text: response };
      setMessages(prev => [...prev, iaMsg]);
      await logMessage('ia', response, lang);
    }, 1000);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full z-50">
      <Card className="shadow-2xl rounded-2xl">
        <CardContent className="space-y-3 p-4">
          <div className="text-xl font-bold">🧠 Chat IA Lokal</div>
          <Select onValueChange={setLang} defaultValue="creole">
            <SelectTrigger><SelectValue placeholder="Langue" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="creole">🇬🇵 Créole</SelectItem>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-48 overflow-y-auto bg-gray-50 p-2 rounded-md border border-gray-200">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  "text-sm my-1 " +
                  (msg.from === 'user'
                    ? 'text-right text-blue-600'
                    : 'text-left text-green-800')
                }
              >
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ékri ou kestyon..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>Envoyé</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
