// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#028184',     // turquesa principal
      light: '#5ABBB8',    // variante clara
      dark: '#015E5E',     // variante oscura
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#A8E6CF',     // verde menta pastel
      contrastText: '#1e1e1e',
    },
    background: {
      default: '#F9FAFA',  // fondo general
      paper: '#ffffff',    // cards / panels
    },
    text: {
      primary: '#2E3A3A',  // gris azulado oscuro
      secondary: '#5C6B6B',
    },
    error: {
      main: '#FFB3B3',
    },
    warning: {
      main: '#FFD580',
    },
    success: {
      main: '#B5EAD7',
    },
    info: {
      main: '#B3E5FC',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h1: { fontWeight: 600, fontSize: '2rem', color: '#2E3A3A' },
    h2: { fontWeight: 500, fontSize: '1.5rem', color: '#2E3A3A' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 12, // amigable
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#2E3A3A',
          boxShadow: 'none',
          borderBottom: '1px solid #E5E7EB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          padding: '6px 16px',
          '&:hover': {
            boxShadow: 'none',
            opacity: 0.9,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #E5E7EB',
        },
      },
    },
  },
});

export default theme;
