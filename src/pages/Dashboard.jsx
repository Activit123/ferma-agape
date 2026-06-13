import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminView from '../components/dashboard/AdminView';
import ClientView from '../components/dashboard/ClientView';
import DriverView from '../components/dashboard/DriverView';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4eee6] text-slate-900">
        Se încarcă...
      </div>
    );
  }

  const role = (user.role || 'CLIENT').toUpperCase();

  // Redirecționăm către interfața specifică fiecărui rol
  if (role === 'ADMIN') return <AdminView onLogout={handleLogout} user={user} />;
  if (role === 'DRIVER') return <DriverView onLogout={handleLogout} user={user} />;
  
  // Default fallback pentru clienți
  return <ClientView onLogout={handleLogout} user={user} />;
}