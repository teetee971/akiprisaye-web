/**
 * Lutte contre la Vie Chère - Page Wrapper
 * Wraps the LutteVieChere component for routing
 */

import { Helmet } from 'react-helmet-async';
import { LutteVieChere } from './LutteVieChere';

export default function LutteVieChereIndexPage() {
  return (
    <>
      <Helmet>
        <title>Lutte contre la Vie Chère - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Ensemble, agissons pour des prix justes dans les territoires d'Outre-mer" 
        />
      </Helmet>
      <LutteVieChere />
    </>
  );
}
