/**
 * RequireCreator.tsx
 *
 * Route guard for pages that require the "creator" role (or above).
 * Both "creator" and "admin" users are granted access.
 */

import type { ReactElement } from 'react';

import RequireRole from './RequireRole';

interface RequireCreatorProps {
  children: ReactElement;
}

export default function RequireCreator({ children }: RequireCreatorProps) {
  return (
    // eslint-disable-next-line jsx-a11y/aria-role -- "role" is a custom RequireRole prop, not an ARIA attribute
    <RequireRole role="creator" redirectTo="/">
      {children}
    </RequireRole>
  );
}
