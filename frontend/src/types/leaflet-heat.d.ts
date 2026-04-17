/**
 * Type definitions for leaflet.heat
 * https://github.com/Leaflet/Leaflet.heat
 */

import * as L from 'leaflet';

declare module 'leaflet' {
  /**
   * HeatLayer options interface
   */
  interface HeatLayerOptions {
    /**
     * Minimum opacity (0-1)
     * @default 0.05
     */
    minOpacity?: number;

    /**
     * Maximum zoom level at which the heat is most intense
     * @default 18
     */
    maxZoom?: number;

    /**
     * Maximum number of points to process at once
     * @default Infinity
     */
    max?: number;

    /**
     * Radius of each "point" in pixels
     * @default 25
     */
    radius?: number;

    /**
     * Amount of blur for each "point"
     * @default 15
     */
    blur?: number;

    /**
     * Color gradient configuration
     * Object mapping position (0-1) to color
     * @example { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
     */
    gradient?: { [key: number]: string };
  }

  /**
   * HeatLayer class for creating heatmap visualizations
   */
  class HeatLayer extends Layer {
    /**
     * Creates a new HeatLayer
     * @param latlngs Array of [lat, lng, intensity] or [lat, lng] points
     * @param options HeatLayer options
     */
    constructor(latlngs: Array<[number, number, number?]>, options?: HeatLayerOptions);

    /**
     * Set the data for the heatmap
     * @param latlngs Array of [lat, lng, intensity] or [lat, lng] points
     */
    setLatLngs(latlngs: Array<[number, number, number?]>): this;

    /**
     * Add a new point to the heatmap
     * @param latlng [lat, lng, intensity] or [lat, lng]
     */
    addLatLng(latlng: [number, number, number?]): this;

    /**
     * Set the gradient colors
     * @param gradient Object mapping position (0-1) to color
     */
    setOptions(options: HeatLayerOptions): this;

    /**
     * Redraw the heatmap layer
     */
    redraw(): this;
  }

  namespace heatLayer {
    /**
     * Factory function to create a HeatLayer
     * @param latlngs Array of [lat, lng, intensity] or [lat, lng] points
     * @param options HeatLayer options
     */
    function heatLayer(
      latlngs: Array<[number, number, number?]>,
      options?: HeatLayerOptions
    ): HeatLayer;
  }

  /**
   * Factory function to create a HeatLayer (lowercase)
   * @param latlngs Array of [lat, lng, intensity] or [lat, lng] points
   * @param options HeatLayer options
   */
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatLayerOptions
  ): HeatLayer;
}

declare module 'leaflet.heat' {
  import * as L from 'leaflet';
  export = L;
}
