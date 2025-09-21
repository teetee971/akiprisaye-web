import React, { useState, useEffect } from 'react';

const FEEDBACK_TYPES = {
  bug: { icon: '🐛', label: 'Bug/Problème', color: 'bg-red-100 text-red-800' },
  feature: { icon: '💡', label: 'Suggestion de fonctionnalité', color: 'bg-blue-100 text-blue-800' },
  improvement: { icon: '⚡', label: 'Amélioration', color: 'bg-yellow-100 text-yellow-800' },
  compliment: { icon: '💝', label: 'Compliment', color: 'bg-green-100 text-green-800' }
};

const PRIORITY_LEVELS = {
  low: { label: 'Faible', color: 'text-gray-600' },
  medium: { label: 'Moyen', color: 'text-yellow-600' },
  high: { label: 'Élevé', color: 'text-orange-600' },
  critical: { label: 'Critique', color: 'text-red-600' }
};

// Mock roadmap items
const ROADMAP_ITEMS = [
  {
    id: 1,
    title: 'Notifications push avancées',
    description: 'Alertes personnalisées par produit et territoire',
    status: 'completed',
    votes: 145,
    category: 'notifications',
    estimatedDate: '2024-09-01'
  },
  {
    id: 2,
    title: 'Mode hors-ligne amélioré',
    description: 'Synchronisation automatique des données',
    status: 'in-progress',
    votes: 87,
    category: 'performance',
    estimatedDate: '2024-10-15'
  },
  {
    id: 3,
    title: 'Comparaison avec la Métropole en temps réel',
    description: 'API temps réel pour les prix métropolitains',
    status: 'planned',
    votes: 132,
    category: 'data',
    estimatedDate: '2024-11-30'
  },
  {
    id: 4,
    title: 'IA prédictive pour les tendances de prix',
    description: 'Prédictions basées sur l\'historique et les tendances',
    status: 'under-review',
    votes: 98,
    category: 'ai',
    estimatedDate: '2024-12-31'
  },
  {
    id: 5,
    title: 'Export Excel des comparaisons',
    description: 'Exportation des données de comparaison en format Excel',
    status: 'planned',
    votes: 76,
    category: 'export',
    estimatedDate: '2025-01-15'
  }
];

export default function UserFeedbackSystem() {
  const [activeTab, setActiveTab] = useState('feedback');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'improvement',
    title: '',
    description: '',
    priority: 'medium',
    email: '',
    anonymous: false
  });
  const [survey, setSurvey] = useState({
    rating: 5,
    easeOfUse: 5,
    features: 5,
    design: 5,
    performance: 5,
    recommendation: 8,
    comments: ''
  });
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);
  const [roadmapItems, setRoadmapItems] = useState(ROADMAP_ITEMS);
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    // Load saved feedback and votes
    const saved = localStorage.getItem('akp_user_feedback');
    if (saved) {
      setSubmittedFeedbacks(JSON.parse(saved));
    }
    
    const savedVotes = localStorage.getItem('akp_user_votes');
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, []);

  const submitFeedback = () => {
    if (!feedback.title.trim() || !feedback.description.trim()) {
      alert('Veuillez remplir le titre et la description');
      return;
    }

    const newFeedback = {
      id: Date.now(),
      ...feedback,
      timestamp: new Date().toISOString(),
      status: 'submitted'
    };

    const updated = [...submittedFeedbacks, newFeedback];
    setSubmittedFeedbacks(updated);
    localStorage.setItem('akp_user_feedback', JSON.stringify(updated));
    
    // Reset form
    setFeedback({
      type: 'improvement',
      title: '',
      description: '',
      priority: 'medium',
      email: '',
      anonymous: false
    });
    setShowFeedbackForm(false);
    
    // Show success message
    alert('Merci pour votre retour ! Il a été transmis à l\'équipe de développement.');
  };

  const submitSurvey = () => {
    const surveyData = {
      ...survey,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };
    
    localStorage.setItem('akp_satisfaction_survey', JSON.stringify(surveyData));
    alert('Merci d\'avoir pris le temps de répondre à notre enquête !');
    
    // Reset survey
    setSurvey({
      rating: 5,
      easeOfUse: 5,
      features: 5,
      design: 5,
      performance: 5,
      recommendation: 8,
      comments: ''
    });
  };

  const voteForRoadmapItem = (itemId) => {
    if (userVotes[itemId]) {
      // Remove vote
      const newVotes = { ...userVotes };
      delete newVotes[itemId];
      setUserVotes(newVotes);
      
      // Update roadmap item
      setRoadmapItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, votes: item.votes - 1 } : item
      ));
    } else {
      // Add vote
      const newVotes = { ...userVotes, [itemId]: true };
      setUserVotes(newVotes);
      
      // Update roadmap item
      setRoadmapItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, votes: item.votes + 1 } : item
      ));
    }
    
    localStorage.setItem('akp_user_votes', JSON.stringify(userVotes));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'under-review': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return '✅ Terminé';
      case 'in-progress': return '🚧 En cours';
      case 'planned': return '📅 Planifié';
      case 'under-review': return '🔍 En évaluation';
      default: return '❓ Inconnu';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          💬
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Feedback Utilisateur</h2>
          <p className="text-sm text-gray-600">Aidez-nous à améliorer A KI PRI SA YÉ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[
          { id: 'feedback', label: 'Signaler', icon: '🗣️' },
          { id: 'survey', label: 'Enquête', icon: '📊' },
          { id: 'roadmap', label: 'Roadmap', icon: '🛣️' },
          { id: 'history', label: 'Historique', icon: '📝' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {!showFeedbackForm ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-lg font-semibold mb-2">Partagez votre retour</h3>
              <p className="text-gray-600 mb-6">
                Votre opinion compte ! Aidez-nous à améliorer l'application.
              </p>
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                📝 Nouveau feedback
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Nouveau feedback</h3>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de feedback
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FEEDBACK_TYPES).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setFeedback(prev => ({ ...prev, type: key }))}
                      className={`p-3 rounded-lg border-2 text-left ${
                        feedback.type === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  value={feedback.title}
                  onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Résumé en une phrase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description détaillée
                </label>
                <textarea
                  value={feedback.description}
                  onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Décrivez votre retour en détail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <select
                    value={feedback.priority}
                    onChange={(e) => setFeedback(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
                      <option key={key} value={key}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={feedback.email}
                    onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Pour un suivi"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={feedback.anonymous}
                  onChange={(e) => setFeedback(prev => ({ ...prev, anonymous: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Feedback anonyme</span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={submitFeedback}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Envoyer
                </button>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Survey Tab */}
      {activeTab === 'survey' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Enquête de satisfaction</h3>
            <p className="text-gray-600">Aidez-nous à comprendre votre expérience</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note globale de l'application (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={survey.rating}
                onChange={(e) => setSurvey(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>1 - Très mauvais</span>
                <span className="font-bold">{survey.rating}/10</span>
                <span>10 - Excellent</span>
              </div>
            </div>

            {[
              { key: 'easeOfUse', label: 'Facilité d\'utilisation' },
              { key: 'features', label: 'Utilité des fonctionnalités' },
              { key: 'design', label: 'Design et interface' },
              { key: 'performance', label: 'Performance et rapidité' }
            ].map(item => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {item.label} (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setSurvey(prev => ({ ...prev, [item.key]: rating }))}
                      className={`w-10 h-10 rounded-full border-2 ${
                        survey[item.key] >= rating
                          ? 'bg-yellow-400 border-yellow-500 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommanderiez-vous l'app ? (0-10)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={survey.recommendation}
                onChange={(e) => setSurvey(prev => ({ ...prev, recommendation: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0 - Pas du tout</span>
                <span className="font-bold">{survey.recommendation}/10</span>
                <span>10 - Absolument</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commentaires additionnels
              </label>
              <textarea
                value={survey.comments}
                onChange={(e) => setSurvey(prev => ({ ...prev, comments: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Que pouvons-nous améliorer ?"
              />
            </div>

            <button
              onClick={submitSurvey}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Envoyer l'enquête
            </button>
          </div>
        </div>
      )}

      {/* Roadmap Tab */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Roadmap Publique</h3>
            <p className="text-gray-600">Votez pour les fonctionnalités que vous souhaitez voir en priorité</p>
          </div>

          <div className="space-y-4">
            {roadmapItems
              .sort((a, b) => b.votes - a.votes)
              .map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => voteForRoadmapItem(item.id)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          userVotes[item.id]
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {userVotes[item.id] ? '👍 Voté' : '👍 Voter'}
                      </button>
                      <span className="text-sm font-bold text-gray-700">{item.votes}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    <span className="text-gray-500">
                      📅 {new Date(item.estimatedDate).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-gray-500">
                      🏷️ {item.category}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Vos retours soumis</h3>
          
          {submittedFeedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>Aucun feedback soumis pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedFeedbacks.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{FEEDBACK_TYPES[item.type].icon}</span>
                    <h4 className="font-semibold">{item.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${FEEDBACK_TYPES[item.type].color}`}>
                      {FEEDBACK_TYPES[item.type].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {new Date(item.timestamp).toLocaleDateString('fr-FR')}</span>
                    <span className={PRIORITY_LEVELS[item.priority].color}>
                      🔥 {PRIORITY_LEVELS[item.priority].label}
                    </span>
                    <span className="text-green-600">✅ Soumis</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}