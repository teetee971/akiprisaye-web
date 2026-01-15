/**
 * Inflation Dashboard Page
 * Displays territory-level inflation metrics and comparisons
 */

import { Helmet } from 'react-helmet-async';
import { InflationDashboard } from '../components/InflationDashboard';

export default function InflationDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Tableau de Bord Inflation - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Suivi transparent de l'évolution des prix et de l'inflation dans les territoires d'Outre-mer" 
        />
      </Helmet>
      <InflationDashboard />
    </>
  );
}
