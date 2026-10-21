import { useEffect, useState } from 'react';
import { Box, Paper, Stack, Typography, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import LandscapeRoundedIcon from '@mui/icons-material/LandscapeRounded';
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
  minHeight: '100vh',
  width: '100%',
  background: theme.palette.background.default,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const SidebarPanel = styled(Box)(({ theme }) => ({
  width: 360,
  background: theme.palette.background.paper,
  borderRight: `1px solid ${alpha(theme.palette.divider, 1)}`,
  padding: theme.spacing(3, 2.5),
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
  [theme.breakpoints.down('md')]: {
    width: '100%',
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

const MapPanel = styled(Box)({
  flex: 1,
  minWidth: 0,
});

export default function App() {
  const [visibleParcels, setVisibleParcels] = useState<ParcelFeature[]>([]);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(
    null
  );

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

  const parcelInfo = selectedParcel?.properties ?? null;

  return (
    <AppShell>
      <SidebarPanel>
        <Stack spacing={3}>
          <Box>
            <HeaderEyebrow variant="overline">Katastrální mapa</HeaderEyebrow>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <LandscapeRoundedIcon color="primary" fontSize="large" />
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
                {visibleParcels.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                viditelných parcel
              </Typography>
            </StatCard>
            <StatCard elevation={0}>
              <Typography
                variant="h4"
                component="strong"
                sx={{ display: 'block', mb: 0.5 }}
              >
                4
              </Typography>
              <Typography variant="body2" color="text.secondary">
                katastrální území
              </Typography>
            </StatCard>
          </StatsGrid>

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
          parcels={visibleParcels}
          onBoundsChange={setMapBounds}
          selectedParcelId={selectedParcelId}
          onSelectParcel={setSelectedParcelId}
          cadastreColors={CADASTRE_COLORS}
        />
      </MapPanel>
    </AppShell>
  );
}
