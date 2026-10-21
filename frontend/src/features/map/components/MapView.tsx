import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import type { MapViewProps } from '../types/map.types';
import type {
  ParcelFeature,
  ParcelProperties,
} from '../../parcels/types/parcel.types';

function MapController({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

function getParcelCenter(parcel: ParcelFeature): [number, number] {
  const coordinates = parcel.geometry.coordinates[0];
  const center = coordinates.reduce(
    (acc, [lng, lat]) => {
      acc[0] += lng;
      acc[1] += lat;
      return acc;
    },
    [0, 0] as [number, number]
  );

  return [center[1] / coordinates.length, center[0] / coordinates.length];
}

function createParcelMarkerIcon(color: string, selected: boolean) {
  const svgMarkup = renderToStaticMarkup(
    <HomeWorkRoundedIcon
      sx={{ fontSize: selected ? 14 : 15 }}
      htmlColor="#ffffff"
    />
  );

  return L.divIcon({
    className: 'parcel-marker-wrapper',
    html: `
      <div style="
        width: ${selected ? 26 : 22}px;
        height: ${selected ? 26 : 22}px;
        border-radius: 50%;
        background: ${color};
        border: ${selected ? '2px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(15, 23, 42, 0.72)'};
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.16);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      ">${svgMarkup}</div>
    `,
    iconSize: [selected ? 26 : 22, selected ? 26 : 22],
    iconAnchor: [selected ? 13 : 11, selected ? 13 : 11],
    popupAnchor: [0, -12],
  });
}

export function MapView({
  center,
  zoom,
  parcels,
  onBoundsChange,
  selectedParcelId,
  onSelectParcel,
  cadastreColors,
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ width: '100%', height: '100%' }}
      className="leaflet-container"
    >
      <MapController onBoundsChange={onBoundsChange} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {parcels.length > 0
        ? parcels.map((parcel) => {
            const properties = parcel.properties as ParcelProperties;
            const cadastre = properties.cadastre ?? 'Jičín';
            const parcelColor = cadastreColors[cadastre] ?? '#4f46e5';

            const isSelected = selectedParcelId === properties.id;

            return (
              <Marker
                key={properties.id}
                position={getParcelCenter(parcel)}
                icon={createParcelMarkerIcon(parcelColor, isSelected)}
                eventHandlers={{
                  click: () => onSelectParcel(properties.id),
                }}
              />
            );
          })
        : null}
    </MapContainer>
  );
}
