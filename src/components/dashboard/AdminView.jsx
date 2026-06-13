import React, { useState, useEffect, useRef } from 'react';
import { Leaf, Menu, Package, Users, ShoppingCart, Truck, DollarSign, MessageCircle, Settings, LogOut, Edit2, Trash2, X, CheckCircle, ShieldAlert, ClipboardList, Map as MapIcon, Search, Filter, Save, Download, CreditCard, ChevronRight, Send } from 'lucide-react';
import { productService } from '../../services/product.service';
import { userService } from '../../services/user.service';
import { orderService } from '../../services/order.service';
import { messageService } from '../../services/message.service';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- REZOLVARE BUG HARTĂ GRI ---
const MapResizer = ({ dependency }) => {
  const map = useMap();
  useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 200); }, [dependency, map]);
  return null;
};

// --- COMPONENTA PENTRU MODAL (POP-UP) ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-5 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const ORDER_STATUSES = {
  PENDING: 'Nouă (În așteptare)', CONFIRMED: 'Confirmată', PREPARING: 'În pregătire',
  DELIVERING: 'În livrare / La șofer', DELIVERED: 'Livrată / Ridicată',
  UNDELIVERED: 'Nelivrată', CANCELLED: 'Anulată', PAUSED: 'Pusă pe pauză'
};

export default function AdminView({ onLogout, user }) {
  const [view, setView] = useState('dash');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Stări pentru Date
  const [stats, setStats] = useState({ activeOrders: 0, cashToday: 0, cardToday: 0, milkLiters: 0 });
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]); 

  // ================= CHAT =================
  const [conversations, setConversations] = useState([]);
  const [selectedClientChat, setSelectedClientChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newAdminMessage, setNewAdminMessage] = useState('');
  
  const messagesEndRef = useRef(null); // Ref pentru Auto-Scroll

  // ================= FILTRE COMENZI =================
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');

  // ================= SETĂRI ADMIN =================
  const [adminSettings, setAdminSettings] = useState(() => {
    const saved = localStorage.getItem('adminSettings');
    return saved ? JSON.parse(saved) : { deliveryFee: 0, deliveryDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] };
  });

  // Stări Modale & Formulare
  const [isMapModalOpen, setMapModalOpen] = useState(false);
  
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', unit: '', description: '' });
  const [selectedFiles, setSelectedFiles] = useState(null);

  const [isClientModalOpen, setClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [clientForm, setClientForm] = useState({ firstName: '', lastName: '', phone: '', address: '', internalNotes: '', isActive: false });

  const [isDriverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [driverForm, setDriverForm] = useState({ firstName: '', lastName: '', phone: '', address: '', password: '', internalNotes: '' });

  // ================= FETCH DATE =================
  const loadProducts = async () => setProducts(await productService.getAll());
  const loadClients = async () => setClients(await userService.getClients());
  const loadDrivers = async () => setDrivers(await userService.getDrivers());
  const loadOrders = async () => {
    try {
      const data = await orderService.getAllAdmin();
      setOrders(data);
    } catch (err) { console.error("Eroare la încărcarea comenzilor:", err); }
  };

  // ================= HARDWARE BACK BUTTON (ANDROID) =================
  const stateRef = useRef({ view, selectedClientChat, isMapModalOpen, isProductModalOpen, isClientModalOpen, isDriverModalOpen });
  useEffect(() => {
    stateRef.current = { view, selectedClientChat, isMapModalOpen, isProductModalOpen, isClientModalOpen, isDriverModalOpen };
  });

  useEffect(() => {
    let listener;
    const addBackListener = async () => {
      try {
        const { App: CapacitorApp } = await import('@capacitor/app');
        listener = await CapacitorApp.addListener('backButton', () => {
          const s = stateRef.current;
          if (s.isMapModalOpen || s.isProductModalOpen || s.isClientModalOpen || s.isDriverModalOpen) {
            setMapModalOpen(false);
            setProductModalOpen(false);
            setClientModalOpen(false);
            setDriverModalOpen(false);
          } else if (s.selectedClientChat && s.view === 'chat') {
            setSelectedClientChat(null);
          } else if (s.view !== 'dash') {
            setView('dash');
          } else {
            CapacitorApp.exitApp();
          }
        });
      } catch(e) {}
    };
    addBackListener();
    return () => {
      if (listener) listener.remove();
    };
  }, []);
  
  // Scroll la mesaje noi pe Admin
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAssignRoutes = async () => {
    if (!window.confirm("Ești sigur? Aceasta va împărți (sau reîmpărți) manual toate abonamentele de azi șoferilor tăi activi!")) return;
    try {
      const res = await orderService.assignRoutes();
      const data = await res.json();
      alert(data.message || "Livrările au fost distribuite!");
      loadOrders();
    } catch (err) { alert("Eroare la distribuirea rutelor."); }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, view]);

  // Polling pentru Chat
  useEffect(() => {
    let interval;
    if (view === 'chat') {
      const fetchConvos = async () => setConversations(await messageService.getConversations());
      fetchConvos();
      
      interval = setInterval(async () => {
        fetchConvos();
        if (selectedClientChat) {
          setChatMessages(await messageService.getAdminChat(selectedClientChat.id));
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [view, selectedClientChat]);

  const openConversation = async (client) => {
    setSelectedClientChat(client);
    setChatMessages(await messageService.getAdminChat(client.id));
    await messageService.markAsRead(client.id);
    scrollToBottom();
  };

  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!newAdminMessage.trim() || !selectedClientChat) return;
    try {
      await messageService.sendMessage(newAdminMessage, selectedClientChat.id);
      setNewAdminMessage('');
      setChatMessages(await messageService.getAdminChat(selectedClientChat.id));
      scrollToBottom();
    } catch (err) { alert('Eroare trimitere mesaj'); }
  };

  useEffect(() => {
    if (view === 'dash') orderService.getAdminStats().then(setStats).catch(err => console.error('Eroare la încărcarea stats:', err));
    if (view === 'inventory') loadProducts();
    if (view === 'clients') loadClients();
    if (view === 'drivers') loadDrivers();
    if (view === 'orders' || view === 'finances') loadOrders();
  }, [view]);

  // ================= LOGICĂ COMENZI =================
  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = q === '' || o.orderNumber.toLowerCase().includes(q) || o.client.firstName.toLowerCase().includes(q) || o.client.lastName.toLowerCase().includes(q);
    const matchType = filterType === 'ALL' || o.type === filterType;
    const matchStatus = filterStatus === 'ALL' || o.status === filterStatus;
    const matchPayment = filterPayment === 'ALL' || o.paymentStatus === filterPayment;
    return matchSearch && matchType && matchStatus && matchPayment;
  });

  const handleOrderStatusChange = async (id, newStatus) => {
    try { await orderService.updateStatus(id, newStatus); loadOrders(); } 
    catch (err) { alert("Eroare la modificarea statusului comenzii."); }
  };

  // ================= LOGICĂ PRODUSE =================
  const openAddProduct = () => {
    setEditingProductId(null); setProductForm({ name: '', price: '', unit: '', description: '' });
    setSelectedFiles(null); setProductModalOpen(true);
  };
  const openEditProduct = (p) => {
    setEditingProductId(p.id); setProductForm({ name: p.name, price: p.price, unit: p.unit, description: p.description || '' });
    setSelectedFiles(null); setProductModalOpen(true);
  };
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', productForm.name); formData.append('price', productForm.price);
    formData.append('unit', productForm.unit); formData.append('description', productForm.description);
    if (selectedFiles) Array.from(selectedFiles).forEach(file => formData.append('images', file));
    try {
      if (editingProductId) await productService.update(editingProductId, formData);
      else await productService.create(formData);
      setProductModalOpen(false); loadProducts();
    } catch (err) { alert('Eroare la salvarea produsului'); }
  };
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest produs?')) return;
    try { await productService.delete(id); loadProducts(); } catch (err) { alert('Eroare la ștergere'); }
  };
  const toggleAvailability = async (id, currentStatus) => {
    await productService.toggleAvailability(id, currentStatus); loadProducts();
  };

  // ================= LOGICĂ CLIENȚI =================
  const handleApproveClient = async (id) => {
    try { await userService.approveClient(id); loadClients(); } catch (err) { alert('Eroare la aprobare'); }
  };
  const openEditClient = (c) => {
    setEditingClientId(c.id); setClientForm({ firstName: c.firstName, lastName: c.lastName, phone: c.phone, address: c.address, internalNotes: c.internalNotes || '', isActive: c.isActive });
    setClientModalOpen(true);
  };
  const handleSaveClient = async (e) => {
    e.preventDefault();
    try { await userService.update(editingClientId, clientForm); setClientModalOpen(false); loadClients(); } 
    catch (err) { alert('Eroare la editare client'); }
  };

  // ================= LOGICĂ ȘOFERI =================
  const openAddDriver = () => {
    setEditingDriverId(null); setDriverForm({ firstName: '', lastName: '', phone: '', address: '', password: '', internalNotes: '' });
    setDriverModalOpen(true);
  };
  const openEditDriver = (d) => {
    setEditingDriverId(d.id); setDriverForm({ firstName: d.firstName, lastName: d.lastName, phone: d.phone, address: d.address || '', password: '', internalNotes: d.internalNotes || '' });
    setDriverModalOpen(true);
  };
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      if (editingDriverId) {
        await userService.update(editingDriverId, {
          firstName: driverForm.firstName, lastName: driverForm.lastName, phone: driverForm.phone, address: driverForm.address, internalNotes: driverForm.internalNotes
        });
      } else {
        await userService.createDriver(driverForm);
      }
      setDriverModalOpen(false); loadDrivers();
    } catch (err) { alert('Eroare la salvarea șoferului'); }
  };

  // ================= COMUN =================
  const handleDeleteUser = async (id, role) => {
    if (!window.confirm(`Ești sigur că vrei să ștergi definitiv acest cont?`)) return;
    try { await userService.delete(id); role === 'CLIENT' ? loadClients() : loadDrivers(); } 
    catch (err) { alert('Eroare la ștergerea utilizatorului'); }
  };

  // ================= SETĂRI ADMIN =================
  const handleSaveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    alert('Setările au fost salvate cu succes!');
  };
  const toggleSettingsDay = (day) => {
    const days = adminSettings.deliveryDays;
    setAdminSettings({ ...adminSettings, deliveryDays: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
  };

  // ================= CALCUL FINANCIAR =================
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const totalIncomeCash = paidOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalIncomeCard = paidOrders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalIncomeAll = totalIncomeCash + totalIncomeCard;

  const exportToCSV = () => {
    const headers = ['Nr. Comanda', 'Client', 'Data Inregistrare', 'Tip', 'Metoda Plata', 'Suma (Lei)'];
    const rows = paidOrders.map(o => [
      o.orderNumber,
      `${o.client.firstName} ${o.client.lastName}`,
      new Date(o.createdAt).toLocaleDateString('ro-RO'),
      o.type === 'SUBSCRIPTION' ? 'Abonament' : 'Ridicare',
      o.paymentMethod,
      o.totalAmount
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `raport_incasari_agape_${new Date().toLocaleDateString('ro-RO')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[100dvh] md:h-screen bg-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-emerald-900 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
          <span className="text-lg font-bold">Admin Agape</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLogout} className="p-2 rounded-lg bg-emerald-800 hover:bg-red-600 transition text-white" title="Deconectare">
            <LogOut className="h-5 w-5" />
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 transition">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* SIDEBAR DESKTOP */}
      <aside className={`md:flex w-full md:w-64 bg-emerald-950 text-white md:min-h-screen p-4 flex-col justify-between ${isMenuOpen ? 'flex' : 'hidden'} shrink-0 z-20 md:sticky top-0 shadow-xl`}>
        <h2 className="text-xl font-bold text-emerald-500 mb-0 md:mb-8 hidden md:flex items-center"><img src="/logo.png" alt="Logo" className="h-6 w-6 mr-2 object-contain" /> Admin Agape</h2>
        <nav className="flex flex-col space-y-2 mt-4 md:mt-0">
          <button onClick={() => { setView('dash'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'dash' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Package className="w-5 h-5 mr-3" /> Dashboard</button>
          
          <button onClick={() => { setView('orders'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'orders' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><ClipboardList className="w-5 h-5 mr-3" /> Comenzi & Abonamente</button>
          
          <button onClick={() => { setView('inventory'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'inventory' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><ShoppingCart className="w-5 h-5 mr-3" /> Stocuri / Produse</button>
          
          <button onClick={() => { setView('clients'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'clients' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Users className="w-5 h-5 mr-3" /> Clienți</button>
          
          <button onClick={() => { setView('drivers'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'drivers' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Truck className="w-5 h-5 mr-3" /> Distribuitori</button>
          
          <button onClick={() => { setView('finances'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'finances' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><DollarSign className="w-5 h-5 mr-3" /> Financiar</button>
          <button onClick={() => { setView('chat'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'chat' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><MessageCircle className="w-5 h-5 mr-3" /> Mesaje</button>
          <button onClick={() => { setView('settings'); setIsMenuOpen(false); }} className={`flex items-center p-3 rounded-lg text-sm transition ${view === 'settings' ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Settings className="w-5 h-5 mr-3" /> Setări</button>
        </nav>
        <button onClick={onLogout} className="mt-auto flex items-center text-red-400 p-3 hover:bg-slate-800 rounded-lg transition"><LogOut className="w-5 h-5 mr-3" /> Ieșire</button>
      </aside>

      {/* CONTINUT PRINCIPAL */}
      <main className={`flex-1 flex flex-col w-full relative ${view === 'chat' ? 'p-0 overflow-hidden' : 'p-4 md:p-8 overflow-y-auto'}`}>
        
        {/* ===================== VIEW: DASHBOARD ===================== */}
        {view === 'dash' && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-gray-800">Rezumatul Zilei (Live)</h1>
              <button onClick={() => { setMapModalOpen(true); loadDrivers(); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition">
                <MapIcon className="w-4 h-4"/> Harta Live Șoferi
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10"><Package className="w-24 h-24 text-emerald-500" /></div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Necesar Lapte Azi</p>
                <p className="text-3xl font-extrabold text-emerald-700">{stats.milkLiters} L</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10"><Users className="w-24 h-24 text-blue-500" /></div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Comenzi Active</p>
                <p className="text-3xl font-extrabold text-blue-600">{stats.activeOrders}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10"><DollarSign className="w-24 h-24 text-orange-500" /></div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Încasări Cash (Azi)</p>
                <p className="text-3xl font-extrabold text-orange-600">{stats.cashToday} Lei</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10"><CreditCard className="w-24 h-24 text-green-500" /></div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Încasări Card (Azi)</p>
                <p className="text-3xl font-extrabold text-green-600">{stats.cardToday} Lei</p>
              </div>
            </div>

            <Modal isOpen={isMapModalOpen} onClose={() => setMapModalOpen(false)} title="Locația Șoferilor în Timp Real">
              <div className="h-[500px] w-full rounded-xl overflow-hidden border">
                <MapContainer center={[47.6514, 26.2556]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapResizer dependency={isMapModalOpen} />
                  {drivers.filter(d => d.lat && d.lng).map(d => (
                    <Marker key={d.id} position={[d.lat, d.lng]}>
                      <Popup><strong>{d.firstName} {d.lastName}</strong><br/>Șofer Activ</Popup>
                    </Marker>
                  ))}
                  {drivers.filter(d => d.lat && d.lng).length === 0 && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg font-bold text-red-600 text-sm">
                      Niciun șofer nu și-a activat GPS-ul încă!
                    </div>
                  )}
                </MapContainer>
              </div>
              <button onClick={() => loadDrivers()} className="w-full mt-4 bg-slate-100 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-200 transition">
                🔄 Reîmprospătează Locațiile
              </button>
            </Modal>
          </div>
        )}

        {/* ===================== VIEW: FINANCIAR ===================== */}
        {view === 'finances' && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-slate-800">Situație Financiară</h1>
              <button onClick={exportToCSV} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-700 transition shadow-sm flex items-center gap-2">
                <Download className="w-4 h-4"/> Descarcă Raport (CSV)
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left w-full md:w-auto">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Încasări (Toate timpurile)</p>
                <h2 className="text-4xl font-extrabold text-slate-900">{totalIncomeAll} <span className="text-2xl text-slate-500">Lei</span></h2>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none bg-blue-50 border border-blue-100 p-4 rounded-xl text-center min-w-[140px]">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">CASH</p>
                  <p className="text-xl font-bold text-blue-900">{totalIncomeCash} Lei</p>
                </div>
                <div className="flex-1 md:flex-none bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center min-w-[140px]">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">CARD</p>
                  <p className="text-xl font-bold text-emerald-900">{totalIncomeCard} Lei</p>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-4 text-slate-800">Ultimele Tranzacții (Încasate)</h3>
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="p-4">Nr. Comandă</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Dată</th>
                    <th className="p-4">Metodă</th>
                    <th className="p-4 text-right">Sumă</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paidOrders.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nu există încasări înregistrate.</td></tr>}
                  {paidOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-800">{o.orderNumber}</td>
                      <td className="p-4">{o.client.firstName} {o.client.lastName}</td>
                      <td className="p-4 text-slate-500">{new Date(o.createdAt).toLocaleString('ro-RO')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${o.paymentMethod === 'CARD' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">+{o.totalAmount} Lei</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== VIEW: COMENZI ===================== */}
        {view === 'orders' && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Gestiune Comenzi și Abonamente</h1>
             <button onClick={handleAssignRoutes} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
                <Truck className="w-4 h-4"/> Forțează Distribuirea (Azi)
              </button>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Caută după nume, telefon sau comandă..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 outline-none focus:border-blue-500 text-sm font-medium transition" />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="text-slate-400 w-5 h-5 hidden sm:block" />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1 sm:flex-none border border-slate-300 p-2.5 rounded-lg text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="ALL">Toate Tipurile</option>
                  <option value="SUBSCRIPTION">Doar Abonamente</option>
                  <option value="PICKUP">Doar Ridicare</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 sm:flex-none border border-slate-300 p-2.5 rounded-lg text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="ALL">Toate Statusurile</option>
                  <option value="PENDING">În așteptare</option>
                  <option value="DELIVERED">Livrate</option>
                  <option value="PAUSED">Pauză</option>
                </select>
                <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="flex-1 sm:flex-none border border-slate-300 p-2.5 rounded-lg text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="ALL">Status Plată</option>
                  <option value="PAID">Achitate</option>
                  <option value="UNPAID">Neachitate</option>
                </select>
              </div>
            </div>
            
            {filteredOrders.length === 0 ? (
              <div className="text-center text-slate-500 py-16 bg-white rounded-2xl border border-dashed border-slate-300">Nu am găsit nicio comandă care să corespundă filtrelor.</div>
            ) : (
              <div className="grid gap-6">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <span className="font-bold text-slate-800 text-lg mr-3">{order.orderNumber}</span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${order.type === 'SUBSCRIPTION' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                          {order.type === 'SUBSCRIPTION' ? '🚚 Abonament' : '🏪 Ridicare'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 text-xl">{order.totalAmount} Lei</span>
                        <div className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-2">Metodă: {order.paymentMethod}
                           <span className={`px-2 py-0.5 rounded font-bold ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {order.paymentStatus === 'PAID' ? '✓ ACHITAT' : 'NEACHITAT'}
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Client:</p>
                        <p className="font-bold text-slate-800 text-base">{order.client.firstName} {order.client.lastName}</p>
                        <p className="text-sm text-slate-600 mt-1">📞 {order.client.phone}</p>
                        <p className="text-sm text-slate-600 mt-1">📍 {order.client.address}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Produse:</p>
                        <ul className="space-y-2">
                          {order.items.map(item => (
                            <li key={item.id} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{item.quantity}x</span> 
                              <span>{item.product.name} <span className="text-slate-400 text-xs">({item.product.unit})</span></span>
                            </li>
                          ))}
                        </ul>
                        {order.type === 'SUBSCRIPTION' && order.deliveryDays.length > 0 && (
                          <div className="mt-4 pt-3 border-t"><p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Zile Livrare:</p>
                            <div className="flex gap-1 flex-wrap">{order.deliveryDays.map(day => (<span key={day} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded text-xs font-bold">{day}</span>))}</div>
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Schimbă Statusul:</label>
                        <select value={order.status} onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className={`w-full p-3 rounded-lg border font-bold text-sm outline-none cursor-pointer transition
                            ${order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : order.status === 'DELIVERED' ? 'bg-green-50 text-green-800 border-green-200' : order.status === 'PAUSED' ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                          {Object.entries(ORDER_STATUSES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                        </select>
                        <p className="text-xs text-slate-400 text-center mt-3">Plasată: {new Date(order.createdAt).toLocaleString('ro-RO')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW: STOCURI ===================== */}
        {view === 'inventory' && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Stocuri și Produse</h1>
              <button onClick={openAddProduct} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-700 transition shadow-sm">
                + Adaugă Produs
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className={`bg-white rounded-2xl shadow-sm border flex flex-col justify-between overflow-hidden transition-all hover:shadow-md ${!p.isAvailable && 'opacity-70 bg-slate-50'}`}>
                  <div className="w-full bg-slate-50 p-4 border-b flex gap-3 overflow-x-auto snap-x scrollbar-hide items-center min-h-[140px]">
                    {p.images && p.images.length > 0 ? p.images.map((img, idx) => (
                      <img key={idx} src={img} alt="preview" className="w-28 h-28 object-cover rounded-xl shadow-sm flex-shrink-0 snap-start border border-slate-200" />
                    )) : <div className="w-28 h-28 bg-slate-200 flex items-center justify-center rounded-xl text-slate-400 text-xs font-medium">Fără Poză</div>}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{p.name} <span className="text-sm font-normal text-slate-500">({p.unit})</span></h3>
                    <p className="text-emerald-600 font-bold text-xl mt-1">{p.price} Lei</p>
                    <p className="text-slate-500 text-sm mt-3 line-clamp-2 flex-1">{p.description}</p>
                    <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                      <button onClick={() => openEditProduct(p)} className="flex-1 flex justify-center items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition text-sm font-bold"><Edit2 className="w-4 h-4" /> Editează</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                    <button onClick={() => toggleAvailability(p.id, p.isAvailable)} className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-sm ${p.isAvailable ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-400 hover:bg-slate-500'}`}>
                      {p.isAvailable ? '✅ În Stoc' : '❌ Epuizat'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== VIEW: CLIENȚI ===================== */}
        {view === 'clients' && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Gestiune Clienți</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr><th className="p-4 font-semibold">Nume Client</th><th className="p-4 font-semibold">Telefon</th><th className="p-4 font-semibold">Adresă</th><th className="p-4 font-semibold">Status</th><th className="p-4 text-right font-semibold">Acțiuni</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-800">
                        {c.firstName} {c.lastName}
                        {c.internalNotes && <span title={c.internalNotes} className="ml-2 text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full cursor-help">📝 Notiță</span>}
                      </td>
                      <td className="p-4 text-slate-600">{c.phone}</td>
                      <td className="p-4 truncate max-w-[200px] text-slate-600" title={c.address}>{c.address}</td>
                      <td className="p-4">
                        {!c.isActive ? (
                          <button onClick={() => handleApproveClient(c.id)} className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold hover:bg-emerald-200 transition">
                            <CheckCircle className="w-4 h-4"/> Aprobă
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Activ</span>
                        )}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => openEditClient(c)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteUser(c.id, 'CLIENT')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Niciun client înregistrat.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== VIEW: ȘOFERI ===================== */}
        {view === 'drivers' && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Gestiune Distribuitori</h1>
              <button onClick={openAddDriver} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm">
                + Adaugă Șofer
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {drivers.map(d => (
                <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col relative overflow-hidden transition hover:shadow-md">
                  <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                  <div className="pl-3 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Truck className="w-6 h-6"/></div>
                      <div><h3 className="font-bold text-lg text-slate-800">{d.firstName} {d.lastName}</h3><p className="text-sm text-slate-500 font-medium">{d.phone}</p></div>
                    </div>
                    {d.internalNotes && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex-1">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1 tracking-wider">Info Rută / Mașină:</p>
                        <p className="text-sm text-slate-700 font-medium">{d.internalNotes}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-auto">
                      <button onClick={() => openEditDriver(d)} className="flex-1 flex justify-center items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition"><Edit2 className="w-4 h-4"/> Edit</button>
                      <button onClick={() => handleDeleteUser(d.id, 'DRIVER')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== VIEW: SETĂRI ADMIN ===================== */}
        {view === 'settings' && (
          <div className="max-w-2xl animate-fade-in mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Setări Generale</h1>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-3">Zile active pentru Livrare (Abonamente)</label>
                <div className="flex flex-wrap gap-3">
                  {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map(day => (
                    <button key={day} onClick={() => toggleSettingsDay(day)} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${adminSettings.deliveryDays.includes(day) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Clienții vor putea alege doar din aceste zile atunci când își configurează abonamentul.</p>
              </div>

              <div className="mb-8 border-t pt-6 border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">Cost Standard Livrare (Lei)</label>
                <input type="number" value={adminSettings.deliveryFee} onChange={(e) => setAdminSettings({...adminSettings, deliveryFee: Number(e.target.value)})} className="w-full max-w-[200px] border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-lg text-slate-800" />
                <p className="text-xs text-slate-500 mt-2 font-medium">Dacă este 0, livrarea va fi gratuită pentru toți clienții.</p>
              </div>

              <button onClick={handleSaveSettings} className="w-full bg-emerald-700 text-white font-bold py-4 rounded-xl hover:bg-emerald-800 transition shadow-lg flex justify-center items-center text-lg">
                <Save className="w-5 h-5 mr-2" /> Salvează Setările
              </button>
            </div>
          </div>
        )}

        {/* ===================== VIEW: CHAT ADMIN (Verde/Emerald) ===================== */}
        {view === 'chat' && (
          <div className="animate-fade-in max-w-7xl w-full mx-auto h-full flex flex-col md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 hidden md:block shrink-0">Căsuță Mesaje</h1>
            
            <div className="bg-white md:rounded-2xl shadow-sm md:border border-slate-200 overflow-hidden flex flex-col md:flex-row flex-1 w-full h-full">
              
              {/* SIDEBAR CONVERSAȚII */}
              <div className={`w-full md:w-1/3 bg-slate-50 border-r border-slate-200 flex-1 flex flex-col ${selectedClientChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="flex items-center mb-3 md:hidden">
                    <button onClick={() => setView('dash')} className="text-emerald-600 font-bold text-sm flex items-center hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg transition">
                      <ChevronRight className="w-4 h-4 rotate-180 mr-1"/> Înapoi la Dashboard
                    </button>
                  </div>
                  <input type="text" placeholder="Caută conversație..." className="w-full bg-slate-100 border-none rounded-xl p-3 outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">Niciun mesaj încă.</p>}
                  {conversations.map(conv => (
                    <div key={conv.user.id} onClick={() => openConversation(conv.user)} className={`p-4 border-b border-slate-100 cursor-pointer transition ${selectedClientChat?.id === conv.user.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'bg-white hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm text-slate-800">
                          {conv.user.firstName} {conv.user.lastName} 
                          {conv.user.role === 'DRIVER' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">ȘOFER</span>}
                        </h4>
                        <span className="text-[10px] text-slate-400">{new Date(conv.lastMessage.createdAt).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-xs truncate max-w-[200px] ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{conv.lastMessage.content}</p>
                        {conv.unreadCount > 0 && <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FEREASTRA DE CHAT (VERDE - EMERALD) */}
              <div className={`w-full md:w-2/3 bg-white flex-1 flex flex-col ${!selectedClientChat ? 'hidden md:flex' : 'flex'}`}>
                {!selectedClientChat ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
                    <p className="font-medium text-lg">Selectează o conversație</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-emerald-700 text-white flex items-center gap-3 shadow-sm z-10 md:rounded-tr-2xl">
                      <button onClick={() => setSelectedClientChat(null)} className="md:hidden p-2 -ml-2 text-emerald-100 hover:bg-emerald-600 rounded-full transition flex items-center text-sm font-bold"><ChevronRight className="w-5 h-5 rotate-180 mr-1"/> Înapoi</button>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">{selectedClientChat.firstName.charAt(0)}</div>
                      <div>
                        <h3 className="font-bold leading-tight">{selectedClientChat.firstName} {selectedClientChat.lastName}</h3>
                        <p className="text-xs text-emerald-100">📞 {selectedClientChat.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 bg-slate-50 overflow-y-auto flex flex-col gap-3">
                      {chatMessages.map(msg => {
                        const isAdmin = msg.senderId === user.id;
                        return (
                          <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${isAdmin ? 'bg-emerald-600 text-white self-end rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none'}`}>
                            <p className="text-sm font-medium">{msg.content}</p>
                            <span className={`text-[10px] block mt-1 ${isAdmin ? 'text-emerald-200 text-right' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        )
                      })}
                      {/* Ancoră invizibilă pentru auto-scroll */}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendAdminMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 md:rounded-br-2xl">
                      <input 
                        type="text" 
                        value={newAdminMessage} 
                        onChange={e=>setNewAdminMessage(e.target.value)} 
                        onFocus={() => setTimeout(scrollToBottom, 300)}
                        placeholder="Scrie un răspuns..." 
                        className="flex-1 border-2 border-slate-200 rounded-full px-4 py-2 outline-none focus:border-emerald-500 bg-slate-50 font-medium text-sm transition" 
                      />
                      <button type="submit" disabled={!newAdminMessage.trim()} className="bg-emerald-700 text-white p-3 rounded-full hover:bg-emerald-800 transition shadow-md disabled:opacity-50"><Send className="w-5 h-5"/></button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODALE (POP-UPS) ================= */}
      
      <Modal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title={editingProductId ? 'Editare Produs' : 'Adăugare Produs Nou'}>
        <form onSubmit={handleSaveProduct} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600">Nume Produs: <input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none focus:border-emerald-500 bg-slate-50" /></label>
          <label className="text-sm font-semibold text-slate-600">Preț (Lei): <input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none focus:border-emerald-500 bg-slate-50" /></label>
          <label className="text-sm font-semibold text-slate-600">Unitate (ex: 2L): <input type="text" required value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none focus:border-emerald-500 bg-slate-50" /></label>
          <label className="text-sm font-semibold text-slate-600">Descriere Scurtă: <input type="text" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none focus:border-emerald-500 bg-slate-50" /></label>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Fotografii (Upload Multiplu):</label>
            <input type="file" multiple accept="image/*" onChange={e => setSelectedFiles(e.target.files)} className="border p-3 rounded-xl w-full bg-slate-50" />
            {editingProductId && <p className="text-xs text-orange-500 mt-2 font-medium">*Atenție: Încărcarea de poze noi va suprascrie pozele vechi.</p>}
          </div>
          <button type="submit" className="md:col-span-2 bg-emerald-700 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-800 transition shadow-lg mt-2 text-lg">
            {editingProductId ? 'Salvează Modificările' : 'Creează Produsul'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} title="Editare Date Client">
        <form onSubmit={handleSaveClient} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600">Prenume: <input type="text" value={clientForm.firstName} onChange={e => setClientForm({...clientForm, firstName: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" /></label>
          <label className="text-sm font-semibold text-slate-600">Nume: <input type="text" value={clientForm.lastName} onChange={e => setClientForm({...clientForm, lastName: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" /></label>
          <label className="text-sm font-semibold text-slate-600">Telefon: <input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" /></label>
          <label className="text-sm font-semibold text-slate-600">Adresă: <input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" /></label>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-orange-600 flex items-center gap-2 mb-1"><ShieldAlert className="w-4 h-4"/> Notițe Interne (Admin & Șofer):</label>
            <textarea value={clientForm.internalNotes} onChange={e => setClientForm({...clientForm, internalNotes: e.target.value})} placeholder="Ex: Câine rău la poartă..." className="border p-3 rounded-xl w-full outline-none bg-orange-50 h-24 focus:border-orange-400" />
          </div>
          <button type="submit" className="md:col-span-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg mt-2 text-lg">Salvează Modificările</button>
        </form>
      </Modal>

      <Modal isOpen={isDriverModalOpen} onClose={() => setDriverModalOpen(false)} title={editingDriverId ? 'Editare Șofer' : 'Creare Cont Șofer Nou'}>
        <form onSubmit={handleSaveDriver} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600">Prenume: <input type="text" required value={driverForm.firstName} onChange={e => setDriverForm({...driverForm, firstName: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" /></label>
          <label className="text-sm font-semibold text-slate-600">Nume: <input type="text" required value={driverForm.lastName} onChange={e => setDriverForm({...driverForm, lastName: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" /></label>
          <label className="text-sm font-semibold text-slate-600">Telefon (Logare): <input type="text" required value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" /></label>
          {!editingDriverId && (
            <label className="text-sm font-semibold text-slate-600">Parolă (Logare): <input type="text" required minLength="6" value={driverForm.password} onChange={e => setDriverForm({...driverForm, password: e.target.value})} className="mt-1 border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" placeholder="Minim 6 caractere" /></label>
          )}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-600 mb-1 block">Detalii Mașină / Rută (Notițe Interne):</label>
            <input type="text" value={driverForm.internalNotes} onChange={e => setDriverForm({...driverForm, internalNotes: e.target.value})} placeholder="Ex: Duba B-10-AGP..." className="border p-3 rounded-xl w-full outline-none bg-slate-50 focus:border-blue-500" />
          </div>
          <button type="submit" className="md:col-span-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg mt-2 text-lg">
            {editingDriverId ? 'Salvează Datele Șoferului' : 'Creează Cont Șofer'}
          </button>
        </form>
      </Modal>

    </div>
  );
}