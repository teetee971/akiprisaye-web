import React, { useState, useEffect } from 'react';

// Badge definitions
const BADGES = {
  first_price_report: {
    id: 'first_price_report',
    name: 'Premier Signalement',
    description: 'Votre premier signalement de prix',
    icon: '🎯',
    color: 'bg-blue-100 text-blue-800',
    points: 10
  },
  price_detective: {
    id: 'price_detective',
    name: 'Détective des Prix',
    description: '10 signalements de prix effectués',
    icon: '🕵️',
    color: 'bg-yellow-100 text-yellow-800',
    points: 50
  },
  savings_master: {
    id: 'savings_master',
    name: 'Maître des Économies',
    description: 'Économisé plus de 100€ grâce à l\'app',
    icon: '💰',
    color: 'bg-green-100 text-green-800',
    points: 100
  },
  community_helper: {
    id: 'community_helper',
    name: 'Aide Communautaire',
    description: '25 prix signalés pour aider la communauté',
    icon: '🤝',
    color: 'bg-purple-100 text-purple-800',
    points: 75
  },
  weekly_champion: {
    id: 'weekly_champion',
    name: 'Champion Hebdomadaire',
    description: 'Plus de signalements cette semaine',
    icon: '🏆',
    color: 'bg-yellow-100 text-yellow-800',
    points: 150
  },
  bargain_hunter: {
    id: 'bargain_hunter',
    name: 'Chasseur de Bonnes Affaires',
    description: 'Trouvé 5 promotions exceptionnelles',
    icon: '🎪',
    color: 'bg-pink-100 text-pink-800',
    points: 80
  },
  loyalty_member: {
    id: 'loyalty_member',
    name: 'Membre Fidèle',
    description: 'Utilise l\'app depuis 30 jours',
    icon: '⭐',
    color: 'bg-indigo-100 text-indigo-800',
    points: 60
  },
  price_predictor: {
    id: 'price_predictor',
    name: 'Prédicteur de Prix',
    description: 'Prédit avec succès 5 évolutions de prix',
    icon: '🔮',
    color: 'bg-teal-100 text-teal-800',
    points: 120
  }
};

// Mock user data
const mockUserData = {
  id: 'user123',
  name: 'Marie D.',
  territory: 'guadeloupe',
  joinDate: '2024-01-15',
  stats: {
    totalReports: 23,
    totalSavings: 156.80,
    weeklyReports: 7,
    promotionsFound: 8,
    daysActive: 45,
    accuratePredictions: 6
  },
  badges: ['first_price_report', 'price_detective', 'savings_master', 'community_helper'],
  points: 285,
  level: 3
};

// Mock leaderboard data
const mockLeaderboard = [
  { id: 'user123', name: 'Marie D.', territory: 'guadeloupe', points: 285, level: 3, badges: 4 },
  { id: 'user456', name: 'Jean-Claude M.', territory: 'martinique', points: 320, level: 4, badges: 5 },
  { id: 'user789', name: 'Sylvie L.', territory: 'reunion', points: 298, level: 3, badges: 4 },
  { id: 'user101', name: 'David P.', territory: 'guyane', points: 275, level: 3, badges: 3 },
  { id: 'user202', name: 'Françoise B.', territory: 'guadeloupe', points: 260, level: 2, badges: 4 },
  { id: 'user303', name: 'Antoine R.', territory: 'martinique', points: 245, level: 2, badges: 3 },
  { id: 'user404', name: 'Claire S.', territory: 'reunion', points: 230, level: 2, badges: 3 },
  { id: 'user505', name: 'Michel H.', territory: 'mayotte', points: 215, level: 2, badges: 2 },
];

// Challenges definitions
const CHALLENGES = [
  {
    id: 'weekly_reporter',
    name: 'Rapporteur de la Semaine',
    description: 'Signaler 10 prix cette semaine',
    target: 10,
    current: 7,
    reward: '50 points + Badge Champion',
    deadline: '2024-09-28',
    icon: '📋'
  },
  {
    id: 'savings_goal',
    name: 'Objectif Économies',
    description: 'Économiser 50€ ce mois-ci',
    target: 50,
    current: 32.40,
    reward: '75 points',
    deadline: '2024-09-30',
    icon: '💸'
  },
  {
    id: 'territory_explorer',
    name: 'Explorateur Territorial',
    description: 'Signaler des prix dans 3 territoires différents',
    target: 3,
    current: 1,
    reward: '100 points + Badge Explorateur',
    deadline: '2024-10-15',
    icon: '🌍'
  }
];

const getTerritoryFlag = (territory) => {
  const flags = {
    guadeloupe: '🇬🇵',
    martinique: '🇲🇶',
    guyane: '🇬🇫',
    reunion: '🇷🇪',
    mayotte: '🇾🇹'
  };
  return flags[territory] || '🏴';
};

const getLevelInfo = (points) => {
  if (points < 100) return { level: 1, name: 'Débutant', color: 'text-gray-600', nextLevel: 100 };
  if (points < 250) return { level: 2, name: 'Amateur', color: 'text-blue-600', nextLevel: 250 };
  if (points < 500) return { level: 3, name: 'Expert', color: 'text-purple-600', nextLevel: 500 };
  if (points < 1000) return { level: 4, name: 'Maître', color: 'text-yellow-600', nextLevel: 1000 };
  return { level: 5, name: 'Légende', color: 'text-red-600', nextLevel: null };
};

export default function GamificationSystem() {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(mockUserData);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [challenges, setChallenges] = useState(CHALLENGES);

  // Check for new badges
  const checkForNewBadges = () => {
    const newBadges = [];
    
    // Check each badge condition
    if (userData.stats.totalReports >= 1 && !userData.badges.includes('first_price_report')) {
      newBadges.push('first_price_report');
    }
    if (userData.stats.totalReports >= 10 && !userData.badges.includes('price_detective')) {
      newBadges.push('price_detective');
    }
    if (userData.stats.totalSavings >= 100 && !userData.badges.includes('savings_master')) {
      newBadges.push('savings_master');
    }
    if (userData.stats.totalReports >= 25 && !userData.badges.includes('community_helper')) {
      newBadges.push('community_helper');
    }
    if (userData.stats.weeklyReports >= 10 && !userData.badges.includes('weekly_champion')) {
      newBadges.push('weekly_champion');
    }
    if (userData.stats.promotionsFound >= 5 && !userData.badges.includes('bargain_hunter')) {
      newBadges.push('bargain_hunter');
    }
    if (userData.stats.daysActive >= 30 && !userData.badges.includes('loyalty_member')) {
      newBadges.push('loyalty_member');
    }
    if (userData.stats.accuratePredictions >= 5 && !userData.badges.includes('price_predictor')) {
      newBadges.push('price_predictor');
    }

    if (newBadges.length > 0) {
      // Simulate badge notification
      newBadges.forEach(badgeId => {
        setTimeout(() => {
          alert(`🎉 Nouveau badge débloqué: ${BADGES[badgeId].name}!`);
        }, 500);
      });
      
      setUserData(prev => ({
        ...prev,
        badges: [...prev.badges, ...newBadges],
        points: prev.points + newBadges.reduce((sum, badgeId) => sum + BADGES[badgeId].points, 0)
      }));
    }
  };

  // Simulate user action (for demo)
  const simulateAction = (action) => {
    const newStats = { ...userData.stats };
    let pointsEarned = 0;

    switch(action) {
      case 'report_price':
        newStats.totalReports += 1;
        newStats.weeklyReports += 1;
        pointsEarned = 5;
        break;
      case 'find_promotion':
        newStats.promotionsFound += 1;
        pointsEarned = 10;
        break;
      case 'accurate_prediction':
        newStats.accuratePredictions += 1;
        pointsEarned = 15;
        break;
      case 'save_money':
        newStats.totalSavings += 12.50;
        pointsEarned = 8;
        break;
    }

    setUserData(prev => ({
      ...prev,
      stats: newStats,
      points: prev.points + pointsEarned
    }));

    // Check for new badges after a short delay
    setTimeout(checkForNewBadges, 1000);
  };

  const userLevel = getLevelInfo(userData.points);
  const progressToNext = userLevel.nextLevel ? 
    ((userData.points % (userLevel.nextLevel / userLevel.level)) / (userLevel.nextLevel / userLevel.level)) * 100 : 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
          🏆
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Système de Gamification</h2>
          <p className="text-sm text-gray-600">Gagnez des points et débloquez des badges</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[
          { id: 'profile', label: 'Mon Profil', icon: '👤' },
          { id: 'badges', label: 'Badges', icon: '🏅' },
          { id: 'leaderboard', label: 'Classement', icon: '🏆' },
          { id: 'challenges', label: 'Défis', icon: '🎯' }
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {userData.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold">{userData.name}</h3>
                <p className="text-gray-600">
                  {getTerritoryFlag(userData.territory)} {userData.territory.charAt(0).toUpperCase() + userData.territory.slice(1)}
                </p>
                <p className="text-sm text-gray-500">
                  Membre depuis {new Date(userData.joinDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <div className={`text-2xl font-bold ${userLevel.color}`}>
                  Niveau {userLevel.level}
                </div>
                <div className="text-sm text-gray-600">{userLevel.name}</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{userData.points} points</span>
                  {userLevel.nextLevel && <span>{userLevel.nextLevel} points</span>}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{userData.stats.totalReports}</div>
              <div className="text-sm text-blue-800">Prix signalés</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{userData.stats.totalSavings.toFixed(2)}€</div>
              <div className="text-sm text-green-800">Économisé</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{userData.badges.length}</div>
              <div className="text-sm text-purple-800">Badges</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{userData.stats.daysActive}</div>
              <div className="text-sm text-yellow-800">Jours actifs</div>
            </div>
          </div>

          {/* Demo Actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Actions de démonstration</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => simulateAction('report_price')}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                📝 Signaler un prix (+5 pts)
              </button>
              <button
                onClick={() => simulateAction('find_promotion')}
                className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                🎪 Trouver une promo (+10 pts)
              </button>
              <button
                onClick={() => simulateAction('accurate_prediction')}
                className="px-3 py-2 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
              >
                🔮 Prédiction exacte (+15 pts)
              </button>
              <button
                onClick={() => simulateAction('save_money')}
                className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
              >
                💰 Économiser de l'argent (+8 pts)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Collection de Badges</h3>
            <p className="text-gray-600">
              {userData.badges.length} / {Object.keys(BADGES).length} badges débloqués
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(BADGES).map(badge => {
              const isUnlocked = userData.badges.includes(badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 ${
                    isUnlocked 
                      ? `${badge.color} border-current` 
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{badge.name}</h4>
                      <p className="text-sm opacity-90">{badge.description}</p>
                      <div className="text-xs mt-1">
                        {badge.points} points • {isUnlocked ? '✅ Débloqué' : '🔒 Verrouillé'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Classement Communautaire</h3>
            <p className="text-gray-600">Les contributeurs les plus actifs</p>
          </div>

          <div className="space-y-2">
            {leaderboard.map((user, index) => {
              const isCurrentUser = user.id === userData.id;
              const levelInfo = getLevelInfo(user.points);
              
              return (
                <div 
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className={`text-lg font-bold w-8 text-center ${
                    index === 0 ? 'text-yellow-600' :
                    index === 1 ? 'text-gray-500' :
                    index === 2 ? 'text-yellow-700' : 'text-gray-700'
                  }`}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-sm">{getTerritoryFlag(user.territory)}</span>
                      {isCurrentUser && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          Vous
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Niveau {levelInfo.level} • {user.badges} badges
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg">{user.points}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Défis Actifs</h3>
            <p className="text-gray-600">Relevez ces défis pour gagner des points bonus</p>
          </div>

          <div className="space-y-4">
            {challenges.map(challenge => {
              const progress = (challenge.current / challenge.target) * 100;
              const isCompleted = challenge.current >= challenge.target;
              
              return (
                <div key={challenge.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{challenge.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{challenge.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span>{challenge.current} / {challenge.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 font-medium">🎁 {challenge.reward}</span>
                        <span className="text-gray-500">
                          ⏰ Jusqu'au {new Date(challenge.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      {isCompleted && (
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            ✅ Défi complété !
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}