import type { LatLngBounds } from 'leaflet';
import type { ParcelFeature, ParcelResponse } from '../types/parcel.types';

export async function fetchParcels(
  bounds: LatLngBounds
): Promise<ParcelFeature[]> {
  const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
  const response = await fetch(`/api/parcels?bbox=${encodeURIComponent(bbox)}`);

  if (!response.ok) {
    throw new Error('Nepodařilo se načíst parcelní data.');
  }

  const payload = (await response.json()) as ParcelResponse;
  return payload.features ?? [];
}

export async function fetchParcelDetail(
  id: string
): Promise<ParcelFeature | null> {
  const response = await fetch(`/api/parcel?id=${encodeURIComponent(id)}`);

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as ParcelFeature;
  return payload;
}
