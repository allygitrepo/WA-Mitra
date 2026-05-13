import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const { isAuthenticated } = useAuthStore();
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
  }, []);

  return (
    <Router>
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

        {/* Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<Overview />} />
          <Route path="instances" element={<Instances />} />
          <Route path="messaging" element={<SendMessage />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="docs" element={<Docs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
