 
import { cn } from '../../lib/utils';
import BackgroundMapBlur from '../BackgroundMapBlur.jsx';

/**
 * AppLayout - Main application layout
 * Civic Glass design with subtle blurred background
 * Institutional, chic, not decorative
 */
export function AppLayout({
  children,
  className,
  maxWidth = 'xl',
  withBackground = true,
}) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Chic background - blurred map at 20% opacity */}
      {withBackground && <BackgroundMapBlur />}

      {/* Main content with z-index above background */}
      <main
        className={cn(
          'relative z-10',
          'p-4 sm:p-6 lg:p-8',
          'mx-auto',
          maxWidthClasses[maxWidth],
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

/**
 * AppLayoutWithNav - Layout with header/navigation
 * For pages that need the standard navigation
 */
export function AppLayoutWithNav({
  children,
  className,
  maxWidth = 'xl',
  header,
  footer,
}) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* Chic background */}
      <BackgroundMapBlur />

      {/* Header/Nav */}
      {header && <div className="relative z-10">{header}</div>}

      {/* Main content */}
      <main
        className={cn(
          'relative z-10 flex-grow',
          'p-4 sm:p-6 lg:p-8',
          'mx-auto w-full',
          maxWidthClasses[maxWidth],
          className,
        )}
      >
        {children}
      </main>

      {/* Footer */}
      {footer && <div className="relative z-10">{footer}</div>}
    </div>
  );
}

/**
 * AppLayoutFullWidth - Full width layout without constraints
 * For maps, dashboards, etc.
 */
export function AppLayoutFullWidth({
  children,
  className,
  withBackground = false,
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {withBackground && <BackgroundMapBlur />}
      <main className={cn('relative z-10', className)}>{children}</main>
    </div>
  );
}
