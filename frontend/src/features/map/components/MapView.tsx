import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import LandscapeRoundedIcon from '@mui/icons-material/LandscapeRounded';
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
    <LandscapeRoundedIcon
      sx={{ fontSize: selected ? 16 : 18 }}
      htmlColor="#ffffff"
    />
  );

  return L.divIcon({
    className: 'parcel-marker-wrapper',
    html: `
      <div style="
        width: ${selected ? 30 : 26}px;
        height: ${selected ? 30 : 26}px;
        border-radius: 50%;
        background: ${color};
        border: ${selected ? '3px solid rgba(255,255,255,0.9)' : '2px solid rgba(15, 23, 42, 0.8)'};
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      ">${svgMarkup}</div>
    `,
    iconSize: [selected ? 30 : 26, selected ? 30 : 26],
    iconAnchor: [selected ? 15 : 13, selected ? 15 : 13],
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
      style={{ width: '100%', height: '100vh', minHeight: '560px' }}
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
