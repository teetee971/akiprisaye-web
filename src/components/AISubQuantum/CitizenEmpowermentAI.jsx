import React, { useState, useEffect } from 'react';

const CitizenEmpowermentAI = () => {
  const [activeConsultations, setActiveConsultations] = useState([]);
  const [votingResults, setVotingResults] = useState({});
  const [userProfile, setUserProfile] = useState({
    territory: 'Guadeloupe',
    participationLevel: 'active',
    interests: ['transport', 'environnement', 'économie'],
    lastVote: '2024-09-15'
  });
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    // Initialize mock consultations
    setActiveConsultations([
      {
        id: 1,
        title: 'Réduction du coût des transports inter-îles',
        description: 'Proposition de subvention pour diminuer de 30% le coût des liaisons maritimes entre les îles',
        deadline: '2024-10-15',
        participantsCount: 1247,
        status: 'active',
        type: 'vote',
        options: [
          { id: 'yes', label: 'Favorable', votes: 856 },
          { id: 'no', label: 'Défavorable', votes: 291 },
          { id: 'abstain', label: 'Abstention', votes: 100 }
        ]
      },
      {
        id: 2,
        title: 'Plan énergétique territorial 2025-2030',
        description: 'Consultation sur les priorités énergétiques: solaire, éolien, géothermie',
        deadline: '2024-10-30',
        participantsCount: 892,
        status: 'active',
        type: 'consultation',
        topics: ['Énergies renouvelables', 'Efficacité énergétique', 'Stockage']
      },
      {
        id: 3,
        title: 'Amélioration du réseau de transport public',
        description: 'Priorisation des améliorations: nouvelles lignes, horaires étendus, véhicules écologiques',
        deadline: '2024-09-30',
        participantsCount: 1456,
        status: 'closing',
        type: 'ranking'
      }
    ]);

    setProposals([
      {
        id: 101,
        author: 'Marie C.',
        title: 'Zone de gratuité WiFi dans tous les centres-villes',
        description: 'Installation de bornes WiFi gratuites pour favoriser l\'accès numérique',
        category: 'digital',
        supporters: 234,
        status: 'reviewing'
      },
      {
        id: 102,
        author: 'Jean-Luc M.',
        title: 'Marché de producteurs locaux itinérant',
        description: 'Circuit hebdomadaire de marchés pour valoriser les produits locaux',
        category: 'economy',
        supporters: 189,
        status: 'approved'
      }
    ]);
  }, []);

  const vote = (consultationId, optionId) => {
    setActiveConsultations(prev => 
      prev.map(consultation => {
        if (consultation.id === consultationId) {
          return {
            ...consultation,
            options: consultation.options.map(option => ({
              ...option,
              votes: option.id === optionId ? option.votes + 1 : option.votes
            })),
            participantsCount: consultation.participantsCount + 1
          };
        }
        return consultation;
      })
    );
    
    setVotingResults(prev => ({
      ...prev,
      [consultationId]: optionId
    }));
  };

  const submitProposal = () => {
    const newProposal = {
      id: Date.now(),
      author: 'Vous',
      title: 'Nouvelle proposition citoyenne',
      description: 'Description de votre proposition...',
      category: 'general',
      supporters: 1,
      status: 'pending'
    };
    setProposals([...proposals, newProposal]);
  };

  const supportProposal = (proposalId) => {
    setProposals(prev =>
      prev.map(proposal => 
        proposal.id === proposalId 
          ? { ...proposal, supporters: proposal.supporters + 1 }
          : proposal
      )
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'closing': return 'yellow';
      case 'closed': return 'gray';
      default: return 'blue';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🗳️ Empowerment Citoyen & Gouvernance Adaptative
        </h1>
        <p className="text-lg text-gray-600">
          Participation citoyenne intelligente et décisions collectives assistées par IA
        </p>
      </div>

      {/* User Profile Dashboard */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">👤 Votre Profil Citoyen</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-600">Territoire</h4>
            <p className="text-lg font-semibold">{userProfile.territory}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-600">Participation</h4>
            <p className="text-lg font-semibold capitalize">{userProfile.participationLevel}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-600">Centres d'intérêt</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {userProfile.interests.map((interest, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {interest}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-600">Dernier vote</h4>
            <p className="text-lg font-semibold">{userProfile.lastVote}</p>
          </div>
        </div>
      </div>

      {/* Active Consultations */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-6">🗳️ Consultations Actives</h3>
        <div className="space-y-6">
          {activeConsultations.map((consultation) => (
            <div key={consultation.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {consultation.title}
                  </h4>
                  <p className="text-gray-600 mb-3">{consultation.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📅 Échéance: {consultation.deadline}</span>
                    <span>👥 {consultation.participantsCount} participants</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-${getStatusColor(consultation.status)}-800 bg-${getStatusColor(consultation.status)}-100`}>
                  {consultation.status}
                </span>
              </div>

              {consultation.type === 'vote' && (
                <div className="space-y-3">
                  {consultation.options.map((option) => (
                    <div key={option.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => vote(consultation.id, option.id)}
                          disabled={votingResults[consultation.id]}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            votingResults[consultation.id] === option.id
                              ? 'bg-blue-600 text-white'
                              : votingResults[consultation.id]
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {option.label}
                        </button>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(option.votes / consultation.participantsCount) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{option.votes} votes</span>
                      </div>
                    </div>
                  ))}
                  {votingResults[consultation.id] && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm">
                        ✅ Votre vote a été enregistré. Merci pour votre participation !
                      </p>
                    </div>
                  )}
                </div>
              )}

              {consultation.type === 'consultation' && (
                <div className="flex flex-wrap gap-2">
                  {consultation.topics.map((topic, index) => (
                    <button
                      key={index}
                      className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                    >
                      💭 Participer: {topic}
                    </button>
                  ))}
                </div>
              )}

              {consultation.type === 'ranking' && (
                <button className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors text-sm">
                  📊 Classer les priorités
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Proposals */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">💡 Propositions Citoyennes</h3>
          <button 
            onClick={submitProposal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Nouvelle proposition
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{proposal.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{proposal.description}</p>
                  <p className="text-xs text-gray-500">Par {proposal.author}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                  proposal.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {proposal.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  👍 {proposal.supporters} soutiens
                </span>
                <button
                  onClick={() => supportProposal(proposal.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-sm"
                >
                  Soutenir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Governance Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">🧠 Insights IA de Gouvernance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">📊 Analyse Participation</h4>
            <ul className="text-sm space-y-1">
              <li>• Taux de participation: 67%</li>
              <li>• Engagement en hausse: +12%</li>
              <li>• Satisfaction citoyenne: 8.2/10</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">🎯 Recommandations IA</h4>
            <ul className="text-sm space-y-1">
              <li>• Consulter sur mobilité douce</li>
              <li>• Focus jeunes 18-25 ans</li>
              <li>• Simplifier processus vote</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">⚡ Actions Prioritaires</h4>
            <ul className="text-sm space-y-1">
              <li>• Transport: 89% d'urgence</li>
              <li>• Numérique: 72% d'intérêt</li>
              <li>• Environnement: 84% consensus</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenEmpowermentAI;