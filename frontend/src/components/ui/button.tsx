 
import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Button - Civic Glass design system
 * Sober, professional, institutional
 * NO marketing fluff
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "rounded-xl border font-medium",
          "transition-all duration-250 ease-smooth",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none",
          "active:scale-[0.97]",
          "will-change-transform",
          
          // Variant styles
          variant === "default" && [
            "border-glass-border bg-glass backdrop-blur-glass",
            "hover:border-accent hover:bg-glass-hover",
            "hover:-translate-y-0.5 hover:shadow-md",
            "text-foreground",
          ],
          variant === "primary" && [
            "border-accent bg-accent",
            "hover:bg-accent/90",
            "hover:-translate-y-0.5 hover:shadow-glow",
            "text-white",
          ],
          variant === "secondary" && [
            "border-accent-secondary bg-accent-secondary",
            "hover:bg-accent-secondary/90",
            "hover:-translate-y-0.5 hover:shadow-md",
            "text-background",
          ],
          variant === "ghost" && [
            "border-transparent",
            "hover:bg-glass hover:border-glass-border",
            "hover:scale-105",
            "text-foreground",
          ],
          
          // Size styles
          size === "default" && "px-4 py-2 text-sm min-h-[44px]",
          size === "sm" && "px-3 py-1.5 text-xs min-h-[36px]",
          size === "lg" && "px-6 py-3 text-base min-h-[52px]",
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
