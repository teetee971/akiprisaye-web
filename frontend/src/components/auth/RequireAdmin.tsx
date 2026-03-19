/**
 * RequireAdmin.tsx
 *
 * Route guard for pages that require the "admin" role exclusively.
 */

import RequireRole from "./RequireRole";

interface RequireAdminProps {
  children: JSX.Element;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  return (
    // eslint-disable-next-line jsx-a11y/aria-role -- "role" is a custom RequireRole prop, not an ARIA attribute
    <RequireRole role="admin" redirectTo="/">
      {children}
    </RequireRole>
  );
}
