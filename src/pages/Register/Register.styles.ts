import { Theme } from '@mui/material/styles';

export const registerStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '2rem 0',
  },
  paper: {
    padding: '2rem',
    width: '100%',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1976d2',
  },
  logoBox: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  logo: {
    width: '150px',
    height: 'auto',
  },
  button: {
    marginTop: '1rem',
    padding: '10px',
    backgroundColor: '#1976d2',
    '&:hover': {
      backgroundColor: '#1565c0',
    },
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: '0.5rem',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
  },
  addressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  errorMessage: {
    color: '#d32f2f',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
  },
  progressBar: {
    width: '100%',
    marginBottom: '2rem',
  },
}; 