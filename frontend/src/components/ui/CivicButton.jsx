/**
 * CivicButton - thin wrapper over Button (Civic Glass Design System)
 * Kept for backward-compat; prefer importing Button from './button' directly.
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md (default), lg
 */
import { Button } from './button';

const SIZE_MAP = { sm: 'sm', md: 'md', lg: 'lg' };

export function CivicButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <Button variant={variant} size={SIZE_MAP[size] ?? 'md'} className={className} {...props}>
      {children}
    </Button>
  );
}

export default CivicButton;
