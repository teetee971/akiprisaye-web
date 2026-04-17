/**
 * RequireAdmin.tsx
 *
 * Route guard for pages that require the "admin" role exclusively.
 */

import type { ReactElement } from 'react';

import RequireRole from './RequireRole';

interface RequireAdminProps {
  children: ReactElement;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  return (
    // eslint-disable-next-line jsx-a11y/aria-role -- "role" is a custom RequireRole prop, not an ARIA attribute
    <RequireRole role="admin" redirectTo="/">
      {children}
    </RequireRole>
  );
}
