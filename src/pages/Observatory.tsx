/**
 * Observatory Page Component
 * 
 * Page principale de l'observatoire des prix
 * Point d'entrée pour l'accès public aux données
 */

import React from 'react';
import { ObservatoryDashboard } from '../components/observatory/ObservatoryDashboard';

export const Observatory: React.FC = () => {
  return (
    <div className="observatory-page">
      <ObservatoryDashboard />
    </div>
  );
};

export default Observatory;
