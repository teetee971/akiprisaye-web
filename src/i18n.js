import { reactive } from 'vue';
const messages = {
  fr: {
    title: 'Bienvenue sur A KI PRI SA YÉ',
    desc: 'Comparez les prix, dénoncez les abus et faites des économies.',
    start: 'Commencer',
    tagline: 'Transparence • Pouvoir d’achat • Guadeloupe',
  },
  creole: {
    title: 'Byenvini asi A KI PRI SA YÉ',
    desc: 'Konpwann pri, dénoncé abiz, fè ékonomi san kout têt.',
    start: 'Koumansé',
    tagline: 'Klareté • Pouvwa achté • Gwadloup',
  },
  es: {
    title: 'Bienvenido a A KI PRI SA YÉ',
    desc: 'Compara precios, denuncia abusos y ahorra con transparencia.',
    start: 'Empezar',
    tagline: 'Transparencia • Poder adquisitivo • Guadalupe',
  }
};
export const i18n = {
  state: reactive({ locale: 'fr', t: messages.fr }),
  setLocale(l) {
    if (messages[l]) {
      this.state.locale = l;
      this.state.t = messages[l];
    }
  },
};