import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './auth/context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ChatWidget from './features/chat/components/ChatWidget';
import { useAuth } from './auth/hooks/useAuth';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <AppRoutes />
      {isAuthenticated && <ChatWidget />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
