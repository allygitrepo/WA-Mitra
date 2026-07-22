import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Lenis from 'lenis';
import useAuthStore from './store/useAuthStore';
import useThemeStore from './store/useThemeStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import VerifyOtpPage from './pages/Auth/VerifyOtpPage';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import Overview from './pages/Dashboard/Overview';
import Instances from './pages/Dashboard/Instances';
import Settings from './pages/Dashboard/Settings';
import SendMessage from './pages/Dashboard/Messaging/SendMessage';
import Tokens from './pages/Dashboard/Tokens/Tokens';
import Docs from './pages/Dashboard/Docs';
import Reports from './pages/Dashboard/Reports';
import UserPlans from './pages/Dashboard/Plans';
import SelectPlan from './pages/Dashboard/SelectPlan';
import AutoReplies from './pages/Dashboard/AutoReplies';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminUsers from './pages/Admin/Users';
import AdminPackages from './pages/Admin/Packages';
import AdminOverview from './pages/Admin/Overview';
import CreateAdmin from './pages/Admin/CreateAdmin';
import AdminPayments from './pages/Admin/Payments';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [initTheme]);

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#00a884',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} 
        />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        <Route path="/docs" element={<Docs />} />

        {/* Plan Selection Route (Mandatory for users without plan) */}
        <Route 
          path="/select-plan" 
          element={
            isAuthenticated ? (
              user?.packageId ? <Navigate to="/dashboard" /> : <SelectPlan />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              user?.role === 'user' && !user?.packageId ? (
                <Navigate to="/select-plan" />
              ) : (
                <DashboardLayout />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={user?.role === 'admin' ? <Navigate to="/admin" /> : <Overview />} />
          <Route path="instances" element={<Instances />} />
          <Route path="messaging" element={<SendMessage />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="docs" element={<Docs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="plans" element={<UserPlans />} />
          <Route path="auto-replies" element={<AutoReplies />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={isAuthenticated && user?.role === 'admin' ? <AdminLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="create-admin" element={<CreateAdmin />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
