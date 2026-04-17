/**
 * colors.ts — Centralized color palette definitions
 *
 * Purpose: Single source of truth for all color schemes used in charts and UI
 * Used by: PriceCharts, data visualizations, themed components
 *
 * @module colors
 */

/**
 * Primary chart colors
 */
export const CHART_COLORS = {
  primary: '#0f62fe',
  success: '#24a148',
  warning: '#f1c21b',
  danger: '#da1e28',
  info: '#4589ff',
} as const;

/**
 * Territory comparison colors (12 distinct colors for multiple territories)
 */
export const TERRITORY_COLORS = [
  '#0066cc', // Blue
  '#cc0000', // Red
  '#008844', // Green
  '#ff6600', // Orange
  '#9933cc', // Purple
  '#006699', // Teal
  '#ffcc00', // Yellow
  '#ff3399', // Pink
  '#663399', // Violet
  '#00cccc', // Cyan
  '#cc6600', // Brown
  '#3366cc', // Royal Blue
] as const;

/**
 * Price breakdown colors (for pie charts showing cost components)
 */
export const BREAKDOWN_COLORS = [
  '#4589ff', // Blue - Base price
  '#24a148', // Green - Margin
  '#f1c21b', // Yellow - Octroi
  '#da1e28', // Red - TVA
] as const;

/**
 * Severity/alert colors
 */
export const SEVERITY_COLORS = {
  high: {
    bg: '#fef2f2',
    bgDark: 'rgba(220, 38, 38, 0.3)',
    text: '#991b1b',
    textDark: '#fca5a5',
    border: '#fecaca',
    borderDark: '#991b1b',
  },
  medium: {
    bg: '#fff7ed',
    bgDark: 'rgba(249, 115, 22, 0.3)',
    text: '#9a3412',
    textDark: '#fdba74',
    border: '#fed7aa',
    borderDark: '#9a3412',
  },
  low: {
    bg: '#fef9c3',
    bgDark: 'rgba(234, 179, 8, 0.3)',
    text: '#854d0e',
    textDark: '#fde047',
    border: '#fef08a',
    borderDark: '#854d0e',
  },
} as const;

/**
 * Get a territory color by index (cycles through available colors)
 */
export function getTerritoryColor(index: number): string {
  return TERRITORY_COLORS[index % TERRITORY_COLORS.length];
}

/**
 * Get a breakdown color by index
 */
export function getBreakdownColor(index: number): string {
  return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];
}

/**
 * Chart theme configuration for Recharts
 */
export const CHART_THEME = {
  grid: {
    stroke: '#e5e7eb',
    strokeDasharray: '3 3',
  },
  axis: {
    stroke: '#6b7280',
    style: { fontSize: '12px' },
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#1f2937',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
    },
  },
} as const;
