import { cn } from "../../lib/utils";

/**
 * DataNote - Transparency & Trust Panel
 * Key to citizen confidence - always shows data sources & limitations
 * NO marketing promises, ONLY real data attribution
 */
export interface DataNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "source";
}

export function DataNote({
  children,
  variant = "info",
  className,
  ...props
}: DataNoteProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        "text-xs leading-relaxed",
        "backdrop-blur-glass",
        
        variant === "info" && [
          "bg-info/10 border-info/30",
          "text-muted",
        ],
        variant === "warning" && [
          "bg-warning/10 border-warning/30",
          "text-muted",
        ],
        variant === "source" && [
          "bg-glass border-glass-border",
          "text-muted",
        ],
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * SourceAttribution - Official data source panel
 * Critical for institutional credibility
 */
export function SourceAttribution({
  source,
  description,
  className,
}: {
  source: string;
  description?: string;
  className?: string;
}) {
  return (
    <DataNote variant="source" className={className}>
      <strong className="text-foreground">Source : </strong>
      {source}
      {description && (
        <>
          {" — "}
          {description}
        </>
      )}
    </DataNote>
  );
}

/**
 * DataLimitation - Data limitation disclaimer
 * Essential for transparency - shows what we DON'T know
 */
export function DataLimitation({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DataNote variant="warning" className={className}>
      <strong className="text-foreground">Limite : </strong>
      {children}
    </DataNote>
  );
}
