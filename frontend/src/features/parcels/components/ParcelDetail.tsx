import { Card, Grid, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import type { ParcelProperties } from '../types/parcel.types';

const ParcelCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(2),
  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.7)} 0%, ${theme.palette.background.paper} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
}));

const ParcelBadge = styled(Typography)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  color: theme.palette.primary.dark,
  fontSize: '0.75rem',
  fontWeight: 700,
  lineHeight: 1,
  padding: theme.spacing(0.75, 1.25),
}));

export function ParcelDetail({ parcelInfo }: { parcelInfo: ParcelProperties }) {
  return (
    <ParcelCard elevation={0}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <ParcelBadge>{parcelInfo.cadastre}</ParcelBadge>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          {parcelInfo.parcelNumber}
        </Typography>
      </Stack>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="overline" color="text.secondary">
            Vlastník
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {parcelInfo.owner}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="overline" color="text.secondary">
            Využití
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {parcelInfo.landUse}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="overline" color="text.secondary">
            Plocha
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {new Intl.NumberFormat('cs-CZ').format(parcelInfo.area)} m²
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="overline" color="text.secondary">
            Stav
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {parcelInfo.status}
          </Typography>
        </Grid>
      </Grid>
    </ParcelCard>
  );
}
