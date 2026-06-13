import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<RedirectIfAuth><Auth type="login" /></RedirectIfAuth>} />
        <Route path="/register" element={<RedirectIfAuth><Auth type="register" /></RedirectIfAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}