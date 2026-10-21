import { useEffect, useState } from 'react';
import { fetchParcelDetail } from '../api/parcelApi';
import type { ParcelFeature } from '../types/parcel.types';

export function useParcelDetail(selectedParcelId: string | null) {
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(
    null
  );

  useEffect(() => {
    if (!selectedParcelId) {
      return;
    }

    fetchParcelDetail(selectedParcelId)
      .then((parcel) => {
        setSelectedParcel(parcel);
      })
      .catch(() => {
        setSelectedParcel(null);
      });
  }, [selectedParcelId]);

  return selectedParcel;
}
