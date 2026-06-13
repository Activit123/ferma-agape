import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function getSavedUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function RequireAuth({ children }) {
  const user = getSavedUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RedirectIfAuth({ children }) {
  const user = getSavedUser();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-emerald-700 font-serif font-bold text-2xl animate-pulse"><img src="/logo.png" className="w-20 h-20 mb-4 opacity-50" alt="Loading" />Se încarcă Ferma Agape...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<RedirectIfAuth><Auth type="login" /></RedirectIfAuth>} />
          <Route path="/register" element={<RedirectIfAuth><Auth type="register" /></RedirectIfAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}