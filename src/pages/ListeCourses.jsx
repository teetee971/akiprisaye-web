import React from 'react';
import SmartShoppingList from '../components/SmartShoppingList';

export default function ListeCourses() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto py-8">
        <SmartShoppingList />
      </div>
    </div>
  );
}
