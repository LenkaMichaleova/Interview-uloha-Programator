import { render, screen, waitFor } from '@testing-library/react';
import type { LatLngBounds } from 'leaflet';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchParcels } from '../api/parcelApi';
import { useParcels } from './useParcels';

vi.mock('../api/parcelApi', () => ({
  fetchParcels: vi.fn(),
}));

function HookHarness({ bounds }: { bounds: LatLngBounds | null }) {
  const parcels = useParcels(bounds);
  return <div data-testid="parcel-count">{parcels.length}</div>;
}

describe('useParcels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads parcels for the current map bounds and stores them in state', async () => {
    const bounds = {
      getWest: () => 15.3,
      getSouth: () => 50.42,
      getEast: () => 15.41,
      getNorth: () => 50.47,
    } as LatLngBounds;

    vi.mocked(fetchParcels).mockResolvedValue([
      {
        type: 'Feature',
        properties: {
          id: 'parcel-1',
          parcelNumber: '1/1',
          cadastre: 'Jičín',
          area: 1200,
          landUse: 'Zemědělská půda',
          owner: 'A. Novák',
          cadastralArea: 'Jičín',
          status: 'Aktivní',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [15.3, 50.42],
              [15.41, 50.42],
              [15.41, 50.47],
              [15.3, 50.47],
              [15.3, 50.42],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          id: 'parcel-2',
          parcelNumber: '2/2',
          cadastre: 'Jičín',
          area: 900,
          landUse: 'Zemědělská půda',
          owner: 'B. Mládková',
          cadastralArea: 'Jičín',
          status: 'Aktivní',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [15.35, 50.43],
              [15.38, 50.43],
              [15.38, 50.45],
              [15.35, 50.45],
              [15.35, 50.43],
            ],
          ],
        },
      },
    ]);

    render(<HookHarness bounds={bounds} />);

    await waitFor(() => {
      expect(fetchParcels).toHaveBeenCalledWith(bounds);
    });

    await waitFor(() => {
      expect(screen.getByTestId('parcel-count')).toHaveTextContent('2');
    });
  });
});
