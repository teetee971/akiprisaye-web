/**
 * Smart Shopping List Page
 * Manage shopping lists with budget optimization
 */

import { Helmet } from 'react-helmet-async';
import { ShoppingListManager } from '../components/ShoppingListManager';

export default function SmartShoppingListPage() {
  return (
    <>
      <Helmet>
        <title>Liste de Courses Intelligente - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Créez et optimisez vos listes de courses pour économiser sur vos achats" 
        />
      </Helmet>
      <ShoppingListManager />
    </>
  );
}
