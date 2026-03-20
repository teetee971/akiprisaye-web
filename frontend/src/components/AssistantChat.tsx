import React, { useState, useRef, useEffect } from 'react';
import {
  generateAssistantResponse,
  createUserMessage,
  createAssistantMessage,
  isProhibitedQuery,
  type AssistantMessage
} from '../services/assistantService';

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    const query = inputValue.trim();
    
    if (!query) return;
    
    // Check for prohibited content
    if (isProhibitedQuery(query)) {
      alert('⚠️ Cette question contient un contenu interdit.');
      return;
    }
    
    // Add user message
    const userMsg = createUserMessage(query);
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    
    // Simulate typing delay for more natural feel
    setTimeout(() => {
      const response = generateAssistantResponse(query);
      const assistantMsg = createAssistantMessage(query, response);
      
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
          isOpen
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-blue-600 hover:bg-blue-500 animate-pulse'
        }`}
        aria-label={isOpen ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant'}
      >
        {isOpen ? (
          <span className="text-2xl">✕</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-2xl flex flex-col z-modal">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Assistant A KI PRI SA YÉ
              </h3>
              <p className="text-xs text-gray-400">Lecture seule • Sources vérifiables</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-sm text-gray-400 hover:text-white transition-colors"
                title="Effacer la conversation"
              >
                🗑️
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-4">
                <div>
                  <div className="text-4xl mb-4">👋</div>
                  <p className="text-gray-300 mb-2">Bonjour ! Je suis l'assistant A KI PRI SA YÉ.</p>
                  <p className="text-sm text-gray-400">
                    Posez-moi vos questions sur le service, les tarifs, les données ou les fonctionnalités.
                  </p>
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setInputValue('Quels sont les tarifs ?')}
                      className="block w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded text-sm text-gray-300 transition-colors"
                    >
                      💳 Quels sont les tarifs ?
                    </button>
                    <button
                      onClick={() => setInputValue('D\'où viennent les données ?')}
                      className="block w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded text-sm text-gray-300 transition-colors"
                    >
                      📊 D'où viennent les données ?
                    </button>
                    <button
                      onClick={() => setInputValue('Comment fonctionne le service ?')}
                      className="block w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded text-sm text-gray-300 transition-colors"
                    >
                      ❓ Comment fonctionne le service ?
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800/50 text-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </p>
                      
                      {/* Sources */}
                      {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <p className="text-xs text-gray-400 mb-1">Sources :</p>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.map((source, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-700/50 text-gray-400 text-xs rounded"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Related FAQ */}
                      {msg.role === 'assistant' && msg.relatedFAQ && msg.relatedFAQ.length > 1 && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <p className="text-xs text-gray-400">
                            📋 {msg.relatedFAQ.length - 1} question{msg.relatedFAQ.length > 2 ? 's' : ''} liée{msg.relatedFAQ.length > 2 ? 's' : ''}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {msg.timestamp.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="assistant-chat-input"
                name="message"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                ↑
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ Aucun conseil (achat, médical, financier, juridique)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
