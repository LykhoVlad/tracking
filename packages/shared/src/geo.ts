import type { Feature, FeatureCollection, LineString, Point } from 'geojson';

export type LngLat = [number, number];

export interface DepotProps {
  id: string;
  name: string;
}

export interface DestinationProps {
  id: string;
  depotId: string;
}

export interface RouteProps {
  id: string;
  depotId: string;
  destinationId: string;
  direction: 'outbound' | 'return';
  distanceKm: number;
  durationMin: number;
}

export type DepotFeature = Feature<Point, DepotProps>;
export type DestinationFeature = Feature<Point, DestinationProps>;
export type RouteFeature = Feature<LineString, RouteProps>;
export type RouteCollection = FeatureCollection<LineString, RouteProps>;
