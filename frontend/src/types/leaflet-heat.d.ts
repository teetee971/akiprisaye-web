// Type declarations for leaflet.heat
declare module 'leaflet.heat' {
  import * as L from 'leaflet';

  export interface HeatLatLngTuple extends Array<number> {
    0: number; // latitude
    1: number; // longitude
    2?: number; // intensity (optional, 0-1)
  }

  export interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }

  export interface HeatLayer extends L.Layer {
    setOptions(options: HeatLayerOptions): this;
    addLatLng(latlng: L.LatLngExpression): this;
    setLatLngs(latlngs: HeatLatLngTuple[]): this;
    redraw(): this;
  }

  export function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatLayerOptions
  ): HeatLayer;

  namespace L {
    function heatLayer(
      latlngs: HeatLatLngTuple[],
      options?: HeatLayerOptions
    ): HeatLayer;
  }
}

// Extend leaflet module to include heatLayer
declare module 'leaflet' {
  export function heatLayer(
    latlngs: import('leaflet.heat').HeatLatLngTuple[],
    options?: import('leaflet.heat').HeatLayerOptions
  ): import('leaflet.heat').HeatLayer;
}
