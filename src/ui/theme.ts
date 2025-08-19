import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    secondary: { main: '#64748B' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: [
      'Inter',
      'Pretendard',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'Noto Sans',
      'sans-serif',
    ].join(','),
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: { defaultProps: { color: 'transparent', elevation: 0 } },
    MuiPaper: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiButton: {
      defaultProps: { variant: 'contained', size: 'small', color: 'primary' },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTabs: { styleOverrides: { root: { minHeight: 44 } } },
    MuiTab: { styleOverrides: { root: { minHeight: 44 } } },
    MuiContainer: { defaultProps: { maxWidth: 'md' } },
  },
})

export default theme

