export type ParcelProperties = {
  id: string
  parcelNumber: string
  cadastre: string
  area: number
  landUse: string
  owner: string
  cadastralArea: string
  status: string
}

export type ParcelFeature = {
  type: 'Feature'
  id?: string
  properties: ParcelProperties
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

export type ParcelResponse = {
  type: 'FeatureCollection'
  features: ParcelFeature[]
}
