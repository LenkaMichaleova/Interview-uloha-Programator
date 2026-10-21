import { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import type { LatLngBounds } from 'leaflet';
import { MapView } from '../features/map/components/MapView';
import { ParcelDetail } from '../features/parcels/components/ParcelDetail';
import {
  fetchParcels,
  fetchParcelDetail,
} from '../features/parcels/api/parcelApi';
import type { ParcelFeature } from '../features/parcels/types/parcel.types';

const INITIAL_CENTER: [number, number] = [50.435, 15.35];
const INITIAL_ZOOM = 11;

const CADASTRE_COLORS: Record<string, string> = {
  Jičín: '#2e7d32',
  Březina: '#1976d2',
  Konecchlumí: '#ef6c00',
  Ostružno: '#7b1fa2',
};

const AppShell = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100dvh',
  width: '100%',
  background: theme.palette.background.default,
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    display: 'grid',
    gridTemplateRows: 'minmax(280px, auto) 1fr',
  },
}));

const SidebarPanel = styled(Box)(({ theme }) => ({
  width: 360,
  minWidth: 320,
  background: theme.palette.background.paper,
  borderRight: `1px solid ${alpha(theme.palette.divider, 1)}`,
  padding: theme.spacing(3, 2.5),
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
  overflowY: 'auto',
  height: '100%',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    minWidth: 0,
    maxHeight: '50dvh',
    borderRight: 'none',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`,
  },
}));

const HeaderEyebrow = styled(Typography)(({ theme }) => ({
  margin: 0,
  fontSize: '0.7rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  fontWeight: 700,
}));

const StatsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(2.5),
}));

const StatCard = styled(Paper)(({ theme }) => ({
  borderRadius: 18,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  background: alpha(theme.palette.primary.light, 0.35),
  padding: theme.spacing(1.75, 1.5),
  boxShadow: 'none',
}));

const EmptyState = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  border: `1px dashed ${alpha(theme.palette.text.secondary, 0.4)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  color: theme.palette.text.secondary,
  padding: theme.spacing(2),
  boxShadow: 'none',
}));

const FilterPanel = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.divider, 1)}`,
  background: alpha(theme.palette.primary.light, 0.18),
  boxShadow: 'none',
  padding: theme.spacing(1.5),
}));

const MapPanel = styled(Box)({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
});

export default function App() {
  const [visibleParcels, setVisibleParcels] = useState<ParcelFeature[]>([]);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(
    null
  );
  const [selectedCadastre, setSelectedCadastre] = useState<string | null>(null);

  useEffect(() => {
    if (!mapBounds) {
      return;
    }

    let isMounted = true;

    fetchParcels(mapBounds)
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
  }, [mapBounds]);

  useEffect(() => {
    if (!selectedParcelId) {
      setSelectedParcel(null);
      return;
    }

    let isMounted = true;

    fetchParcelDetail(selectedParcelId)
      .then((parcel) => {
        if (isMounted) {
          setSelectedParcel(parcel);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSelectedParcel(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedParcelId]);

  const cadastreSummary = Array.from(
    visibleParcels.reduce((acc, parcel) => {
      const cadastre = parcel.properties.cadastre || 'Jičín';
      acc.set(cadastre, (acc.get(cadastre) ?? 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'));

  const filteredParcels = selectedCadastre
    ? visibleParcels.filter(
        (parcel) => (parcel.properties.cadastre || 'Jičín') === selectedCadastre
      )
    : visibleParcels;

  const sortedFilteredParcels = [...filteredParcels].sort((a, b) =>
    (a.properties.parcelNumber || '').localeCompare(
      b.properties.parcelNumber || '',
      'cs',
      { numeric: true }
    )
  );

  useEffect(() => {
    if (!selectedCadastre) {
      return;
    }

    const stillVisible = visibleParcels.some(
      (parcel) => (parcel.properties.cadastre || 'Jičín') === selectedCadastre
    );

    if (!stillVisible) {
      setSelectedCadastre(null);
    }
  }, [selectedCadastre, visibleParcels]);

  useEffect(() => {
    if (!selectedParcelId) {
      return;
    }

    const stillVisible = filteredParcels.some(
      (parcel) => parcel.properties.id === selectedParcelId
    );

    if (!stillVisible) {
      setSelectedParcelId(null);
    }
  }, [filteredParcels, selectedParcelId]);

  const parcelInfo = selectedParcel?.properties ?? null;
  const cadastralAreaCount = cadastreSummary.length;

  return (
    <AppShell>
      <SidebarPanel>
        <Stack spacing={3}>
          <Box>
            <HeaderEyebrow variant="overline">Katastrální mapa</HeaderEyebrow>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <HomeWorkRoundedIcon color="primary" fontSize="large" />
              <Typography variant="h3">Okres Jičín</Typography>
            </Stack>
          </Box>

          <StatsGrid>
            <StatCard elevation={0}>
              <Typography
                variant="h4"
                component="strong"
                sx={{ display: 'block', mb: 0.5 }}
              >
                {filteredParcels.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCadastre ? 'parcel v katastru' : 'viditelných parcel'}
              </Typography>
            </StatCard>
            <StatCard elevation={0}>
              <Typography
                variant="h4"
                component="strong"
                sx={{ display: 'block', mb: 0.5 }}
              >
                {cadastralAreaCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                katastrální území
              </Typography>
            </StatCard>
          </StatsGrid>

          <FilterPanel elevation={0}>
            <Stack spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel id="cadastre-label">Katastrální území</InputLabel>
                <Select
                  labelId="cadastre-label"
                  label="Katastrální území"
                  value={selectedCadastre ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedCadastre(value === '' ? null : value);
                    setSelectedParcelId(null);
                  }}
                >
                  <MenuItem value="">
                    Všechna ({visibleParcels.length})
                  </MenuItem>
                  {cadastreSummary.map((item) => (
                    <MenuItem key={item.name} value={item.name}>
                      {item.name} ({item.count})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                size="small"
                disabled={sortedFilteredParcels.length === 0}
              >
                <InputLabel id="parcel-label">Parcela</InputLabel>
                <Select
                  labelId="parcel-label"
                  label="Parcela"
                  value={selectedParcelId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedParcelId(value === '' ? null : value);
                  }}
                >
                  <MenuItem value="">
                    {sortedFilteredParcels.length > 0
                      ? 'Vyberte parcelu'
                      : 'Žádné parcely v zobrazení'}
                  </MenuItem>
                  {sortedFilteredParcels.map((parcel) => (
                    <MenuItem
                      key={parcel.properties.id}
                      value={parcel.properties.id}
                    >
                      {`Parcela ${parcel.properties.parcelNumber} - ${parcel.properties.cadastre || 'Jičín'}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </FilterPanel>

          {parcelInfo ? (
            <ParcelDetail parcelInfo={parcelInfo} />
          ) : (
            <EmptyState elevation={0}>
              Kliknutím na parcelu v mapě zobrazíte podrobnosti o katastrálním
              území.
            </EmptyState>
          )}
        </Stack>
      </SidebarPanel>

      <MapPanel>
        <MapView
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          parcels={filteredParcels}
          onBoundsChange={setMapBounds}
          selectedParcelId={selectedParcelId}
          onSelectParcel={setSelectedParcelId}
          cadastreColors={CADASTRE_COLORS}
        />
      </MapPanel>
    </AppShell>
  );
}
