import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Navigation, CheckCircle, LogOut, PackageCheck, AlertCircle, XCircle, History, RotateCcw, Banknote, Map as MapIcon, MessageCircle, ChevronRight, Send } from 'lucide-react';

import { orderService } from '../../services/order.service';
import { userService } from '../../services/user.service';
import { messageService } from '../../services/message.service';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const deliveredIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const FARM_LOCATION = { lat: 47.7288, lng: 26.1950 };

const MapResizer = ({ dependency }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 200);
  }, [dependency, map]);
  return null;
};

const CenterMapOnDriver = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 14);
  }, [coords, map]);
  return null;
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
}

export default function DriverView({ onLogout, user }) {
  const [route, setRoute] = useState([]);
  const [tab, setTab] = useState('pending'); 
  const [calculating, setCalculating] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);
  
  const [myLocation, setMyLocation] = useState(null);

  // ================= CHAT =================
  const [conversations, setConversations] = useState([]);
  const [selectedUserChat, setSelectedUserChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newDriverMessage, setNewDriverMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, tab]);

  useEffect(() => {
    loadTodayRoute();

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setMyLocation({ lat: latitude, lng: longitude });
          try { await userService.updateLocation(latitude, longitude); } catch (e) {}
        },
        async (err) => {
          console.warn("Eroare GPS (Probabil ești pe laptop). Folosim locația fermei de test.");
          setMyLocation(FARM_LOCATION);
          try { await userService.updateLocation(FARM_LOCATION.lat, FARM_LOCATION.lng); } catch (e) {}
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setMyLocation(FARM_LOCATION);
    }
  }, []);

  // Polling pt Chat Șofer
  useEffect(() => {
    let interval;
    if (tab === 'chat') {
      const fetchConvos = async () => setConversations(await messageService.getDriverConversations());
      fetchConvos();
      interval = setInterval(async () => {
        fetchConvos();
        if (selectedUserChat) {
          setChatMessages(await messageService.getChatBetweenUsers(selectedUserChat.id));
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [tab, selectedUserChat]);

  const loadTodayRoute = async () => {
    try {
      const orders = await orderService.getDriverToday();
      setRoute(orders);
    } catch (err) { console.error("Eroare încărcare rută", err); }
  };

  const pendingOrders = route.filter(r => ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(r.status));
  const historyOrders = route.filter(r => ['DELIVERED', 'UNDELIVERED', 'CANCELLED'].includes(r.status));
  const progress = route.length > 0 ? (historyOrders.length / route.length) * 100 : 0;

  const nextStop = pendingOrders.length > 0 ? pendingOrders[0] : null;

  const calculateRoute = () => {
    if (!myLocation) return alert("Așteptăm semnalul GPS...");
    setCalculating(true);
    setTimeout(() => {
      let unvisited = [...route].filter(r => ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(r.status));
      let currentLoc = myLocation;
      let optimizedRoute = [];

      while(unvisited.length > 0) {
        let closestIdx = 0; let minDistance = Infinity;
        for(let i=0; i<unvisited.length; i++) {
          if(!unvisited[i].client.lat || !unvisited[i].client.lng) continue;
          const dist = getDistanceFromLatLonInKm(currentLoc.lat, currentLoc.lng, unvisited[i].client.lat, unvisited[i].client.lng);
          if(dist < minDistance) { minDistance = dist; closestIdx = i; }
        }
        const nextTarget = unvisited.splice(closestIdx, 1)[0];
        optimizedRoute.push(nextTarget);
        if(nextTarget.client.lat) currentLoc = { lat: nextTarget.client.lat, lng: nextTarget.client.lng };
      }

      const noCoordsOrders = route.filter(r => !r.client.lat || !r.client.lng);
      setRoute([...optimizedRoute, ...noCoordsOrders, ...historyOrders]);
      setRouteOptimized(true);
      setCalculating(false);
    }, 1000);
  };

  const changeOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      setRoute(route.map(item => item.id === orderId ? { ...item, status: newStatus } : item));
    } catch (err) { alert("Eroare"); }
  };

  const markAsPaid = async (orderId) => {
    try {
      await orderService.updatePaymentStatus(orderId, 'PAID');
      setRoute(route.map(item => item.id === orderId ? { ...item, paymentStatus: 'PAID' } : item));
    } catch (err) { alert("Eroare"); }
  };

  const openGoogleMaps = (lat, lng) => {
    if (!myLocation) return alert("Nu avem semnal GPS!");
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  // ================= HARDWARE BACK BUTTON (ANDROID) =================
  const stateRef = useRef({ tab, selectedUserChat });
  useEffect(() => {
    stateRef.current = { tab, selectedUserChat };
  });

  useEffect(() => {
    let listener;
    const addBackListener = async () => {
      try {
        const { App: CapacitorApp } = await import('@capacitor/app');
        listener = await CapacitorApp.addListener('backButton', () => {
          const s = stateRef.current;
          if (s.selectedUserChat && s.tab === 'chat') {
            setSelectedUserChat(null);
          } else if (s.tab !== 'map') {
            setTab('map');
          } else {
            CapacitorApp.exitApp();
          }
        });
      } catch (e) {}
    };
    addBackListener();
    return () => {
      if (listener) listener.remove();
    };
  }, []);

  // Chat Actions
  const openConversation = async (u) => {
    setSelectedUserChat(u);
    setChatMessages(await messageService.getChatBetweenUsers(u.id));
    await messageService.markAsRead(u.id);
    scrollToBottom();
  };

  const handleSendDriverMessage = async (e) => {
    e.preventDefault();
    if (!newDriverMessage.trim() || !selectedUserChat) return;
    try {
      const receiverId = selectedUserChat.role === 'ADMIN' ? null : selectedUserChat.id;
      await messageService.sendMessage(newDriverMessage, receiverId);
      setNewDriverMessage('');
      setChatMessages(await messageService.getChatBetweenUsers(selectedUserChat.id));
      scrollToBottom();
    } catch (err) { alert('Eroare'); }
  };

  return (
    <div className="h-[100dvh] md:h-screen bg-slate-100 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* HEADER (Ascuns dacă e deschis chat-ul pe mobil) */}
      <header className={`md:hidden ${tab === 'chat' ? 'hidden' : 'block'} bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-lg`}>
        <h1 className="text-lg font-bold flex items-center"><Truck className="mr-2 text-blue-400"/> Livrări Azi</h1>
        <div className="flex justify-between text-xs mt-2 text-slate-300"><span>Rămase: {pendingOrders.length}</span><span>Gata: {historyOrders.length}/{route.length}</span></div>
        <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div></div>
      </header>

      {/* MOBILE TABS (Ascuns dacă e deschis chat-ul pe mobil) */}
      <div className={`md:hidden ${tab === 'chat' ? 'hidden' : 'flex'} bg-slate-900 px-2 pt-2 text-sm z-20 relative border-t border-slate-800 shadow-md`}>
        <button onClick={()=>setTab('map')} className={`flex-1 pb-3 text-center font-bold transition-colors ${tab==='map'?'text-white border-b-2 border-blue-500':'text-slate-400'}`}>🗺️ Hartă</button>
        <button onClick={()=>setTab('pending')} className={`flex-1 pb-3 text-center font-bold transition-colors ${tab==='pending'?'text-white border-b-2 border-blue-500':'text-slate-400'}`}>📋 De livrat</button>
        <button onClick={()=>setTab('chat')} className={`flex-1 pb-3 text-center font-bold transition-colors ${tab==='chat'?'text-white border-b-2 border-blue-500':'text-slate-400'}`}>💬 Mesaje</button>
        <button onClick={()=>setTab('history')} className={`flex-1 pb-3 text-center font-bold transition-colors ${tab==='history'?'text-white border-b-2 border-blue-500':'text-slate-400'}`}>🕰️ Istoric</button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-white min-h-screen p-6 flex-col sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3 mb-10"><div className="bg-blue-600 p-2 rounded-xl"><Truck className="h-6 w-6" /></div><div><h1 className="text-xl font-bold">Agape Livrări</h1><p className="text-sm text-slate-400">Șofer: {user.firstName}</p></div></div>
        <div className="bg-slate-800 p-4 rounded-xl mb-8 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Progres Tură</h3>
          <div className="flex justify-between text-lg font-bold mb-2">
            <span className="text-blue-400">{historyOrders.length}</span>
            <span className="text-slate-500">din {route.length}</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
          </div>
        </div>
        
        <nav className="flex flex-col space-y-2 flex-1">
          <button onClick={() => setTab('map')} className={`p-3 rounded-lg text-sm text-left transition ${tab==='map'?'bg-slate-800 text-blue-400':'hover:bg-slate-800'}`}>🗺️ Harta Live</button>
          <button onClick={() => setTab('pending')} className={`p-3 rounded-lg text-sm text-left transition ${tab==='pending'?'bg-slate-800 text-blue-400':'hover:bg-slate-800'}`}>📋 De Livrat</button>
          <button onClick={() => setTab('history')} className={`p-3 rounded-lg text-sm text-left transition ${tab==='history'?'bg-slate-800 text-blue-400':'hover:bg-slate-800'}`}>🕰️ Istoric Azi</button>
          <button onClick={() => setTab('chat')} className={`p-3 rounded-lg text-sm text-left transition ${tab==='chat'?'bg-slate-800 text-blue-400':'hover:bg-slate-800'}`}>💬 Mesaje</button>
        </nav>

        <button onClick={onLogout} className="mt-auto flex items-center justify-center p-4 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl font-bold transition"><LogOut className="w-5 h-5 mr-2" /> Ieși din tură</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col w-full relative ${tab === 'chat' ? 'p-0 overflow-hidden' : 'p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto'}`}>
        
        <div className={tab === 'chat' ? 'h-full w-full max-w-7xl mx-auto flex flex-col md:p-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 h-full max-w-7xl mx-auto'}>
          
          {/* ===================== VIEW: CHAT ===================== */}
          {tab === 'chat' && (
            <div className="bg-white md:rounded-2xl shadow-sm border overflow-hidden flex flex-col md:flex-row h-full">
              
              {/* SIDEBAR CONVERSAȚII ȘOFER */}
              <div className={`w-full md:w-1/3 bg-slate-50 border-r border-slate-200 flex-1 flex flex-col ${selectedUserChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="flex items-center mb-3 md:hidden">
                    <button onClick={() => setTab('pending')} className="text-blue-600 font-bold text-sm flex items-center hover:underline bg-blue-50 px-3 py-1.5 rounded-lg transition">
                      <ChevronRight className="w-4 h-4 rotate-180 mr-1"/> Înapoi la Rută
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-800">Conversații</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(conv => (
                    <div key={conv.user.id} onClick={() => openConversation(conv.user)} className={`p-4 border-b border-slate-100 cursor-pointer transition ${selectedUserChat?.id === conv.user.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm text-slate-800">
                          {conv.user.firstName} {conv.user.lastName}
                          {conv.user.role === 'ADMIN' && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">FERMA</span>}
                        </h4>
                        <span className="text-[10px] text-slate-400">{new Date(conv.lastMessage.createdAt).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-xs truncate max-w-[200px] ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{conv.lastMessage.content}</p>
                        {conv.unreadCount > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FEREASTRA DE CHAT ȘOFER */}
              <div className={`w-full md:w-2/3 bg-white flex-1 flex flex-col ${!selectedUserChat ? 'hidden md:flex' : 'flex'}`}>
                {!selectedUserChat ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><MessageCircle className="w-16 h-16 mb-4 opacity-30" /><p className="font-medium text-lg">Selectează o conversație</p></div>
                ) : (
                  <>
                    <div className="p-4 bg-slate-900 text-white flex items-center gap-3 shadow-sm z-10 md:rounded-tr-2xl">
                      <button onClick={() => setSelectedUserChat(null)} className="md:hidden p-2 -ml-2 text-slate-300 hover:bg-slate-700 rounded-full transition flex items-center text-sm font-bold"><ChevronRight className="w-5 h-5 rotate-180 mr-1"/> Înapoi</button>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">{selectedUserChat.firstName.charAt(0)}</div>
                      <div>
                        <h3 className="font-bold leading-tight">{selectedUserChat.firstName} {selectedUserChat.lastName}</h3>
                        <p className="text-xs text-slate-300">{selectedUserChat.role === 'ADMIN' ? 'Suport Tehnic (Ferma Agape)' : 'Client pe ruta de azi'}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 bg-slate-50 overflow-y-auto flex flex-col gap-3">
                      {chatMessages.map(msg => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none'}`}>
                            <p className="text-sm font-medium">{msg.content}</p>
                            <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-200 text-right' : 'text-slate-400'}`}>{new Date(msg.createdAt).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendDriverMessage} className="p-3 bg-white border-t flex gap-2 md:rounded-br-2xl">
                      <input type="text" value={newDriverMessage} onChange={e=>setNewDriverMessage(e.target.value)} onFocus={() => setTimeout(scrollToBottom, 300)} placeholder="Scrie un mesaj..." className="flex-1 border-2 border-slate-200 rounded-full px-4 py-2 outline-none focus:border-blue-500 bg-slate-50 font-medium text-sm transition" />
                      <button type="submit" disabled={!newDriverMessage.trim()} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-md disabled:opacity-50"><Send className="w-5 h-5"/></button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ===================== VIEW: HARTĂ & LISTĂ (ASCUNS CÂND E PE CHAT) ===================== */}
          {tab !== 'chat' && (
            <>
              {/* COLOANA HARTĂ */}
              <div className={`${tab === 'map' ? 'block' : 'hidden'} lg:block flex flex-col h-full space-y-4`}>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Ruta optimă de azi</label>
                  <button onClick={calculateRoute} disabled={pendingOrders.length === 0} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex justify-center items-center hover:bg-blue-700 transition shadow-md disabled:opacity-50">
                    {calculating ? 'Se calculează ruta...' : <><Navigation className="w-5 h-5 mr-2"/> Calculează Traseul</>}
                  </button>
                </div>

                <div className="relative flex-1 min-h-[400px] md:min-h-[500px] w-full border-2 border-slate-300 rounded-2xl overflow-hidden shadow-inner" style={{ height: '100%' }}>
                  <MapContainer center={[47.6514, 26.2556]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    <MapResizer dependency={tab} />

                    {myLocation && (
                      <>
                        <CenterMapOnDriver coords={myLocation} />
                        <Marker position={[myLocation.lat, myLocation.lng]} icon={truckIcon}>
                          <Popup><strong>Locația ta</strong></Popup>
                        </Marker>
                      </>
                    )}

                    {myLocation && nextStop && nextStop.client.lat && (
                      <Polyline positions={[[myLocation.lat, myLocation.lng], [nextStop.client.lat, nextStop.client.lng]]} color="#2563eb" weight={5} dashArray="5, 10" />
                    )}

                    {route.map((r, index) => {
                      if (!r.client.lat || !r.client.lng) return null;
                      const isDelivered = r.status === 'DELIVERED';
                      const stopNumber = (routeOptimized && !isDelivered) ? pendingOrders.findIndex(p => p.id === r.id) + 1 : '';
                      
                      return (
                        <Marker key={r.id} position={[r.client.lat, r.client.lng]} icon={isDelivered ? deliveredIcon : new L.Icon.Default()}>
                          <Popup>
                            <strong>{stopNumber ? `${stopNumber}. ` : ''}{r.client.firstName}</strong><br/>
                            {r.client.address}<br/>
                            <span className={`text-xs font-bold ${isDelivered ? 'text-green-600' : 'text-orange-600'}`}>{isDelivered ? 'Livrat' : 'De livrat'}</span>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>

              {/* COLOANA LISTĂ & ISTORIC */}
              <div className={`${tab === 'pending' || tab === 'history' ? 'block' : 'hidden'} lg:block flex flex-col h-full`}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                  
                  <div className="hidden lg:flex border-b border-slate-100 bg-slate-50">
                    <button onClick={() => setTab('pending')} className={`flex-1 p-4 text-center font-bold transition-colors ${tab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>De Livrat ({pendingOrders.length})</button>
                    <button onClick={() => setTab('history')} className={`flex-1 p-4 text-center font-bold transition-colors ${tab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>Istoric Azi ({historyOrders.length})</button>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                    {tab === 'pending' && (
                      <>
                        {route.length === 0 && <div className="text-center text-slate-500 py-10"><AlertCircle className="w-12 h-12 text-slate-300 mb-3 mx-auto" /><p>Nicio comandă pentru ziua de azi!</p></div>}
                        {pendingOrders.length === 0 && route.length > 0 && <div className="text-center text-slate-500 py-10"><PackageCheck className="w-16 h-16 text-emerald-400 mb-4 opacity-50 mx-auto" /><p className="font-bold text-lg text-slate-700">Toate livrările au fost efectuate!</p></div>}
                        
                        {pendingOrders.map((r, idx) => (
                          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-bold text-lg text-slate-800">
                                {routeOptimized && <span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-xs mr-2">{idx + 1}</span>}
                                {r.client.firstName} {r.client.lastName}
                              </h3>
                              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${r.paymentMethod === 'CARD' ? (r.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800') : (r.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800')}`}>
                                {r.paymentMethod} {r.paymentStatus === 'PAID' ? '✅ Achitat' : '❌ NEACHITAT'}
                              </span>
                            </div>
                            
                            <p className="text-slate-600 flex items-center mb-2 text-sm font-medium"><MapPin className="h-4 w-4 mr-2 text-slate-400"/> {r.client.address}</p>
                            <p className="text-slate-500 flex items-center mb-4 text-xs font-medium">📞 {r.client.phone}</p>

                            {!r.client.lat && <p className="text-xs text-red-500 mb-2 font-bold">⚠ Lipsă coordonate GPS.</p>}
                            {r.client.internalNotes && <div className="bg-orange-50 text-orange-800 p-2 rounded-lg text-xs font-bold mb-4">⚠ Notiță: {r.client.internalNotes}</div>}

                            <div className="bg-slate-50 p-3 rounded-lg mb-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">De lăsat:</p>
                              <ul className="text-sm font-medium text-slate-700">
                                {r.items.map(item => (
                                  <li key={item.id} className="flex gap-2 mb-1"><span className="font-bold text-blue-600">{item.quantity}x</span> {item.product.name}</li>
                                ))}
                              </ul>
                            </div>

                            {r.paymentMethod === 'CASH' && r.paymentStatus !== 'PAID' && (
                              <button onClick={() => markAsPaid(r.id)} className="w-full mb-3 bg-orange-100 text-orange-700 py-2 rounded-xl text-sm font-bold flex justify-center items-center hover:bg-orange-200 transition">
                                <Banknote className="w-5 h-5 mr-2" /> Încasează Cash: {r.totalAmount} Lei
                              </button>
                            )}

                            <div className="flex gap-2 mb-3">
                              <button onClick={() => openGoogleMaps(r.client.lat, r.client.lng)} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold flex justify-center items-center hover:bg-slate-200 transition shadow-sm">
                                <Navigation className="w-5 h-5 mr-2" /> Navighează
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => changeOrderStatus(r.id, 'DELIVERED')} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold flex justify-center items-center hover:bg-green-700 transition shadow-sm"><CheckCircle className="w-5 h-5 mr-1"/> Livrat</button>
                              <button onClick={() => changeOrderStatus(r.id, 'UNDELIVERED')} className="flex-1 bg-white border-2 border-red-500 text-red-600 py-3 rounded-xl text-sm font-bold flex justify-center items-center hover:bg-red-50 transition shadow-sm"><XCircle className="w-5 h-5 mr-1"/> Lipsă</button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {tab === 'history' && (
                      <>
                        {historyOrders.length === 0 && <div className="text-center text-slate-500 py-10"><History className="w-12 h-12 text-slate-300 mb-3 mx-auto" /><p>Încă nu ai finalizat nicio livrare azi.</p></div>}
                        {historyOrders.map(r => (
                          <div key={r.id} className={`bg-white rounded-xl shadow-sm border p-5 ${r.status === 'DELIVERED' ? 'border-green-200' : 'border-red-200'}`}>
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-bold text-lg text-slate-800">{r.client.firstName} {r.client.lastName}</h3>
                              <span className={`text-xs font-bold px-3 py-1 rounded-md ${r.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status === 'DELIVERED' ? 'LIVRAT SUCCES' : 'NELIVRAT / LIPSĂ'}</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-4"><MapPin className="h-4 w-4 inline mr-1 text-slate-400"/> {r.client.address}</p>
                            <div className="border-t pt-3 flex justify-between items-center mt-2">
                              <span className="text-xs font-bold text-slate-500">Total: {r.totalAmount} Lei <br/><span className={`font-medium ${r.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-500'}`}>({r.paymentMethod} {r.paymentStatus === 'PAID' ? '- ACHITAT' : '- RESTANȚĂ'})</span></span>
                              <button onClick={() => changeOrderStatus(r.id, 'DELIVERING')} className="text-blue-600 font-bold text-sm flex items-center hover:underline bg-blue-50 px-3 py-1.5 rounded-lg"><RotateCcw className="w-4 h-4 mr-1"/> Anulează</button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* MOBILE BOTTOM NAV - Doar logout pt Șofer (navigarea din taburi sus e de ajuns pt restul) */}
      <nav className={`${tab === 'chat' ? 'hidden' : 'flex'} md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around py-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`}>
        <button onClick={onLogout} className="text-red-500 font-bold text-sm flex items-center w-full justify-center">
          <LogOut className="w-5 h-5 mr-2"/> Ieși din tură
        </button>
      </nav>
    </div>
  );
}