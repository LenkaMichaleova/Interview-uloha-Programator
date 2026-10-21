import { useEffect, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { type LatLngBounds } from 'leaflet'
import type { GeoJsonObject } from 'geojson'
import './App.css'
import type { ParcelFeature, ParcelProperties } from './types'

const INITIAL_CENTER: [number, number] = [50.435, 15.35]
const INITIAL_ZOOM = 11

const CADASTRE_COLORS: Record<string, string> = {
  Jičín: '#2e7d32',
  Březina: '#1976d2',
  'Konecchlumí': '#ef6c00',
  Ostružno: '#7b1fa2',
}

type ParcelResponse = {
  type: 'FeatureCollection'
  features: ParcelFeature[]
}

async function fetchParcels(bounds: LatLngBounds): Promise<ParcelFeature[]> {
  const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
  const response = await fetch(`/api/parcels?bbox=${encodeURIComponent(bbox)}`)

  if (!response.ok) {
    throw new Error('Nepodařilo se načíst parcelní data.')
  }

  const payload = (await response.json()) as ParcelResponse
  return payload.features ?? []
}

async function fetchParcelDetail(id: string): Promise<ParcelFeature | null> {
  const response = await fetch(`/api/parcel?id=${encodeURIComponent(id)}`)

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as ParcelFeature
  return payload
}

function MapController({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: LatLngBounds) => void
}) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  })

  useEffect(() => {
    onBoundsChange(map.getBounds())
  }, [map, onBoundsChange])

  return null
}

function App() {
  const [visibleParcels, setVisibleParcels] = useState<ParcelFeature[]>([])
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null)
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null)

  useEffect(() => {
    if (!mapBounds) {
      return
    }

    let isMounted = true

    fetchParcels(mapBounds)
      .then((parcels) => {
        if (isMounted) {
          setVisibleParcels(parcels)
        }
      })
      .catch(() => {
        if (isMounted) {
          setVisibleParcels([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [mapBounds])

  useEffect(() => {
    if (!selectedParcelId) {
      setSelectedParcel(null)
      return
    }

    fetchParcelDetail(selectedParcelId)
      .then((parcel) => {
        setSelectedParcel(parcel)
      })
      .catch(() => {
        setSelectedParcel(null)
      })
  }, [selectedParcelId])

  const parcelInfo = selectedParcel?.properties ?? null

  return (
    <div className="app-shell">
      <aside className="panel">
        <div className="panel-header">
          <p className="eyebrow">Katastrální mapa</p>
          <h1>Okres Jičín</h1>
        </div>

        <div className="stats">
          <div className="stat">
            <strong>{visibleParcels.length}</strong>
            <span>viditelných parcel</span>
          </div>
          <div className="stat">
            <strong>4</strong>
            <span>katastrální území</span>
          </div>
        </div>

        {parcelInfo ? (
          <section className="parcel-card">
            <div className="parcel-title-row">
              <span className="parcel-badge">{parcelInfo.cadastre}</span>
              <span className="parcel-number">{parcelInfo.parcelNumber}</span>
            </div>

            <dl>
              <div>
                <dt>Vlastník</dt>
                <dd>{parcelInfo.owner}</dd>
              </div>
              <div>
                <dt>Využití</dt>
                <dd>{parcelInfo.landUse}</dd>
              </div>
              <div>
                <dt>Plocha</dt>
                <dd>{new Intl.NumberFormat('cs-CZ').format(parcelInfo.area)} m²</dd>
              </div>
              <div>
                <dt>Stav</dt>
                <dd>{parcelInfo.status}</dd>
              </div>
            </dl>
          </section>
        ) : (
          <div className="empty-state">
            Kliknutím na parcelu v mapě zobrazíte podrobnosti o katastrálním území.
          </div>
        )}
      </aside>

      <main className="map-panel">
        <MapContainer
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          scrollWheelZoom
          className="map"
        >
          <MapController onBoundsChange={setMapBounds} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {visibleParcels.length > 0 ? (
            <GeoJSON
              data={
                {
                  type: 'FeatureCollection',
                  features: visibleParcels,
                } as GeoJsonObject
              }
              style={(feature) => {
                const properties = feature?.properties as ParcelProperties | undefined
                const cadastre = properties?.cadastre ?? 'Jičín'

                return {
                  color: '#0f172a',
                  weight: 1,
                  fillColor: CADASTRE_COLORS[cadastre] ?? '#4f46e5',
                  fillOpacity: 0.7,
                  opacity: 0.9,
                }
              }}
              onEachFeature={(feature, layer) => {
                const parcel = feature as ParcelFeature
                const properties = parcel.properties as ParcelProperties

                layer.bindTooltip(`${properties.cadastre} • ${properties.parcelNumber}`)
                layer.on({
                  click: () => setSelectedParcelId(parcel.properties.id),
                })
              }}
            />
          ) : null}
        </MapContainer>
      </main>
    </div>
  )
}

export default App
