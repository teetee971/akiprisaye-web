/************************************************************
 * A KI PRI SA YÉ - Fil d'actualités automatique v2.9
 * Compatible mobile / PWA / offline / JSON local or Firestore
 ************************************************************/

console.log('✔ news-feed.js chargé.');

// Sélecteurs
const newsContainer = document.getElementById('news-container');
const loader = document.getElementById('news-loader');
const errorBox = document.getElementById('news-error');

// URL source (JSON interne)
const NEWS_URL = '/data/actualites.json';

// -----------------------------
// Fonction principale
// -----------------------------
async function loadNews() {
  try {
    showLoader(true);

    const response = await fetch(NEWS_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('Réponse réseau invalide');

    const data = await response.json();

    if (!data || !Array.isArray(data.articles)) {
      throw new Error('Format JSON inattendu.');
    }

    renderNews(data.articles);

  } catch (err) {
    console.error('⚠ Erreur chargement fil actu :', err);
    displayError('Impossible de charger les actualités pour le moment.');
  } finally {
    showLoader(false);
  }
}

// -----------------------------
// Afficher les actus
// -----------------------------
function renderNews(list) {
  newsContainer.innerHTML = '';

  list.forEach(article => {
    const card = document.createElement('div');
    card.className = 'news-card';

    card.innerHTML = `
      <h3>${article.icon || '📰'} ${article.title}</h3>
      <p class="news-date">📅 ${formatDate(article.date)}</p>
      <p>${article.content}</p>

      ${article.link ? `<a href="${article.link}" target="_blank" class="news-link">🔗 Voir la source</a>` : ''}
    `;

    newsContainer.appendChild(card);
  });
}

// -----------------------------
// Loader
// -----------------------------
function showLoader(state) {
  loader.style.display = state ? 'block' : 'none';
}

// -----------------------------
// Erreur
// -----------------------------
function displayError(msg) {
  errorBox.style.display = 'block';
  errorBox.innerText = '❌ ' + msg;
}

// -----------------------------
// Formatage date
// -----------------------------
function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// -----------------------------
// Lancement auto
// -----------------------------
document.addEventListener('DOMContentLoaded', loadNews);