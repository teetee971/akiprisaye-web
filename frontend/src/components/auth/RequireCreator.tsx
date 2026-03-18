/**
 * RequireCreator.tsx
 *
 * Route guard for pages that require the "creator" role (or above).
 * Both "creator" and "admin" users are granted access.
 */

import RequireRole from "./RequireRole";

interface RequireCreatorProps {
  children: JSX.Element;
}

export default function RequireCreator({ children }: RequireCreatorProps) {
  return (
    <RequireRole role="creator" redirectTo="/">
      {children}
    </RequireRole>
  );
}
