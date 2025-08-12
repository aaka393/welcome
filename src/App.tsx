import { useEffect, memo } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useThemeStore } from './stores/useThemeStore';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { MemberDashboard } from './pages/MemberDashboard';
import { ScorerDashboard } from './pages/ScorerDashboard';
import { LeaderboardManagement } from './components/LeaderboardManagement';
import { Layout } from './components/Layout';
import { Toast } from './components/Toast';
import { TokenVerifier } from './components/TokenVerifier';

// Memoize the dashboards to prevent unnecessary re-renders
const MemoizedAdminDashboard = memo(AdminDashboard);
const MemoizedMemberDashboard = memo(MemberDashboard);
const MemoizedScorerDashboard = memo(ScorerDashboard);
const MemoizedLeaderboardManagement = memo(LeaderboardManagement);

function App() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!isAuthenticated) {
    return (
      <>
        <Layout>
          <div className="p-6">
            <MemoizedLeaderboardManagement />
          </div>
        </Layout>
        <Toast />
        {user && <TokenVerifier />}
      </>
    );
  }

  switch (user?.role) {
    case 'admin':
      return (
        <>
          <MemoizedAdminDashboard />
          <Toast />
          <TokenVerifier />
        </>
      );
    case 'member':
      return (
        <>
          <MemoizedMemberDashboard />
          <Toast />
          <TokenVerifier />
        </>
      );
    case 'scorer':
      return (
        <>
          <MemoizedScorerDashboard />
          <Toast />
          <TokenVerifier />
        </>
      );
    default:
      return (
        <>
          <LoginPage />
          <Toast />
        </>
      );
  }
}

export default App;