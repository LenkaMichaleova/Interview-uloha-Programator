import type { LatLngBounds } from 'leaflet';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchParcelDetail, fetchParcels } from './parcelApi';

describe('parcelApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds the bounding-box request for the visible map area', async () => {
    const bounds = {
      getWest: () => 15.3,
      getSouth: () => 50.42,
      getEast: () => 15.41,
      getNorth: () => 50.47,
    } as LatLngBounds;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: 'FeatureCollection', features: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchParcels(bounds);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/parcels?bbox=15.3%2C50.42%2C15.41%2C50.47'
    );
  });

  it('returns null when the parcel detail request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    await expect(fetchParcelDetail('parcel-1')).resolves.toBeNull();
  });
});
