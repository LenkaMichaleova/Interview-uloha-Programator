import type { LatLngBounds } from 'leaflet';
import type { ParcelFeature } from '../../parcels/types/parcel.types';

export type MapViewProps = {
  center: [number, number];
  zoom: number;
  parcels: ParcelFeature[];
  onBoundsChange: (bounds: LatLngBounds) => void;
  selectedParcelId: string | null;
  onSelectParcel: (id: string | null) => void;
  cadastreColors: Record<string, string>;
};
