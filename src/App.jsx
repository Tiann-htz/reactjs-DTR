import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DtrPage from './pages/DtrPage';
import { useState } from 'react';

function AppRoutes() {
  const { student } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (!student) return <LoginPage />;
  if (page === 'dtr') return <DtrPage onNavigate={setPage} />;
  return <DashboardPage onNavigate={setPage} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}