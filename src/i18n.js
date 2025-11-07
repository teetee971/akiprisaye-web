import { reactive } from 'vue';

// Simple reactive i18n store
export const i18n = reactive({
  currentLang: 'fr',
  
  messages: {
    fr: {
      title: 'A KI PRI SA YÉ',
      subtitle: 'Gérez votre budget facilement',
      tagline: 'Comparez les prix et luttez contre la vie chère',
      startButton: 'Commencer',
      language: 'Langue'
    },
    creole: {
      title: 'A KI PRI SA YÉ',
      subtitle: 'Gérez boudjet-ou fasilman',
      tagline: 'Konpwann pri-la é goumenn kont lavi chè',
      startButton: 'Koumansé',
      language: 'Lang'
    },
    es: {
      title: 'A KI PRI SA YÉ',
      subtitle: 'Gestiona tu presupuesto fácilmente',
      tagline: 'Compara precios y lucha contra el alto costo de vida',
      startButton: 'Empezar',
      language: 'Idioma'
    }
  },
  
  setLanguage(lang) {
    this.currentLang = lang;
  },
  
  t(key) {
    return this.messages[this.currentLang]?.[key] || key;
  }
});
