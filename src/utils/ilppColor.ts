/**
 * ilppColor.ts — Color mapping for ILPP scores
 * 
 * Purpose: Provide consistent color coding for ILPP visualization
 * 
 * Color scheme (sober, non-anxious):
 * - Green: Low pressure (0-20)
 * - Light yellow: Moderate pressure (21-40)
 * - Orange: Notable pressure (41-60)
 * - Light red: Strong pressure (61-80)
 * - Dark red: Very high pressure (81-100)
 * 
 * @module ilppColor
 */

/**
 * Get hex color for ILPP score (for maps, charts)
 * 
 * @param score - ILPP score (0-100)
 * @returns Hex color code
 * 
 * @example
 * const color = ilppColor(68);
 * // Returns: "#e74c3c" (light red)
 */
export function ilppColor(score: number): string {
  if (score < 21) return '#2ecc71';  // Green
  if (score < 41) return '#f1c40f';  // Light yellow
  if (score < 61) return '#e67e22';  // Orange
  if (score < 81) return '#e74c3c';  // Light red
  return '#8e0000';                   // Dark red
}

/**
 * Get RGB color for ILPP score (for opacity/gradients)
 * 
 * @param score - ILPP score (0-100)
 * @returns RGB values as array [r, g, b]
 */
export function ilppColorRgb(score: number): [number, number, number] {
  if (score < 21) return [46, 204, 113];    // Green
  if (score < 41) return [241, 196, 15];    // Light yellow
  if (score < 61) return [230, 126, 34];    // Orange
  if (score < 81) return [231, 76, 60];     // Light red
  return [142, 0, 0];                        // Dark red
}

/**
 * Get fill opacity for ILPP score (for map visualization)
 * Higher scores get more opacity for emphasis
 * 
 * @param score - ILPP score (0-100)
 * @returns Opacity value (0-1)
 */
export function ilppOpacity(score: number): number {
  if (score < 21) return 0.4;
  if (score < 41) return 0.5;
  if (score < 61) return 0.6;
  if (score < 81) return 0.7;
  return 0.8;
}

/**
 * Get border color (darker than fill)
 * 
 * @param score - ILPP score (0-100)
 * @returns Hex color code for border
 */
export function ilppBorderColor(score: number): string {
  if (score < 21) return '#27ae60';  // Darker green
  if (score < 41) return '#d4a613';  // Darker yellow
  if (score < 61) return '#ca6510';  // Darker orange
  if (score < 81) return '#c0392b';  // Darker red
  return '#6b0000';                   // Darkest red
}

/**
 * Get text color for contrast with background
 * 
 * @param score - ILPP score (0-100)
 * @returns Hex color code for text
 */
export function ilppTextColor(score: number): string {
  // Dark text for lighter backgrounds, light text for darker backgrounds
  if (score < 81) return '#2c3e50';  // Dark gray
  return '#ffffff';                   // White
}

/**
 * Get color scale legend for map
 * Returns array of [min, max, color, label] tuples
 */
export function getIlppColorScale(): Array<[number, number, string, string]> {
  return [
    [0, 20, '#2ecc71', 'Très faible'],
    [21, 40, '#f1c40f', 'Modérée'],
    [41, 60, '#e67e22', 'Notable'],
    [61, 80, '#e74c3c', 'Forte'],
    [81, 100, '#8e0000', 'Très élevée'],
  ];
}
