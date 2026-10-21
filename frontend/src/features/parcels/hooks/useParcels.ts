import { useEffect, useState } from 'react';
import type { LatLngBounds } from 'leaflet';
import { fetchParcels } from '../api/parcelApi';
import type { ParcelFeature } from '../types/parcel.types';

export function useParcels(bounds: LatLngBounds | null) {
  const [visibleParcels, setVisibleParcels] = useState<ParcelFeature[]>([]);

  useEffect(() => {
    if (!bounds) {
      return;
    }

    let isMounted = true;

    fetchParcels(bounds)
      .then((parcels) => {
        if (isMounted) {
          setVisibleParcels(parcels);
        }
      })
      .catch(() => {
        if (isMounted) {
          setVisibleParcels([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bounds]);

  return visibleParcels;
}
