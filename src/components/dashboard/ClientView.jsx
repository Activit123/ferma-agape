import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Package, ShoppingCart, Calendar, Settings, UserPlus, History, MessageCircle, ChevronRight, LogOut, Leaf, Store, Truck, CreditCard, Banknote, CheckCircle, Edit, Save, X, Send, Bell } from 'lucide-react';
import { apiRequest } from '../../config/api';
import { settingsService } from '../../services/settings.service';
import { notificationService } from '../../services/notification.service';
import { orderService } from '../../services/order.service';
import { userService } from '../../services/user.service';
import { messageService } from '../../services/message.service';

export default function ClientView({ onLogout, user }) {
  const [tab, setTab] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  // ================= STĂRI SETĂRI & NOTIFICĂRI =================
  const [appSettings, setAppSettings] = useState({ deliveryFee: 0, deliveryDays: [] });
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // ================= STĂRI CHECKOUT =================
  const [orderType, setOrderType] = useState('PICKUP'); 
  const [deliveryDays, setDeliveryDays] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================= STĂRI SETĂRI PROFIL =================
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    address: user.address || ''
  });

  // ================= STĂRI CHAT & ȘOFER =================
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myDriver, setMyDriver] = useState(null); // Șoferul alocat pe ziua de azi
  const [activeChatUser, setActiveChatUser] = useState(null); // null = vorbim cu Ferma (Admin). object = vorbim cu Șoferul
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, tab]);

  // ================= FETCH DATE =================
  useEffect(() => {
    // 1. Aducem produsele
    apiRequest('/api/products')
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setProducts(data) : setProducts([]))
      .catch(console.error);

    // 2. Aducem șoferul de azi (dacă există)
    orderService.getMyDriverToday()
      .then(driver => {
        if (driver && driver.id) setMyDriver(driver);
      })
      .catch(console.error);

    // NOU: Aducem setările (Taxă + Zile) și Notificările
    settingsService.get().then(setAppSettings).catch(console.error);
    notificationService.getMyNotifications().then(setNotifications).catch(console.error);
  }, []);

  useEffect(() => {
    if (tab === 'orders') {
      orderService.getMyOrders().then(setMyOrders).catch(console.error);
    }
  }, [tab]);

  // Polling pentru Chat (Dinamic în funcție de cu cine vorbim)
  useEffect(() => {
    let interval;
    if (tab === 'chat') {
      const fetchChat = async () => {
        let msgs = [];
        if (activeChatUser) {
          // Dacă e selectat un user specific (Șoferul)
          msgs = await messageService.getChatBetweenUsers(activeChatUser.id);
        } else {
          // Dacă e null, înseamnă că vorbim cu Ferma (Admin-ul default)
          msgs = await messageService.getMyChat();
        }
        setChatMessages(msgs);
      };
      
      fetchChat(); 
      interval = setInterval(fetchChat, 3000); 
    }
    return () => clearInterval(interval);
  }, [tab, activeChatUser]);

  // ================= LOGICĂ COȘ =================
  const addToCart = (product) => setCart([...cart, product]);
  const clearCart = () => setCart([]);
  
  const groupedCart = cart.reduce((acc, item) => {
    const existingIndex = acc.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      const newAcc = [...acc];
      newAcc[existingIndex] = { ...newAcc[existingIndex], quantity: newAcc[existingIndex].quantity + 1 };
      return newAcc;
    }
    return [...acc, { ...item, quantity: 1 }];
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const total = orderType === 'SUBSCRIPTION' ? cartTotal + appSettings.deliveryFee : cartTotal;

  const toggleDay = (day) => {
    if (deliveryDays.includes(day)) setDeliveryDays(deliveryDays.filter(d => d !== day));
    else setDeliveryDays([...deliveryDays, day]);
  };

  // ================= LOGICĂ COMENZI / ABONAMENTE =================
  const handlePlaceOrder = async () => {
    if (orderType === 'SUBSCRIPTION' && deliveryDays.length === 0) {
      alert('Te rugăm să alegi cel puțin o zi de livrare pentru abonament!');
      return;
    }

    setIsSubmitting(true);
    const orderData = {
      type: orderType,
      deliveryDays: orderType === 'SUBSCRIPTION' ? deliveryDays : [],
      paymentMethod: paymentMethod,
      items: groupedCart.map(item => ({ productId: item.id, quantity: item.quantity }))
    };

    try {
      const res = await orderService.create(orderData);
      const data = await res.json();
      
      if (res.ok) {
        if (data.requiresPayment && data.paymentUrl) {
          alert('Vei fi redirecționat către platforma de plată securizată PayU...');
          clearCart(); // <--- ACEASTA ESTE LINIA ADĂUGATĂ (Golim coșul)
          window.location.href = data.paymentUrl; 
        } else {
          alert('Comanda a fost plasată cu succes!');
          clearCart();
          setTab('orders'); 
        }
      } else {
        alert(`Eroare: ${data.message}`);
      }
    } catch (err) { alert('A apărut o eroare la plasarea comenzii.'); } 
    finally { setIsSubmitting(false); }
  };

  const handleMyOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm('Ești sigur că vrei să efectuezi această acțiune?')) return;
    try {
      await orderService.updateMyStatus(orderId, newStatus);
      orderService.getMyOrders().then(setMyOrders).catch(console.error);
    } catch (err) { alert("A apărut o eroare la modificarea statusului."); }
  };

  // ================= LOGICĂ PROFIL =================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.updateMe(profileForm);
      const data = await res.json();
      if (res.ok) {
        alert("Datele au fost actualizate! Modificările vor fi vizibile complet la următoarea logare.");
        setIsEditingProfile(false);
      } else {
        alert(data.message);
      }
    } catch (err) { alert("Eroare la salvarea datelor."); }
  };

  // ================= HARDWARE BACK BUTTON (ANDROID) =================
  const stateRef = useRef({ tab, activeChatUser, isEditingProfile });
  useEffect(() => {
    stateRef.current = { tab, activeChatUser, isEditingProfile };
  });

  useEffect(() => {
    let listener;
    const addBackListener = async () => {
      try {
        const { App: CapacitorApp } = await import('@capacitor/app');
        listener = await CapacitorApp.addListener('backButton', () => {
          const s = stateRef.current;
          if (s.isEditingProfile) {
            setIsEditingProfile(false);
          } else if (s.activeChatUser && s.tab === 'chat') {
            setActiveChatUser(null);
          } else if (s.tab !== 'home') {
            setTab('home');
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

  // ================= LOGICĂ CHAT =================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      // Dacă activeChatUser există, trimitem la id-ul șoferului. Dacă e null, trimitem fermei.
      const receiverId = activeChatUser ? activeChatUser.id : null;
      await messageService.sendMessage(newMessage, receiverId); 
      setNewMessage('');
      
      // Reîncărcare imediată
      if (activeChatUser) {
        setChatMessages(await messageService.getChatBetweenUsers(activeChatUser.id));
      } else {
        setChatMessages(await messageService.getMyChat());
      }
      scrollToBottom(); 
    } catch (err) { alert('Eroare la trimiterea mesajului.'); }
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const handleReadNotification = async (nId) => {
    await notificationService.markAsRead(nId);
    setNotifications(await notificationService.getMyNotifications());
  };

  const NotificationBell = () => (
    <div className="relative">
      <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 bg-emerald-800 hover:bg-emerald-600 rounded-full text-white relative transition">
        <Bell className="w-5 h-5"/>
        {unreadNotifs > 0 && <span className="absolute top-0 right-0 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-emerald-800 flex items-center justify-center text-[8px] font-bold text-white">{unreadNotifs}</span>}
      </button>
      {isNotificationsOpen && (
        <div className="fixed top-24 left-4 right-4 md:absolute md:top-12 md:left-0 md:right-auto md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 max-h-[70vh] md:max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-2 mb-2">
            <h3 className="font-bold text-slate-800">Notificări</h3>
            <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
          </div>
          {notifications.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nu ai notificări.</p>}
          {notifications.map(n => (
            <div key={n.id} onClick={() => handleReadNotification(n.id)} className={`p-3 mb-2 rounded-xl cursor-pointer transition ${n.isRead ? 'bg-gray-50 opacity-60' : 'bg-emerald-50 border border-emerald-100 shadow-sm'}`}>
              <p className={`text-[10px] uppercase font-bold mb-1 ${n.type === 'URGENT' ? 'text-red-600' : 'text-emerald-800'}`}>{n.title}</p>
              <p className="text-sm text-slate-800 font-medium leading-tight">{n.content}</p>
              <p className="text-[10px] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString('ro-RO')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ================= RENDER TABS =================
  const renderContent = () => {
    switch (tab) {
      case 'home':
        return (
          <div className="space-y-6 animate-fade-in pb-10">
            {!user.isActive && (
              <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
                <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-orange-800 font-bold">Cont în curs de verificare!</p>
                  <p className="text-sm text-orange-700">Administratorul va aproba contul în curând. Până atunci poți vedea produsele și poți face simulări de comenzi.</p>
                </div>
              </div>
            )}
            
            <div>
              <h2 className="font-bold text-2xl mb-4 text-slate-800">Produse disponibile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {products.map(p => (
                  <div key={p.id} className={`flex bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition ${!p.isAvailable && 'opacity-60 grayscale'}`}>
                    <img src={p.images && p.images.length > 0 ? p.images[0] : "https://via.placeholder.com/150"} alt={p.name} className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover border" />
                    <div className="ml-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-800">{p.name} <span className="text-sm font-normal text-gray-500">({p.unit})</span></h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                        <p className="text-emerald-600 font-bold mt-2 text-lg">{p.price} Lei</p>
                      </div>
                      <div className="text-right mt-2">
                        {p.isAvailable ? (
                          <button onClick={() => addToCart(p)} disabled={!user.isActive} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50">
                            Adaugă în coș
                          </button>
                        ) : (
                          <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">Epuizat</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="text-slate-500 col-span-full text-center py-10 bg-white rounded-xl border border-dashed">Nu sunt produse disponibile momentan.</p>}
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="w-full h-full md:max-w-2xl md:mx-auto flex flex-col animate-fade-in bg-white md:rounded-2xl md:shadow-sm md:border md:my-6 overflow-hidden">
            
            {/* HEADER CHAT DINAMIC (Fermă sau Șofer) */}
            <div className={`p-4 ${activeChatUser ? 'bg-blue-600' : 'bg-emerald-700'} text-white flex items-center gap-3 shrink-0 transition-colors`}>
               <button onClick={() => setTab('home')} className={`p-2 -ml-2 rounded-full transition flex items-center font-bold text-sm ${activeChatUser ? 'hover:bg-blue-500' : 'hover:bg-emerald-600'}`}>
                 <ChevronRight className="w-5 h-5 rotate-180 mr-1"/> Acasă
               </button>
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                 {activeChatUser ? activeChatUser.firstName.charAt(0) : <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain"/>}
               </div>
               <div>
                 <h2 className="font-bold leading-tight">{activeChatUser ? `Șofer: ${activeChatUser.firstName} ${activeChatUser.lastName}` : 'Ferma Agape'}</h2>
                 <p className={`text-xs ${activeChatUser ? 'text-blue-100' : 'text-emerald-100'}`}>
                   {activeChatUser ? `📞 ${activeChatUser.phone}` : 'Răspundem de obicei în câteva minute'}
                 </p>
               </div>
            </div>

            {/* MESAJE */}
            <div className="flex-1 p-4 bg-slate-50 overflow-y-auto flex flex-col gap-3">
               {chatMessages.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">Începe conversația! 👋</p>}
               
               {chatMessages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${isMe ? (activeChatUser ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-emerald-600 text-white self-end rounded-tr-none') : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none'}`}>
                       <p className="text-sm font-medium">{msg.content}</p>
                       <span className={`text-[10px] block mt-1 ${isMe ? (activeChatUser ? 'text-blue-200 text-right' : 'text-emerald-200 text-right') : 'text-slate-400'}`}>
                         {new Date(msg.createdAt).toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}
                       </span>
                    </div>
                  )
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* INPUT MESAJ */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 shrink-0">
               <input 
                 type="text" 
                 value={newMessage} 
                 onChange={e => setNewMessage(e.target.value)} 
                 onFocus={() => setTimeout(scrollToBottom, 300)} 
                 className={`flex-1 border-2 border-slate-200 rounded-full px-4 py-2 outline-none font-medium text-sm transition bg-slate-50 ${activeChatUser ? 'focus:border-blue-500' : 'focus:border-emerald-500'}`} 
                 placeholder="Scrie un mesaj..."
               />
               <button type="submit" disabled={!newMessage.trim()} className={`${activeChatUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-700 hover:bg-emerald-800'} text-white p-3 rounded-full transition shadow-md disabled:opacity-50`}>
                 <Send className="w-5 h-5"/>
               </button>
            </form>
          </div>
        );

      case 'cart':
        return (
          <div className="max-w-2xl mx-auto animate-fade-in pb-10">
            <h2 className="font-bold text-2xl mb-6 text-slate-800">Coșul meu</h2>
            {groupedCart.length === 0 ? (
              <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border border-dashed shadow-sm">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                <p>Coșul este gol. Începe să adaugi produse!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {groupedCart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                      <div className="flex items-center gap-4">
                        <img src={item.images?.[0] || "https://via.placeholder.com/150"} className="w-12 h-12 rounded-lg object-cover" alt="" />
                        <div><span className="font-bold text-slate-800 block">{item.name} <span className="text-sm font-normal text-gray-500">({item.unit})</span></span><span className="text-sm font-medium text-emerald-600">{item.quantity} buc.</span></div>
                      </div>
                      <span className="font-bold text-slate-800 text-lg">{item.price * item.quantity} Lei</span>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl mb-8 flex justify-between items-center border border-emerald-100">
                    <span className="font-bold text-xl text-emerald-900">Total Produse:</span>
                    <span className="font-extrabold text-2xl text-emerald-700">{cartTotal} Lei</span>
                </div>
                <div className="flex gap-4">
                  <button onClick={clearCart} className="w-1/3 bg-white text-red-500 font-bold py-4 rounded-xl border border-red-200 hover:bg-red-50 transition">Goleste Coș</button>
                  <button onClick={() => setTab('checkout')} className="w-2/3 bg-emerald-700 text-white font-bold py-4 rounded-xl hover:bg-emerald-800 shadow-lg text-lg transition">Pasul Următor ➔</button>
                </div>
              </>
            )}
          </div>
        );

      case 'checkout':
        return (
          <div className="max-w-2xl mx-auto animate-fade-in pb-10">
            <button onClick={() => setTab('cart')} className="text-emerald-700 font-bold text-sm flex items-center mb-6 hover:underline"><ChevronRight className="w-4 h-4 rotate-180"/> Întoarce-te la Coș</button>
            <h2 className="font-bold text-2xl mb-6 text-slate-800">Finalizare Comandă</h2>

            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4">1. Cum dorești produsele?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setOrderType('PICKUP')} className={`cursor-pointer border-2 rounded-xl p-4 flex items-start gap-3 transition ${orderType === 'PICKUP' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                  <Store className={`w-6 h-6 mt-1 ${orderType === 'PICKUP' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <div><h4 className={`font-bold ${orderType === 'PICKUP' ? 'text-emerald-800' : 'text-slate-700'}`}>Ridicare de la Fermă</h4><p className="text-xs text-gray-500 mt-1">Comandă unică. Vii personal să ridici produsele.</p></div>
                </div>
                <div onClick={() => setOrderType('SUBSCRIPTION')} className={`cursor-pointer border-2 rounded-xl p-4 flex items-start gap-3 transition ${orderType === 'SUBSCRIPTION' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                  <Truck className={`w-6 h-6 mt-1 ${orderType === 'SUBSCRIPTION' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <div><h4 className={`font-bold ${orderType === 'SUBSCRIPTION' ? 'text-emerald-800' : 'text-slate-700'}`}>Abonament (Acasă)</h4><p className="text-xs text-gray-500 mt-1">Livrare la poartă în zilele alese.</p></div>
                </div>
              </div>

              {orderType === 'SUBSCRIPTION' && (
                <div className="mt-6 animate-fade-in border-t pt-4">
                  <h3 className="font-bold text-sm text-slate-700 mb-3">Alege zilele de livrare din săptămână:</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'].map(day => (
                      <button key={day} onClick={() => toggleDay(day)} className={`px-4 py-2 rounded-full text-sm font-bold border transition ${deliveryDays.includes(day) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-gray-300 hover:border-emerald-400'}`}>{day}</button>
                    ))}
                  </div>
                  <p className="text-xs text-emerald-700 mt-3 font-medium bg-emerald-50 p-2 rounded-lg">*Totalul calculat se va achita pentru **fiecare livrare** efectuată în zilele alese.</p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4">2. Cum dorești să plătești?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setPaymentMethod('CASH')} className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition ${paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <Banknote className={`w-6 h-6 ${paymentMethod === 'CASH' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h4 className={`font-bold ${paymentMethod === 'CASH' ? 'text-blue-800' : 'text-slate-700'}`}>Cash la Livrare</h4>
                </div>
                <div onClick={() => setPaymentMethod('CARD')} className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition ${paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'CARD' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h4 className={`font-bold ${paymentMethod === 'CARD' ? 'text-blue-800' : 'text-slate-700'}`}>Plată Online (Card)</h4>
                </div>
              </div>
            </div>

            <button onClick={handlePlaceOrder} disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 shadow-xl text-lg transition disabled:opacity-70 flex justify-center items-center">
              {isSubmitting ? 'Se procesează...' : <><CheckCircle className="w-6 h-6 mr-2"/> Confirmă Comanda ({total} Lei)</>}
            </button>
          </div>
        );

      case 'orders':
        return (
          <div className="max-w-4xl mx-auto animate-fade-in pb-10">
            <button onClick={() => setTab('profile')} className="text-emerald-700 font-bold text-sm flex items-center mb-6 hover:underline"><ChevronRight className="w-4 h-4 rotate-180"/> Întoarce-te la Profil</button>
            <h2 className="font-bold text-2xl mb-6 text-slate-800">Comenzile / Abonamentele Mele</h2>
            
            {myOrders.length === 0 ? (
              <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border border-dashed shadow-sm">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                <p>Nu ai plasat nicio comandă încă.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {myOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b flex flex-col md:flex-row justify-between md:items-center gap-2">
                      <div>
                        <span className="font-bold text-slate-800 text-lg mr-3">{order.orderNumber}</span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${order.type === 'SUBSCRIPTION' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                          {order.type === 'SUBSCRIPTION' ? 'Abonament Livrare' : 'Ridicare Fermă'}
                        </span>
                      </div>
                      <div className="font-bold text-emerald-600 text-lg">{order.totalAmount} Lei {order.type === 'SUBSCRIPTION' && <span className="text-xs text-gray-500">/ livrare</span>}</div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-6 mb-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Produse Incluse:</p>
                          <ul className="space-y-1">
                            {order.items.map(item => (
                              <li key={item.id} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{item.quantity}x</span> {item.product.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {order.type === 'SUBSCRIPTION' && order.deliveryDays.length > 0 && (
                          <div className="md:text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Zile Livrare:</p>
                            <div className="flex flex-wrap gap-1 justify-start md:justify-end">
                              {order.deliveryDays.map(day => (
                                <span key={day} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded text-xs font-bold">{day}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
                         <div>
                           <p className="text-xs text-gray-500">Creat la: {new Date(order.createdAt).toLocaleDateString('ro-RO')}</p>
                           <p className="text-xs font-semibold text-slate-700 mt-2">Status curent: 
                             <span className={`ml-2 px-2 py-1 rounded text-[10px] font-bold uppercase
                               ${order.status === 'PAUSED' ? 'bg-orange-100 text-orange-800' : 
                                 order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                               {order.status}
                             </span>
                           </p>
                         </div>
                         <div className="flex gap-2 w-full md:w-auto">
                           {order.type === 'SUBSCRIPTION' && !['CANCELLED', 'DELIVERED', 'UNDELIVERED'].includes(order.status) && (
                             <>
                               {order.status === 'PAUSED' ? (
                                 <button onClick={() => handleMyOrderStatus(order.id, 'PENDING')} className="flex-1 md:flex-none bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-sm">▶ Reia Abonament</button>
                               ) : (
                                 <button onClick={() => handleMyOrderStatus(order.id, 'PAUSED')} className="flex-1 md:flex-none bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-200 transition shadow-sm">⏸ Pune pe Pauză</button>
                               )}
                             </>
                           )}
                           {!['CANCELLED', 'DELIVERED', 'UNDELIVERED'].includes(order.status) && (
                             <button onClick={() => handleMyOrderStatus(order.id, 'CANCELLED')} className="flex-1 md:flex-none bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition shadow-sm">❌ Anulează</button>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-5xl mx-auto animate-fade-in pb-10">
            <h2 className="font-bold text-2xl mb-6 text-slate-800 hidden md:block">Contul Meu</h2>
            
            <div className="grid gap-6 lg:grid-cols-12">
              
              {/* COLOANA STÂNGA: DATE PROFIL */}
              <div className="lg:col-span-5">
                <div className="bg-white p-8 rounded-2xl shadow-sm border relative h-full flex flex-col">
                  <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="absolute top-4 right-4 text-emerald-700 hover:bg-emerald-50 p-2 rounded-lg transition flex items-center text-sm font-bold">
                    {isEditingProfile ? <><X className="w-4 h-4 mr-1"/> Anulează</> : <><Edit className="w-4 h-4 mr-1"/> Editează</>}
                  </button>

                  <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0"><UserPlus className="h-10 w-10"/></div>
                  
                  {!isEditingProfile ? (
                    <div className="text-center flex-1 flex flex-col justify-center">
                      <h2 className="font-bold text-2xl text-slate-800">{user.firstName} {user.lastName}</h2>
                      <p className="text-slate-500 mt-2 font-medium">{user.address}</p>
                      <p className="text-slate-500 mt-1 font-medium">{user.phone}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="mt-4 text-left grid gap-4 animate-fade-in flex-1">
                      <label className="text-sm font-semibold text-gray-600">Prenume: <input type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="mt-1 w-full border rounded-lg p-3 outline-none focus:border-emerald-500 bg-gray-50" required/></label>
                      <label className="text-sm font-semibold text-gray-600">Nume: <input type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="mt-1 w-full border rounded-lg p-3 outline-none focus:border-emerald-500 bg-gray-50" required/></label>
                      <label className="text-sm font-semibold text-gray-600">Telefon: <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="mt-1 w-full border rounded-lg p-3 outline-none focus:border-emerald-500 bg-gray-50" required/></label>
                      <label className="text-sm font-semibold text-gray-600">Adresă: <input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="mt-1 w-full border rounded-lg p-3 outline-none focus:border-emerald-500 bg-gray-50" required/></label>
                      <button type="submit" className="mt-auto bg-emerald-700 text-white font-bold py-3 rounded-xl hover:bg-emerald-800 transition flex justify-center items-center shadow-md"><Save className="w-5 h-5 mr-2"/> Salvează</button>
                    </form>
                  )}
                </div>
              </div>

              {/* COLOANA DREAPTA: ACȚIUNI */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="grid gap-4 sm:grid-cols-2">
                    <button onClick={() => setTab('orders')} className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border hover:border-emerald-200 transition group">
                      <div className="flex flex-col items-start">
                        <History className="w-8 h-8 mb-3 text-emerald-600 group-hover:scale-110 transition-transform"/>
                        <span className="font-bold text-lg text-slate-800">Istoric Comenzi</span> 
                        <span className="text-sm text-slate-500 mt-1 text-left">Vezi comenzile anterioare</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-300"/>
                    </button>
                    
                    <button onClick={() => setTab('orders')} className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border hover:border-emerald-200 transition group">
                      <div className="flex flex-col items-start">
                        <Calendar className="w-8 h-8 mb-3 text-emerald-600 group-hover:scale-110 transition-transform"/>
                        <span className="font-bold text-lg text-slate-800">Abonamentul Meu</span> 
                        <span className="text-sm text-slate-500 mt-1 text-left">Gestionează livrările recurente</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-300"/>
                    </button>
                </div>
                
                {/* Butoane Chat */}
                <div className="grid gap-4">
                  <button onClick={() => { setActiveChatUser(null); setTab('chat'); }} className="w-full flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border hover:border-emerald-200 transition">
                    <span className="flex items-center font-bold text-slate-700"><MessageCircle className="w-6 h-6 mr-3 text-emerald-500"/> Chat cu Fermierul</span> 
                    <ChevronRight className="w-5 h-5 text-gray-400"/>
                  </button>

                  {myDriver && (
                    <button onClick={() => { setActiveChatUser(myDriver); setTab('chat'); }} className="w-full flex items-center justify-between bg-blue-50 border-blue-200 p-5 rounded-xl shadow-sm border hover:bg-blue-100 transition">
                      <span className="flex items-center font-bold text-blue-800"><Truck className="w-6 h-6 mr-3 text-blue-600"/> Contactează Șoferul de Azi ({myDriver.firstName})</span> 
                      <ChevronRight className="w-5 h-5 text-blue-600"/>
                    </button>
                  )}
                </div>

                {/* Buton deconectare vizibil doar pe mobil */}
                <button onClick={onLogout} className="w-full flex md:hidden items-center justify-center bg-red-50 text-red-600 font-bold p-4 rounded-xl shadow-sm border border-red-100 hover:bg-red-100 transition mt-8">
                  <LogOut className="w-5 h-5 mr-2"/> Deconectare
                </button>

              </div>
            </div>
          </div>
        );
      default:
        return <div>Secțiune inexistentă</div>;
    }
  };

  return (
    <div className="h-[100dvh] md:h-screen bg-[#f7f1e8] flex flex-col md:flex-row font-sans overflow-hidden">
      <header className={`${tab === 'chat' ? 'hidden' : 'flex'} md:hidden bg-emerald-700 text-white p-5 rounded-b-3xl shadow-lg sticky top-0 z-30 justify-between items-center shrink-0`}>
        <div><h1 className="text-xl font-serif font-bold">Ferma Agape</h1><p className="text-emerald-100 text-sm mt-1">Salut, {user.firstName}! 👋</p></div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Leaf className="h-8 w-8 text-emerald-300 opacity-50" />
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain hidden sm:block" />
          <button onClick={onLogout} className="p-2 bg-emerald-800 hover:bg-emerald-900 rounded-full transition text-white shadow-sm" title="Deconectare">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 min-h-screen p-6 flex-col sticky top-0 z-20 shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-700 p-2 rounded-xl text-white"><img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" /></div>
            <div>
              <h1 className="text-xl font-serif font-bold text-slate-900">Ferma Agape</h1>
              <p className="text-sm text-slate-500 truncate max-w-[140px]">Salut, {user.firstName}!</p>
            </div>
          </div>
          <NotificationBell />
        </div>
        <nav className="flex flex-col space-y-2 flex-1">
          <button onClick={() => setTab('home')} className={`flex items-center p-4 rounded-xl text-sm font-semibold transition ${tab === 'home' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}><Package className="w-5 h-5 mr-3" /> Produse</button>
          <button onClick={() => setTab('cart')} className={`flex items-center justify-between p-4 rounded-xl text-sm font-semibold transition ${tab === 'cart' || tab === 'checkout' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}><div className="flex items-center"><ShoppingCart className="w-5 h-5 mr-3" /> Coșul meu</div>{cart.length > 0 && <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-xs">{cart.length}</span>}</button>
          <button onClick={() => setTab('profile')} className={`flex items-center p-4 rounded-xl text-sm font-semibold transition ${tab === 'profile' || tab === 'orders' || tab === 'chat' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}><Settings className="w-5 h-5 mr-3" /> Setări Cont</button>
        </nav>
        <button onClick={onLogout} className="flex items-center justify-center p-4 text-red-500 hover:bg-red-50 rounded-xl font-bold transition"><LogOut className="w-5 h-5 mr-2" /> Deconectare</button>
      </aside>

      <main className={`flex-1 flex flex-col w-full relative ${tab === 'chat' ? 'p-0 overflow-hidden' : 'p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto'}`}>
        <div className={tab === 'chat' ? 'h-full w-full flex flex-col' : 'max-w-6xl mx-auto'}>
          {renderContent()}
        </div>
      </main>

      <nav className={`${tab === 'chat' ? 'hidden' : 'flex'} md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 justify-around py-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0`}>
        <button onClick={() => setTab('home')} className={`flex flex-col items-center p-2 rounded-lg transition ${tab === 'home' ? 'text-emerald-700' : 'text-slate-400'}`}><Package className={`h-6 w-6 mb-1`} /><span className="text-[10px] font-bold">Produse</span></button>
        <button onClick={() => setTab('cart')} className={`flex flex-col items-center p-2 rounded-lg transition relative ${tab === 'cart' || tab === 'checkout' ? 'text-emerald-700' : 'text-slate-400'}`}><ShoppingCart className={`h-6 w-6 mb-1`} /><span className="text-[10px] font-bold">Coș</span>{cart.length > 0 && <span className="absolute top-1 right-2 bg-red-500 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">{cart.length}</span>}</button>
        <button onClick={() => setTab('profile')} className={`flex flex-col items-center p-2 rounded-lg transition ${tab === 'profile' || tab === 'orders' || tab === 'chat' ? 'text-emerald-700' : 'text-slate-400'}`}><Settings className={`h-6 w-6 mb-1`} /><span className="text-[10px] font-bold">Cont</span></button>
      </nav>
    </div>
  );
}