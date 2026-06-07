import React, { useState } from 'react';
import { 
  Leaf, ShoppingCart, UserPlus, PlayCircle, MapPin, Phone, 
  Bell, MessageCircle, Package, CheckCircle, AlertTriangle, 
  Calendar, Search, Menu, Users, TrendingUp, Plus, LogOut, 
  ChevronRight, Settings, History, Truck, Milk, Navigation, 
  DollarSign, Send, MapIcon
} from 'lucide-react';

// --- BAZĂ DE DATE FALSĂ (MOCK DATA) ---
const MOCK_PRODUCTS = [
  { id: 1, name: 'Lapte proaspăt de vacă 1L', price: 8, stock: true, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80' },
  { id: 2, name: 'Telemea proaspătă 1Kg', price: 35, stock: false, img: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&q=80' },
  { id: 3, name: 'Smântână de casă 500g', price: 20, stock: true, img: 'https://www.via-profi.ro/wp-content/uploads/2025/01/smantana-grasa-de-casa.jpg' },
  { id: 4, name: 'Brânză de burduf 500g', price: 25, stock: true, img: 'https://images.unsplash.com/photo-1632599298379-4eb518292cba?w=200&q=80' }
];

const MOCK_ROUTE = [
  { id: 1, client: 'Familia Popescu', address: 'Str. Universității, nr 12', items: '3L Lapte', status: 'pending', pay: 'CASH 24 Lei', note: 'Lăsați la poartă', coords: {x: 60, y: 80} },
  { id: 2, client: 'Ionuț Radu', address: 'Str. Zamca, bl. 4, ap 12', items: '1L Lapte, 1Kg Telemea', status: 'pending', pay: 'Plătit Online', note: '', coords: {x: 180, y: 40} },
  { id: 3, client: 'Maria Vasile', address: 'Str. Mărășești 14', items: '2L Lapte', status: 'delivered', pay: 'Abonament', note: '', coords: {x: 250, y: 150} },
];

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Mihai Dobre', status: 'Activ', sub: 'L, Mi, V - 2L' },
  { id: 2, name: 'Elena Stan', status: 'Nou (Așteaptă)', sub: 'Fără' },
  { id: 3, name: 'Cristian Popa', status: 'Inactiv (Concediu)', sub: 'Ma, J - 1L' },
];

export default function App() {
  const [role, setRole] = useState('visitor'); 
  const [cart, setCart] = useState([]);

  const addToCart = (prod) => setCart([...cart, prod]);
  const clearCart = () => setCart([]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navigator de Testare - Sus */}
      <div className="bg-slate-900 p-2 flex justify-center space-x-2 overflow-x-auto sticky top-0 z-[100] text-xs md:text-sm shadow-md">
        <span className="text-white font-bold py-1 mr-2 hidden md:inline">Mod Testare:</span>
        <button onClick={() => setRole('visitor')} className={`px-3 py-1 rounded text-white ${role === 'visitor' ? 'bg-indigo-500' : 'bg-slate-700 hover:bg-slate-600'}`}>Vizitator</button>
        <button onClick={() => setRole('client')} className={`px-3 py-1 rounded text-white ${role === 'client' ? 'bg-green-500' : 'bg-slate-700 hover:bg-slate-600'}`}>Client</button>
        <button onClick={() => setRole('driver')} className={`px-3 py-1 rounded text-white ${role === 'driver' ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}>Distribuitor</button>
        <button onClick={() => setRole('admin')} className={`px-3 py-1 rounded text-white ${role === 'admin' ? 'bg-purple-500' : 'bg-slate-700 hover:bg-slate-600'}`}>Administrator</button>
      </div>

      {role === 'visitor' && <VisitorView onLogin={() => setRole('client')} />}
      {role === 'client' && <ClientView cart={cart} addToCart={addToCart} clearCart={clearCart} onLogout={() => setRole('visitor')} />}
      {role === 'driver' && <DriverView onLogout={() => setRole('visitor')} />}
      {role === 'admin' && <AdminView onLogout={() => setRole('visitor')} />}
    </div>
  );
}

/* =========================================================
   1. VIZITATOR (Website Complet + Meniu Hamburger)
   ========================================================= */
function VisitorView({ onLogin }) {
  const [view, setView] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6"><Leaf className="h-12 w-12 text-green-600" /></div>
          <h2 className="text-2xl font-bold text-center mb-6">{view === 'login' ? 'Intră în cont' : 'Creare cont nou'}</h2>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            {view === 'register' && <input type="text" placeholder="Nume complet" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />}
            <input type="tel" placeholder="Număr telefon" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            {view === 'register' && <textarea placeholder="Adresa completă de livrare" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required rows="2" />}
            <input type="password" placeholder="Parolă" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
              {view === 'login' ? 'Autentificare' : 'Trimite cerere cont'}
            </button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-600 cursor-pointer hover:text-green-600" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
            {view === 'login' ? 'Nu ai cont? Creează unul.' : 'Ai deja cont? Loghează-te.'}
          </p>
          <button onClick={() => setView('home')} className="w-full mt-4 text-gray-500 text-sm hover:underline">Înapoi la site</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="bg-white shadow-md sticky top-[40px] md:top-[36px] z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-800">Ferma Agape</span>
          </div>
          
          <div className="hidden md:flex space-x-6 items-center">
            <a href="#poveste" className="hover:text-green-600 font-medium">Povestea noastră</a>
            <a href="#produse" className="hover:text-green-600 font-medium">Produse</a>
            <a href="#livrare" className="hover:text-green-600 font-medium">Livrări</a>
          </div>
          <div className="hidden md:flex space-x-3">
            <button onClick={() => setView('login')} className="px-4 py-2 text-green-700 border border-green-600 rounded-lg hover:bg-green-50 font-medium transition">Intră în cont</button>
            <button onClick={() => setView('register')} className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm transition">
              <UserPlus className="h-4 w-4" /><span>Creează cont</span>
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-green-800 hover:text-green-600 focus:outline-none"><Menu className="h-8 w-8" /></button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 shadow-lg absolute w-full left-0">
            <div className="flex flex-col space-y-3">
              <a href="#poveste" onClick={() => setIsMenuOpen(false)} className="text-gray-800 font-medium hover:text-green-600">Povestea noastră</a>
              <a href="#produse" onClick={() => setIsMenuOpen(false)} className="text-gray-800 font-medium hover:text-green-600">Produse</a>
              <a href="#livrare" onClick={() => setIsMenuOpen(false)} className="text-gray-800 font-medium hover:text-green-600">Livrări</a>
              <hr className="border-gray-100" />
              <button onClick={() => { setIsMenuOpen(false); setView('login'); }} className="w-full py-2 text-green-700 border border-green-600 rounded-lg font-medium">Intră în cont</button>
              <button onClick={() => { setIsMenuOpen(false); setView('register'); }} className="w-full flex justify-center items-center space-x-2 py-2 bg-green-600 text-white rounded-lg font-medium">
                <UserPlus className="h-5 w-5" /><span>Creează cont</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <header className="relative bg-green-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row md:items-center gap-12">
          <div className="md:w-1/2 z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">Lapte proaspăt, direct de la fermă la ușa ta.</h1>
            <p className="text-lg text-gray-600 mb-8">Peste 200 de familii se bucură deja de produsele noastre naturale. Fără conservanți, livrat proaspăt în fiecare dimineață.</p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button onClick={() => setView('register')} className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg shadow-lg hover:shadow-xl transition flex justify-center items-center">Vreau să devin client</button>
              <button className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold text-lg flex items-center justify-center space-x-2 transition"><PlayCircle className="h-6 w-6" /><span>Google Play</span></button>
            </div>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0 relative">
            <div className="absolute inset-0 bg-green-200 rounded-full blur-3xl opacity-50"></div>
            <img src="https://lactanet.ca/wp-content/uploads/2020/07/vaches_paturages.jpg" alt="Vaci" className="relative z-10 rounded-2xl shadow-2xl object-cover h-80 w-full" />
          </div>
        </div>
      </header>

      <section id="produse" className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Ce îți aducem bun acasă?</h2>
          <p className="text-gray-600 mt-2">Produsele noastre sunt 100% naturale. Creează cont pentru a comanda.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_PRODUCTS.slice(0, 3).map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition border border-gray-100 flex flex-col">
              <img src={product.img} alt={product.name} className="h-48 w-full object-cover" />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-green-600 font-bold text-lg mb-4">{product.price} Lei</p>
                <button onClick={() => setView('register')} className="mt-auto w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center space-x-2 transition">
                  <ShoppingCart className="h-4 w-4" /><span>Cont pentru comandă</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="livrare" className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Cum funcționează?</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4"><div className="bg-green-100 p-3 rounded-full text-green-600"><UserPlus className="h-6 w-6" /></div><div><h4 className="text-xl font-bold">1. Faci o cerere de cont</h4><p className="text-gray-600">Completezi formularul cu adresa ta. Fermierul îți aprobă contul.</p></div></div>
              <div className="flex items-start space-x-4"><div className="bg-blue-100 p-3 rounded-full text-blue-600"><Milk className="h-6 w-6" /></div><div><h4 className="text-xl font-bold">2. Comanzi din aplicație</h4><p className="text-gray-600">Faci un abonament recurent sau comanzi punctual.</p></div></div>
              <div className="flex items-start space-x-4"><div className="bg-orange-100 p-3 rounded-full text-orange-600"><MapPin className="h-6 w-6" /></div><div><h4 className="text-xl font-bold">3. Primești la ușă</h4><p className="text-gray-600">Distribuitorul nostru ajunge la tine direct cu mașina frigorifică.</p></div></div>
            </div>
          </div>
          <div className="md:w-1/2 bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center"><MapPin className="h-6 w-6 mr-2 text-red-500"/> Zone de Livrare</h3>
            <p className="text-gray-600 mb-4">Livrăm în următoarele zone:</p>
            <ul className="space-y-2 mb-6 text-gray-800 font-medium">
              <li className="flex items-center space-x-2"><span>✅</span> <span>Suceava (Toate cartierele)</span></li>
              <li className="flex items-center space-x-2"><span>✅</span> <span>Șcheia, Ipotești, Bosanci</span></li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0"><Leaf className="h-6 w-6 text-green-400" /><span className="text-xl font-bold">Ferma Agape</span></div>
          <div className="flex space-x-6 text-gray-400"><span className="flex items-center space-x-1"><Phone className="h-4 w-4"/> <span>07xx xxx xxx</span></span></div>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   2. CLIENT (Aplicație Mobilă)
   ========================================================= */
function ClientView({ cart, addToCart, clearCart, onLogout }) {
  const [tab, setTab] = useState('home');

  const renderContent = () => {
    switch (tab) {
      case 'home':
        return (
          <div className="p-4 space-y-6 pb-24">
            <div className="bg-orange-100 border-l-4 border-orange-500 p-3 rounded-lg flex items-start space-x-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div><p className="text-orange-800 text-sm font-bold">Atenție: Mâine nu livrăm!</p><p className="text-xs text-orange-700">Din motive tehnice, livrările de marți se mută pe miercuri.</p></div>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-3">Produse disponibile</h2>
              <div className="space-y-3">
                {MOCK_PRODUCTS.map(p => (
                  <div key={p.id} className={`flex bg-white p-3 rounded-xl shadow-sm border border-gray-100 ${!p.stock && 'opacity-60 grayscale'}`}>
                    <img src={p.img} alt={p.name} className="w-20 h-20 rounded-lg object-cover" />
                    <div className="ml-3 flex-1 flex flex-col justify-between">
                      <div><h3 className="font-bold text-sm">{p.name}</h3><p className="text-green-600 font-bold">{p.price} Lei</p></div>
                      <div className="text-right">
                        {p.stock ? (
                          <button onClick={() => addToCart(p)} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200">Adaugă</button>
                        ) : (
                          <span className="text-xs text-red-500 font-bold">Stoc epuizat</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'cart':
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        return (
          <div className="p-4 pb-24">
            <h2 className="font-bold text-xl mb-4">Coșul meu</h2>
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Coșul este gol.</div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border">
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="font-bold text-green-600">{item.price} Lei</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-100 p-4 rounded-xl mb-6 flex justify-between font-bold text-lg"><span>Total:</span><span>{total} Lei</span></div>
                <button onClick={() => { alert('Comandă plasată cu succes!'); clearCart(); setTab('home'); }} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">Finalizează Comanda</button>
              </>
            )}
          </div>
        );
      case 'sub':
        return (
          <div className="p-4 pb-24">
            <h2 className="font-bold text-xl mb-4">Abonamentul meu</h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
              <h3 className="font-bold text-blue-900 mb-2">Activ curent:</h3>
              <p className="text-blue-800 text-sm">2x Lapte 1L în fiecare Marți și Vineri.</p>
            </div>
            <button className="w-full bg-white border-2 border-green-600 text-green-600 font-bold py-3 rounded-xl mb-4">Modifică Abonament</button>
            <button className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex justify-center items-center"><Calendar className="w-5 h-5 mr-2" /> Pune pauză (Concediu)</button>
          </div>
        );
      case 'profile':
        return (
          <div className="p-4 pb-24 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2"><UserPlus className="h-8 w-8"/></div>
              <h2 className="font-bold text-lg">Mihai Dobre</h2>
              <p className="text-sm text-gray-500">Str. Mărășești 14</p>
            </div>
            <button className="w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border"><span className="flex items-center"><History className="w-5 h-5 mr-3 text-gray-500"/> Istoric Comenzi</span> <ChevronRight className="w-5 h-5 text-gray-400"/></button>
            <button className="w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border"><span className="flex items-center"><MessageCircle className="w-5 h-5 mr-3 text-green-500"/> Chat cu Fermierul</span> <ChevronRight className="w-5 h-5 text-gray-400"/></button>
            <button onClick={onLogout} className="w-full flex items-center justify-center bg-red-50 text-red-600 font-bold p-4 rounded-xl shadow-sm border border-red-100"><LogOut className="w-5 h-5 mr-2"/> Deconectare</button>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl">
      <header className="bg-green-600 text-white p-5 rounded-b-2xl shadow-md sticky top-0 z-20">
        <h1 className="text-xl font-bold">Ferma Agape</h1>
        <p className="text-green-100 text-sm">Salut, Mihai! 👋</p>
      </header>
      <div className="overflow-y-auto h-full">{renderContent()}</div>
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around py-3 pb-6 z-20">
        <button onClick={() => setTab('home')} className={`flex flex-col items-center text-xs ${tab === 'home' ? 'text-green-600 font-bold' : 'text-gray-400'}`}><Package className="h-6 w-6 mb-1" />Acasă</button>
        <button onClick={() => setTab('cart')} className={`flex flex-col items-center text-xs relative ${tab === 'cart' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
          <ShoppingCart className="h-6 w-6 mb-1" />Coș
          {cart.length > 0 && <span className="absolute -top-1 right-2 bg-red-500 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{cart.length}</span>}
        </button>
        <button onClick={() => setTab('sub')} className={`flex flex-col items-center text-xs ${tab === 'sub' ? 'text-green-600 font-bold' : 'text-gray-400'}`}><Calendar className="h-6 w-6 mb-1" />Abonament</button>
        <button onClick={() => setTab('profile')} className={`flex flex-col items-center text-xs ${tab === 'profile' ? 'text-green-600 font-bold' : 'text-gray-400'}`}><Settings className="h-6 w-6 mb-1" />Profil</button>
      </nav>
    </div>
  );
}

/* =========================================================
   3. DISTRIBUITOR (Aplicație Șofer cu Hartă Mock Leaflet)
   ========================================================= */
function DriverView({ onLogout }) {
  const [route, setRoute] = useState(MOCK_ROUTE);
  const [tab, setTab] = useState('map'); 
  const [startPoint, setStartPoint] = useState('Ferma Agape (Ipotești)');
  const [calculating, setCalculating] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);

  const pending = route.filter(r => r.status === 'pending');
  const done = route.filter(r => r.status === 'delivered');

  const calculateRoute = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      setRouteOptimized(true);
      setRoute([...route].sort((a, b) => a.coords.x - b.coords.x));
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl">
      <header className="bg-slate-900 text-white p-5 sticky top-0 z-20">
        <h1 className="text-xl font-bold flex items-center"><Truck className="mr-2"/> Livrări Azi</h1>
        <div className="flex justify-between text-xs mt-2 text-slate-300"><span>Rămase: {pending.length}</span><span>Finalizate: {done.length}</span></div>
        <div className="w-full bg-slate-700 h-1 mt-2 rounded"><div className="bg-blue-500 h-1 rounded" style={{width: `${(done.length/route.length)*100}%`}}></div></div>
      </header>

      <div className="flex bg-slate-900 px-4 pb-2 text-sm z-20 relative">
        <button onClick={()=>setTab('map')} className={`flex-1 pb-2 text-center font-bold ${tab==='map'?'text-white border-b-2 border-blue-500':'text-slate-400'}`}>🌍 Hartă & Rută</button>
        <button onClick={()=>setTab('list')} className={`flex-1 pb-2 text-center font-bold ${tab==='list'?'text-white border-b-2 border-blue-500':'text-slate-400'}`}>📋 Listă ({pending.length})</button>
      </div>

      <div className="p-4 pb-24 h-full">
        {tab === 'map' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Punct de plecare</label>
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="text-blue-500 w-5 h-5"/>
                <input type="text" value={startPoint} onChange={(e)=>setStartPoint(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none focus:border-blue-500" />
              </div>
              <button onClick={calculateRoute} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center items-center hover:bg-blue-700 transition">
                {calculating ? 'Se calculează...' : <><Navigation className="w-4 h-4 mr-2"/> Calculează Ruta Optimă</>}
              </button>
            </div>

            <div className="relative w-full h-80 bg-green-50 border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              {routeOptimized && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path d="M 20 200 L 60 80 L 180 40 L 250 150" stroke="#3b82f6" strokeWidth="4" strokeDasharray="6,6" fill="none" className="animate-pulse" />
                </svg>
              )}
              <div className="absolute top-[190px] left-[10px] flex flex-col items-center">
                <div className="bg-slate-900 text-white text-[10px] px-1 rounded font-bold mb-1">Plecare</div>
                <div className="w-4 h-4 bg-slate-900 rounded-full border-2 border-white shadow"></div>
              </div>
              {route.map((r, index) => (
                <div key={r.id} className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-full" style={{top: r.coords.y, left: r.coords.x}}>
                  <div className={`text-[10px] px-1 rounded font-bold mb-1 shadow ${r.status==='delivered'?'bg-green-500 text-white':'bg-white text-gray-800'}`}>
                    {routeOptimized ? `${index + 1}. ` : ''}{r.client.split(' ')[0]}
                  </div>
                  <MapPin className={`w-6 h-6 ${r.status==='delivered'?'text-green-500':'text-red-500'}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'list' && (
          <div className="space-y-4">
            {(tab === 'list' ? pending : done).length === 0 && <p className="text-center text-gray-500 py-4">Nicio comandă aici.</p>}
            {pending.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-slate-800">{r.client}</h3><span className="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-800">{r.pay}</span></div>
                <p className="text-sm text-slate-500 flex items-center mb-2"><MapPin className="h-4 w-4 mr-1"/> {r.address}</p>
                <button onClick={() => setRoute(route.map(item => item.id === r.id ? { ...item, status: 'delivered' } : item))} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold flex justify-center items-center mt-3"><CheckCircle className="w-4 h-4 mr-1"/> Confirmă Livrarea</button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around py-4 z-20">
        <button onClick={onLogout} className="text-red-500 font-bold text-sm flex items-center"><LogOut className="w-4 h-4 mr-1"/> Ieși din tură</button>
      </nav>
    </div>
  );
}

/* =========================================================
   4. ADMINISTRATOR (Panou Complet Desktop/Mobile)
   ========================================================= */
function AdminView({ onLogout }) {
  const [view, setView] = useState('dash');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <div className="md:hidden bg-green-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-300" />
          <span className="text-lg font-bold">Admin Agape</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg bg-green-600 hover:bg-green-700 transition">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-green-900 text-white border-b border-green-800">
          <nav className="flex flex-col px-4 py-3 space-y-2">
            <button onClick={() => { setView('dash'); setIsMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl text-sm ${view === 'dash' ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800'}`}><Package className="w-5 h-5 inline mr-2" /> Dashboard</button>
            <button onClick={() => { setView('clients'); setIsMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl text-sm ${view === 'clients' ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800'}`}><Users className="w-5 h-5 inline mr-2" /> Clienți</button>
            <button onClick={() => { setView('inventory'); setIsMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl text-sm ${view === 'inventory' ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800'}`}><ShoppingCart className="w-5 h-5 inline mr-2" /> Stocuri</button>
            <button onClick={() => { setView('finances'); setIsMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl text-sm ${view === 'finances' ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800'}`}><DollarSign className="w-5 h-5 inline mr-2" /> Financiar</button>
            <button onClick={() => { setView('chat'); setIsMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl text-sm ${view === 'chat' ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800'}`}><MessageCircle className="w-5 h-5 inline mr-2" /> Mesaje</button>
            <button onClick={() => { setView('settings'); setIsMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl text-sm ${view === 'settings' ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800'}`}><Settings className="w-5 h-5 inline mr-2" /> Setări</button>
            <button onClick={onLogout} className="w-full text-left p-3 rounded-xl text-sm text-red-300 hover:bg-green-800 flex items-center"><LogOut className="w-5 h-5 mr-2" /> Ieșire</button>
          </nav>
        </div>
      )}

      <aside className="hidden md:flex w-full md:w-64 bg-green-950 text-white md:min-h-screen p-4 flex-col justify-between items-stretch overflow-y-auto shrink-0 z-10 sticky top-0">
        <h2 className="text-xl font-bold text-green-500 mb-0 md:mb-8 flex items-center"><Leaf className="mr-2" /> Admin Agape</h2>
        <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
          <button onClick={()=>setView('dash')} className={`flex items-center p-3 rounded-lg text-sm ${view==='dash' ? 'bg-green-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Package className="w-5 h-5 md:mr-3"/> <span className="hidden md:inline">Dashboard</span></button>
          <button onClick={()=>setView('clients')} className={`flex items-center p-3 rounded-lg text-sm ${view==='clients' ? 'bg-green-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Users className="w-5 h-5 md:mr-3"/> <span className="hidden md:inline">Clienți</span></button>
          <button onClick={()=>setView('inventory')} className={`flex items-center p-3 rounded-lg text-sm ${view==='inventory' ? 'bg-green-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><ShoppingCart className="w-5 h-5 md:mr-3"/> <span className="hidden md:inline">Stocuri</span></button>
          <button onClick={()=>setView('finances')} className={`flex items-center p-3 rounded-lg text-sm ${view==='finances' ? 'bg-green-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><DollarSign className="w-5 h-5 md:mr-3"/> <span className="hidden md:inline">Financiar</span></button>
          <button onClick={()=>setView('chat')} className={`flex items-center p-3 rounded-lg text-sm ${view==='chat' ? 'bg-green-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><MessageCircle className="w-5 h-5 md:mr-3"/> <span className="hidden md:inline">Mesaje</span></button>
          <button onClick={()=>setView('settings')} className={`flex items-center p-3 rounded-lg text-sm ${view==='settings' ? 'bg-green-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Settings className="w-5 h-5 md:mr-3"/> <span className="hidden md:inline">Setări</span></button>
        </nav>
        <button onClick={onLogout} className="mt-auto hidden md:flex items-center text-red-400 p-3 hover:bg-slate-800 rounded-lg"><LogOut className="w-5 h-5 mr-3"/> Ieșire</button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* DASHBOARD */}
        {view === 'dash' && (
          <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Rezumatul Zilei</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Necesar Lapte Azi</p><p className="text-2xl font-bold">145L</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Comenzi Active</p><p className="text-2xl font-bold text-blue-600">68</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Încasări Cash</p><p className="text-2xl font-bold text-orange-600">450 Lei</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-gray-500 text-sm">Încasări Card</p><p className="text-2xl font-bold text-green-600">890 Lei</p></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="font-bold text-lg mb-4 flex items-center"><MapIcon className="mr-2 text-blue-500"/> Traseu: Suceava (Șofer: Ionuț)</h2>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2"><div className="bg-blue-600 h-4 rounded-full" style={{width:'45%'}}></div></div>
                <p className="text-sm text-gray-600 mb-4">Livrări efectuate: 21 / 45</p>
                <button className="text-blue-600 font-bold text-sm border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50">Urmărește Șoferul pe Hartă</button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="font-bold text-lg mb-4 flex items-center"><Bell className="mr-2 text-purple-500"/> Notificare Push Rapidă</h2>
                <textarea rows="2" placeholder="Ex: Întârziere livrare 30 min..." className="w-full p-2 border rounded-lg mb-3 outline-none focus:ring-2 focus:ring-purple-500 text-sm"></textarea>
                <button className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700">Trimite la toți (200 clienți)</button>
              </div>
            </div>
          </div>
        )}

        {/* CLIENȚI */}
        {view === 'clients' && (
           <div>
            <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Gestiune Clienți</h1><button className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">+ Adaugă Client</button></div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="p-4">Nume</th><th className="p-4">Status</th><th className="p-4">Abonament</th><th className="p-4">Acțiuni</th></tr></thead>
                <tbody>
                  {MOCK_CUSTOMERS.map(c => (
                    <tr key={c.id} className="border-t">
                      <td className="p-4 font-bold">{c.name}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${c.status==='Activ'?'bg-green-100 text-green-800':c.status.includes('Nou')?'bg-orange-100 text-orange-800':'bg-gray-100 text-gray-800'}`}>{c.status}</span></td>
                      <td className="p-4 text-gray-600">{c.sub}</td>
                      <td className="p-4"><button className="text-blue-600 hover:underline">Editează</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STOCURI */}
        {view === 'inventory' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Stocuri și Produse</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_PRODUCTS.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col justify-between">
                  <div className="flex items-center space-x-3 mb-4"><img src={p.img} className="w-16 h-16 rounded object-cover" alt="" /><div><h3 className="font-bold text-sm">{p.name}</h3><p className="text-gray-500 text-xs">{p.price} Lei</p></div></div>
                  <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-600">Status Azi:</span><button className={`px-3 py-1 rounded text-xs font-bold text-white ${p.stock ? 'bg-green-500' : 'bg-red-500'}`}>{p.stock ? 'În Stoc' : 'Epuizat'}</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCIAR */}
        {view === 'finances' && (
          <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Situație Financiară</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div><p className="text-sm text-gray-500">Venit total luna curentă</p><h2 className="text-4xl font-extrabold text-gray-900">14,250 <span className="text-xl text-gray-500">Lei</span></h2></div>
              <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-green-700">Descarcă Raport (PDF)</button>
            </div>
            <h3 className="font-bold text-lg mb-4">Ultimele Încasări</h3>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="p-4">Client</th><th className="p-4">Dată</th><th className="p-4">Metodă</th><th className="p-4">Sumă</th></tr></thead>
                <tbody>
                  <tr className="border-t"><td className="p-4 font-bold">Familia Popescu</td><td className="p-4">Azi, 08:30</td><td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Card (Stripe)</span></td><td className="p-4 font-bold text-gray-900">+ 48 Lei</td></tr>
                  <tr className="border-t"><td className="p-4 font-bold">Ionuț Radu</td><td className="p-4">Azi, 07:15</td><td className="p-4"><span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">Cash la Șofer</span></td><td className="p-4 font-bold text-gray-900">+ 24 Lei</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHAT */}
        {view === 'chat' && (
          <div className="h-[80vh] flex flex-col md:flex-row bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="w-full md:w-1/3 border-r border-gray-100 bg-gray-50">
              <div className="p-4 border-b border-gray-200"><input type="text" placeholder="Caută client..." className="w-full p-2 rounded-lg border outline-none focus:border-green-500 text-sm"/></div>
              <div className="p-4 border-b border-gray-200 bg-white cursor-pointer border-l-4 border-green-500"><h4 className="font-bold text-sm">Elena Stan</h4><p className="text-xs text-gray-500 truncate">Vă rog să lăsați sticla la poartă azi.</p></div>
            </div>
            <div className="w-full md:w-2/3 flex flex-col">
              <div className="p-4 border-b border-gray-100 font-bold bg-white">Chat: Elena Stan</div>
              <div className="flex-1 p-4 bg-gray-50 space-y-4 overflow-y-auto">
                <div className="flex justify-start"><div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-sm"><p className="text-sm">Bună ziua! Vă rog să lăsați sticla la poartă azi, am lăsat banii sub preș. Mulțumesc!</p><span className="text-[10px] text-gray-400 mt-1 block">08:15</span></div></div>
                <div className="flex justify-end"><div className="bg-green-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-sm"><p className="text-sm">Sigur! Am transmis șoferului. O zi frumoasă!</p><span className="text-[10px] text-green-200 mt-1 block text-right">08:20</span></div></div>
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                <input type="text" placeholder="Scrie un mesaj..." className="flex-1 p-3 border rounded-xl outline-none focus:border-green-500 text-sm" />
                <button className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700"><Send className="w-5 h-5"/></button>
              </div>
            </div>
          </div>
        )}

        {/* SETĂRI */}
        {view === 'settings' && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Setări Fermă & Aplicație</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Zile de livrare prestabilite</label>
                <div className="flex gap-2">
                  {['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'].map(day => (
                    <button key={day} className={`w-10 h-10 rounded-full font-bold ${['Ma', 'V'].includes(day) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{day}</button>
                  ))}
                </div>
              </div>
              <hr className="border-gray-100"/>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cost standard de livrare (Lei)</label>
                <input type="number" defaultValue="0" className="w-full max-w-xs p-3 border rounded-lg outline-none focus:border-green-500" />
              </div>
              <hr className="border-gray-100"/>
              <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-gray-800">Salvează Modificările</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}