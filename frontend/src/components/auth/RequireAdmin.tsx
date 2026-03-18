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
    <RequireRole role="admin" redirectTo="/">
      {children}
    </RequireRole>
  );
}
