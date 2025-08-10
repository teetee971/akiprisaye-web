import React, { useState } from 'react';
import { logMessage } from '../firebase_log_service.js'; // Chemin corrigé

const ChatIALocal = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage = { from: 'user', text: input };
    setMessages([...messages, newUserMessage]);
    await logMessage('user', input, 'fr');

    // Simule une réponse IA
    const aiText = `Réponse IA à : "${input}"`;
    const newAiMessage = { from: 'ia', text: aiText };
    setMessages(prev => [...prev, newAiMessage]);
    await logMessage('ia', aiText, 'fr');

    setInput('');
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}><strong>{msg.from}:</strong> {msg.text}</div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleSend()}
        placeholder="Écris ton message ici..."
      />
      <button onClick={handleSend}>Envoyer</button>
    </div>
  );
};

export default ChatIALocal;
