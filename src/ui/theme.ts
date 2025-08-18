import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4F46E5' },
    secondary: { main: '#06B6D4' },
    background: { default: '#f7f7fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 10 },
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
    MuiAppBar: { defaultProps: { color: 'primary', elevation: 1 } },
    MuiPaper: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiButton: { defaultProps: { variant: 'contained', size: 'small' } },
    MuiTabs: { styleOverrides: { root: { minHeight: 44 } } },
    MuiTab: { styleOverrides: { root: { minHeight: 44 } } },
    MuiContainer: { defaultProps: { maxWidth: 'md' } },
  },
})

export default theme

