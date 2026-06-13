import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pentru iconițele de Leaflet care nu se încarcă by default în React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

export default function Auth({ type }) {
  const navigate = useNavigate();
  const isLogin = type === 'login';
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', password: '', address: '', specialNotes: '',
    lat: null, lng: null // Noi stări pentru coordonate
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Componentă internă Leaflet pentru a capta click-ul pe hartă
  const LocationSelector = () => {
    useMapEvents({
      click(e) {
        setFormData({ ...formData, lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return formData.lat && formData.lng ? <Marker position={[formData.lat, formData.lng]} /> : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && (!formData.lat || !formData.lng)) {
      setError('Te rugăm să pui marcajul pe hartă la locația ta de livrare!');
      return;
    }

    setLoading(true);
    const url = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'A apărut o eroare.');

      if (isLogin) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        alert('Cont creat cu succes! Te poți autentifica acum.');
        navigate('/login');
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f4eee6] flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white shadow-xl p-8 sm:p-10">
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <div className="flex items-center justify-center h-14 w-14 rounded-3xl bg-emerald-700 text-white"><Leaf className="h-7 w-7" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">{isLogin ? 'Bine ai revenit' : 'Devino Client'}</h1>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">{isLogin ? 'Autentifică-te pentru a-ți configura abonamentul și comenzile.' : 'Completează datele pentru a avea acces imediat la aplicație.'}</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700 font-semibold">Prenume <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-2xl border p-3 outline-none focus:border-emerald-500" required /></label>
              <label className="space-y-2 text-sm text-slate-700 font-semibold">Nume <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-2xl border p-3 outline-none focus:border-emerald-500" required /></label>
            </div>
          )}

          <div className={`grid gap-4 ${isLogin ? '' : 'md:grid-cols-2'}`}>
            <label className="space-y-2 text-sm text-slate-700 font-semibold">Telefon <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-2xl border p-3 outline-none focus:border-emerald-500" required /></label>
            <label className="space-y-2 text-sm text-slate-700 font-semibold">Parolă <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-2xl border p-3 outline-none focus:border-emerald-500" required /></label>
          </div>

          {!isLogin && (
            <div className="space-y-4">
              <label className="space-y-2 text-sm text-slate-700 font-semibold">Adresă de livrare (Text) <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Ex: Pătrăuți, Strada Principală nr 10" className="w-full rounded-2xl border p-3 outline-none focus:border-emerald-500" required /></label>
              
              <label className="space-y-2 text-sm text-slate-700 font-semibold block">Locație exactă pe hartă (Dă click pentru a plasa pionul!)</label>
              <div className="h-64 w-full rounded-2xl border-2 border-emerald-200 overflow-hidden relative">
                <MapContainer center={[47.6514, 26.2556]} zoom={11} scrollWheelZoom={true} className="h-full w-full z-10">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <LocationSelector />
                </MapContainer>
              </div>

              <label className="space-y-2 text-sm text-slate-700 font-semibold mt-4 block">Observații speciale <textarea name="specialNotes" value={formData.specialNotes} onChange={handleChange} rows="2" className="w-full rounded-2xl border p-3 outline-none focus:border-emerald-500" /></label>
            </div>
          )}

          {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-full bg-emerald-700 px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-emerald-800 transition disabled:opacity-70">
            {loading ? 'Se procesează...' : isLogin ? 'Intră în cont' : 'Creează contul'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? <><span>Nu ai cont? </span><Link to="/register" className="font-semibold text-emerald-700 hover:underline">Înregistrează-te</Link></> : <><span>Ai deja cont? </span><Link to="/login" className="font-semibold text-emerald-700 hover:underline">Loghează-te</Link></>}
        </div>
      </div>
    </div>
  );
}