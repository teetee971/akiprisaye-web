import React, { useState, useEffect, useRef } from 'react';

// Speech synthesis languages for DROM-COM
const LANGUAGES = {
  'fr-FR': 'Français',
  'en-US': 'English',
  'pt-BR': 'Português'
};

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: false,
    dyslexiaMode: false,
    fontSize: 'normal',
    voiceNavigation: false,
    reduceMotion: false,
    darkMode: false,
    voiceSpeed: 1,
    voiceLanguage: 'fr-FR'
  });
  
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('akp_accessibility');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    }

    // Check for speech recognition support
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';
      
      recognitionRef.current.onresult = handleVoiceCommand;
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => {
        if (settings.voiceNavigation) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const applySettings = (newSettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Dyslexia mode
    if (newSettings.dyslexiaMode) {
      root.classList.add('dyslexia-mode');
    } else {
      root.classList.remove('dyslexia-mode');
    }

    // Font size
    root.classList.remove('text-small', 'text-normal', 'text-large', 'text-extra-large');
    root.classList.add(`text-${newSettings.fontSize}`);

    // Dark mode
    if (newSettings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Reduce motion
    if (newSettings.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem('akp_accessibility', JSON.stringify(newSettings));
    
    // Announce changes via speech synthesis
    if ('speechSynthesis' in window) {
      const announcement = `Paramètre ${key} ${value ? 'activé' : 'désactivé'}`;
      speak(announcement);
    }
  };

  const speak = (text, options = {}) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel(); // Stop any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings.voiceLanguage;
      utterance.rate = settings.voiceSpeed;
      utterance.volume = 0.8;
      
      Object.assign(utterance, options);
      speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (event) => {
    const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
    setVoiceCommands(prev => [...prev.slice(-4), { command, timestamp: Date.now() }]);
    
    // Process voice commands
    if (command.includes('contraste élevé') || command.includes('high contrast')) {
      updateSetting('highContrast', !settings.highContrast);
    } else if (command.includes('mode dyslexie') || command.includes('dyslexia')) {
      updateSetting('dyslexiaMode', !settings.dyslexiaMode);
    } else if (command.includes('mode sombre') || command.includes('dark mode')) {
      updateSetting('darkMode', !settings.darkMode);
    } else if (command.includes('plus grand') || command.includes('larger text')) {
      const sizes = ['small', 'normal', 'large', 'extra-large'];
      const currentIndex = sizes.indexOf(settings.fontSize);
      if (currentIndex < sizes.length - 1) {
        updateSetting('fontSize', sizes[currentIndex + 1]);
      }
    } else if (command.includes('plus petit') || command.includes('smaller text')) {
      const sizes = ['small', 'normal', 'large', 'extra-large'];
      const currentIndex = sizes.indexOf(settings.fontSize);
      if (currentIndex > 0) {
        updateSetting('fontSize', sizes[currentIndex - 1]);
      }
    } else if (command.includes('rechercher') || command.includes('search')) {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="recherche"]');
      if (searchInput) {
        searchInput.focus();
        speak('Zone de recherche activée');
      }
    } else if (command.includes('aide') || command.includes('help')) {
      speak('Commandes vocales disponibles: contraste élevé, mode dyslexie, mode sombre, plus grand, plus petit, rechercher, aide, fermer panneau');
    } else if (command.includes('fermer panneau') || command.includes('close panel')) {
      setIsOpen(false);
      speak('Panneau d\'accessibilité fermé');
    }
  };

  const toggleVoiceNavigation = () => {
    if (!speechSupported) {
      alert('La reconnaissance vocale n\'est pas supportée sur ce navigateur');
      return;
    }

    if (settings.voiceNavigation) {
      recognitionRef.current.stop();
      setIsListening(false);
      updateSetting('voiceNavigation', false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      updateSetting('voiceNavigation', true);
      speak('Navigation vocale activée. Dites "aide" pour connaître les commandes disponibles.');
    }
  };

  const readPageContent = () => {
    const mainContent = document.querySelector('main, .main-content, #main-content');
    if (mainContent) {
      const text = mainContent.innerText.slice(0, 500); // Limit to avoid too long speech
      speak(text);
    } else {
      speak('Contenu de la page non trouvé');
    }
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200"
        aria-label="Ouvrir le panneau d'accessibilité"
        title="Accessibilité"
      >
        <span className="text-xl">♿</span>
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Accessibilité</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-700"
                aria-label="Fermer le panneau"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Visual Settings */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-gray-900">🎨 Paramètres visuels</h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Contraste élevé</span>
                  <input
                    type="checkbox"
                    checked={settings.highContrast}
                    onChange={(e) => updateSetting('highContrast', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm">Mode dyslexie</span>
                  <input
                    type="checkbox"
                    checked={settings.dyslexiaMode}
                    onChange={(e) => updateSetting('dyslexiaMode', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm">Mode sombre</span>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => updateSetting('darkMode', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm">Réduire les animations</span>
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>

                <div>
                  <label className="block text-sm mb-1">Taille du texte</label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="small">Petit</option>
                    <option value="normal">Normal</option>
                    <option value="large">Grand</option>
                    <option value="extra-large">Très grand</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Voice Settings */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-gray-900">🔊 Paramètres vocaux</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleVoiceNavigation}
                    disabled={!speechSupported}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                      settings.voiceNavigation
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {isListening ? '🎤 Écoute active' : '🎤 Navigation vocale'}
                  </button>
                  {speechSupported && isListening && (
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>

                <button
                  onClick={readPageContent}
                  className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  📖 Lire le contenu de la page
                </button>

                <div>
                  <label className="block text-sm mb-1">Vitesse de lecture</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.voiceSpeed}
                    onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Lent</span>
                    <span>{settings.voiceSpeed}x</span>
                    <span>Rapide</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Langue</label>
                  <select
                    value={settings.voiceLanguage}
                    onChange={(e) => updateSetting('voiceLanguage', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Voice Commands History */}
            {settings.voiceNavigation && voiceCommands.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-gray-900">Dernières commandes vocales</h4>
                <div className="space-y-1">
                  {voiceCommands.slice(-3).map((cmd, index) => (
                    <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                      "{cmd.command}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mb-4">
              <h3 className="font-semibold mb-3 text-gray-900">⚡ Actions rapides</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSetting('fontSize', 'extra-large')}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                >
                  🔍 Texte XXL
                </button>
                <button
                  onClick={() => updateSetting('highContrast', true)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                >
                  ⚫ Contraste++
                </button>
                <button
                  onClick={() => {
                    updateSetting('dyslexiaMode', true);
                    updateSetting('fontSize', 'large');
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                >
                  📚 Mode lecture
                </button>
                <button
                  onClick={() => {
                    setSettings({
                      highContrast: false,
                      dyslexiaMode: false,
                      fontSize: 'normal',
                      voiceNavigation: false,
                      reduceMotion: false,
                      darkMode: false,
                      voiceSpeed: 1,
                      voiceLanguage: 'fr-FR'
                    });
                    applySettings({
                      highContrast: false,
                      dyslexiaMode: false,
                      fontSize: 'normal',
                      voiceNavigation: false,
                      reduceMotion: false,
                      darkMode: false,
                      voiceSpeed: 1,
                      voiceLanguage: 'fr-FR'
                    });
                    localStorage.removeItem('akp_accessibility');
                  }}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <p className="mb-2"><strong>💡 Aide:</strong></p>
              <ul className="space-y-1">
                <li>• Utilisez Tab pour naviguer au clavier</li>
                <li>• Commandes vocales: "contraste élevé", "mode sombre", "aide"</li>
                <li>• Les paramètres sont sauvegardés automatiquement</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles for accessibility modes */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(150%) !important;
        }
        
        .high-contrast * {
          text-shadow: none !important;
          box-shadow: none !important;
        }
        
        .dyslexia-mode {
          font-family: 'OpenDyslexic', 'Comic Sans MS', cursive !important;
        }
        
        .dyslexia-mode * {
          font-family: inherit !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
          line-height: 1.5 !important;
        }
        
        .text-small {
          font-size: 0.875rem !important;
        }
        
        .text-normal {
          font-size: 1rem !important;
        }
        
        .text-large {
          font-size: 1.125rem !important;
        }
        
        .text-extra-large {
          font-size: 1.25rem !important;
        }
        
        .dark {
          background-color: #1a1a1a !important;
          color: #e5e5e5 !important;
        }
        
        .dark * {
          background-color: inherit !important;
          color: inherit !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .reduce-motion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}