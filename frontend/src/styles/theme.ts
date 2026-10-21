import { alpha, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2b6eea',
      dark: '#1d4ed8',
      light: '#dbeafe',
    },
    secondary: {
      main: '#0f172a',
    },
    background: {
      default: '#eef4ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: alpha('#0f172a', 0.12),
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    body1: {
      lineHeight: 1.55,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          letterSpacing: '0.02em',
        },
      },
    },
  },
});

export default theme;
