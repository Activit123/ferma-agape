import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminView from '../components/dashboard/AdminView';
import ClientView from '../components/dashboard/ClientView';
import DriverView from '../components/dashboard/DriverView';
import { apiRequest } from '../config/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // Verificăm dacă browserul suportă notificări
      if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        if (Notification.permission === 'default') {
          // Dacă nu am cerut încă permisiunea, afișăm banner-ul utilizatorului
          setShowNotificationPrompt(true);
        } else if (Notification.permission === 'granted') {
          // Dacă ne-a dat deja permisiunea în trecut, îl abonăm silențios
          subscribeToPush();
        }
      }

    } catch (error) {
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Funcția care face legătura cu serverul de push
  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // CHEIA PUBLICĂ VAPID DIN BACKEND (.env):
      const publicVapidKey = 'BIdqac0OvRiMvFi2AyANqqtphecQxbvFrf1QQ0bMB_E09qQIsdYY__xYVqMTj_sPvcDZE7FYpxrSv7w7wmFE3IM';

      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      await apiRequest('/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription.toJSON())
      });
      console.log('✅ Abonat cu succes la notificări Push!');
    } catch (err) {
      console.error('Eroare la abonarea pentru notificări:', err);
    }
  };

  // Această funcție se apelează DOAR când utilizatorul dă click pe butonul din banner
  const handleEnableNotifications = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPush();
      setShowNotificationPrompt(false);
    } else {
      setShowNotificationPrompt(false); // Dacă refuză, ascundem banner-ul oricum
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4eee6] text-slate-900">Se încarcă...</div>;
  }

  const role = (user.role || 'CLIENT').toUpperCase();

  return (
    <>
      {/* BANNER NOTIFICĂRI (Apare doar dacă permisiunea e "default") */}
      {showNotificationPrompt && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-10 md:left-auto md:right-10 md:w-96 bg-emerald-900 text-white p-5 rounded-3xl z-[9999] shadow-2xl animate-fade-in border border-emerald-700">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-800 p-2 rounded-full shadow-inner">
                <span className="text-xl">🔔</span>
              </div>
              <h3 className="font-bold text-base">Notificări Live</h3>
            </div>
            <button onClick={() => setShowNotificationPrompt(false)} className="text-emerald-400 hover:text-white transition p-1">
              ✕
            </button>
          </div>
          <p className="text-sm text-emerald-100 mb-5 leading-relaxed">Rămâi la curent cu livrările, starea abonamentului și mesajele noi, direct pe ecranul tău.</p>
          <div className="flex gap-3">
            <button onClick={handleEnableNotifications} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-lg text-center">
              Activează acum
            </button>
          </div>
        </div>
      )}

      {/* COMPONENTELE NORMALE */}
      {role === 'ADMIN' ? (
        <AdminView onLogout={handleLogout} user={user} />
      ) : role === 'DRIVER' ? (
        <DriverView onLogout={handleLogout} user={user} />
      ) : (
        <ClientView onLogout={handleLogout} user={user} />
      )}
    </>
  );
}