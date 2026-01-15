import React from 'react';
import FloatingActions from './FloatingActions';

export default function FloatingActionsTest() {
  return (
    <FloatingActions
      cartCount={0}
      onOpenChat={() => console.log('FloatingActions: open chat')}
      onOpenCart={() => console.log('FloatingActions: open cart')}
    />
  );
}
