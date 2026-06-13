import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, X, Star, ChevronRight, CheckCircle, Leaf, Droplets, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiRequest } from '../config/api';

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600189022618-f2b74070a316?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=600&auto=format&fit=crop"
];

const testimonials = [
  { name: "Maria I.", text: "Cel mai bun lapte pe care l-am băut de când eram copil. Înghețata este senzațională, livrarea întotdeauna punctuală!", rating: 5 },
  { name: "Andrei V.", text: "O fermă de încredere! Smântâna și ouăle sunt mereu proaspete. Apreciem foarte mult calitatea și efortul familiei.", rating: 5 },
  { name: "Elena S.", text: "Abonamentul săptămânal este o salvare. Știu sigur că am lapte proaspăt la ușă, curat și fără conservanți.", rating: 5 }
];

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [productsPreview, setProductsPreview] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLoadingProducts(true);
    apiRequest('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProductsPreview(data.filter(p => p.isAvailable).slice(0, 3));
        } else {
          setProductsPreview([]);
        }
      })
      .catch(err => console.error("Eroare incarcare produse:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-emerald-200">
      <Helmet>
        <title>Ferma Agape - Lapte, Înghețată și Lactate proaspete livrate la ușă</title>
        <meta name="description" content="Ferma Agape (Pătrăuți) livrează lapte proaspăt, înghețată, brânză, smântână, iaurt și ouă proaspete. Livrări în Suceava, Mitoc, Ițcani, Burdujeni, Șcheia, Salcea." />
        <meta name="keywords" content="lapte proaspat, livrare lapte suceava, ferma agape, lactate naturale, inghetata, unt, smantana, branza dulce, iaurt, cas, oua, patrauti, suceava, burdujeni, itcani, scheia" />
        <meta property="og:title" content="Ferma Agape - Produse din fermă direct la ușa ta" />
        <meta property="og:description" content="Lactate tradiționale 100% naturale: lapte proaspăt, înghețată artizanală, smântână și ouă, livrate direct la tine acasă în județul Suceava." />
      </Helmet>

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Ferma Agape" className="h-12 w-12 object-contain drop-shadow-sm" />
            <span className={`text-2xl font-serif font-bold tracking-tight transition-colors ${isScrolled ? 'text-slate-900' : 'text-white drop-shadow-md'}`}>Ferma Agape</span>
          </Link>

          <nav className={`hidden md:flex items-center gap-10 text-sm font-medium transition-colors ${isScrolled ? 'text-slate-700' : 'text-white/90 drop-shadow-md'}`}>
            <a href="#poveste" className="hover:text-emerald-500 transition">Despre noi</a>
            <a href="#produse" className="hover:text-emerald-500 transition">Produse</a>
            <a href="#recenzii" className="hover:text-emerald-500 transition">Recenzii</a>
            <a href="#contact" className="hover:text-emerald-500 transition">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className={`px-5 py-2.5 rounded-full font-semibold transition ${isScrolled ? 'text-emerald-700 hover:bg-emerald-50' : 'text-white hover:bg-white/20 backdrop-blur-sm'}`}>Autentificare</Link>
            <Link to="/register" className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-semibold shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all">Comandă Acum</Link>
          </div>

          <button className={`md:hidden p-2 transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t md:hidden flex flex-col p-6 gap-4">
            <a href="#poveste" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-800">Despre noi</a>
            <a href="#produse" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-800">Produse</a>
            <a href="#recenzii" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-800">Recenzii</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-800">Contact</a>
            <hr className="my-2" />
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-center py-3 font-bold text-emerald-700">Intră în cont</Link>
            <Link to="/register" onClick={() => setIsMenuOpen(false)} className="text-center py-3 rounded-full bg-emerald-600 text-white font-bold">Comandă Acum</Link>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=2074&auto=format&fit=crop" alt="Peisaj Ferma Agape" className="w-full h-full object-cover scale-105 animate-[slow-pan_20s_ease-in-out_infinite_alternate]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#FDFBF7]"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white mt-16">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <motion.span variants={fadeIn} className="inline-block py-1 px-4 rounded-full border border-white/30 backdrop-blur-md bg-white/10 text-sm font-semibold tracking-widest uppercase mb-4">
                Pătrăuți, Suceava
              </motion.span>
              <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-serif font-bold leading-tight drop-shadow-lg">
                Gustul Autentic al<br/>Naturii, la Tine Acasă.
              </motion.h1>
              <motion.p variants={fadeIn} className="max-w-2xl mx-auto text-lg md:text-xl text-white/90 drop-shadow-md leading-relaxed">
                Ferma Agape îți aduce lapte proaspăt, smântână, ouă și înghețată artizanală, direct de la sursă, cu grijă pentru familia ta.
              </motion.p>
              <motion.div variants={fadeIn} className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="px-8 py-4 rounded-full bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all transform hover:-translate-y-1">
                  Vezi Oferta și Comandă
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce text-white/50">
            <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center p-1"><div className="w-1.5 h-3 bg-current rounded-full"></div></div>
          </div>
        </section>

        {/* POVESTE - EDITORIAL STYLE */}
        <section id="poveste" className="py-24 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="space-y-8">
                <div>
                  <h4 className="text-emerald-700 font-bold tracking-[0.2em] uppercase text-sm mb-3">Misiunea Noastră</h4>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">
                    Tradiție transformată în prospețime pură.
                  </h2>
                </div>
                <div className="w-20 h-1 bg-emerald-600 rounded"></div>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Ferma Agape nu este doar o afacere. Este familia noastră. În Pătrăuți, Suceava, lucrăm cu grijă și dedicare pentru a obține produse lactate curate, oneste, fără absolut niciun aditiv.
                </p>
                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-50">
                    <Droplets className="w-10 h-10 text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Muls Astăzi, Livrat Astăzi</h3>
                    <p className="text-slate-500 text-sm">Garantăm prospețimea absolută. Laptele ajunge la tine în câteva ore de la colectare.</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-50">
                    <Leaf className="w-10 h-10 text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">100% Curat & Natural</h3>
                    <p className="text-slate-500 text-sm">Fără conservanți, fără amestecuri artificiale. Doar bunătatea brută a naturii.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative h-[600px] hidden lg:block">
                <img src="https://images.unsplash.com/photo-1511216335778-7cb8f49fa7a3?q=80&w=1000&auto=format&fit=crop" loading="lazy" alt="Lapte Proaspat" className="absolute top-0 right-0 w-4/5 h-[450px] object-cover rounded-[2rem] shadow-2xl z-10" />
                <img src="https://images.unsplash.com/photo-1628043690497-2bf3b573e3dd?q=80&w=1000&auto=format&fit=crop" loading="lazy" alt="Fermier" className="absolute bottom-0 left-0 w-3/5 h-[350px] object-cover rounded-[2rem] shadow-xl border-8 border-[#FDFBF7] z-20" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* PRODUSE */}
        <section id="produse" className="py-24 bg-[#1A4027] text-white relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h4 className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm mb-3">Din Fermă în Farfurie</h4>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Produse Esențiale</h2>
              <p className="text-emerald-100/80 text-lg">
                Fiecare sticlă de lapte și fiecare lingură de smântână poartă garanția familiei noastre. Calitate premium, gust autentic românesc.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {productsPreview.map((product, idx) => {
                const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : STOCK_IMAGES[idx % STOCK_IMAGES.length];
                return (
                  <motion.article 
                    key={product.id} 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15 }}
                    className="group bg-white rounded-[2rem] overflow-hidden text-slate-900 shadow-xl hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img src={imageUrl} loading="lazy" alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-emerald-800 font-bold px-3 py-1 rounded-full text-sm">
                        {product.unit}
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 className="text-2xl font-bold font-serif mb-2 group-hover:text-emerald-700 transition-colors">{product.name}</h3>
                      <p className="text-slate-500 mb-6 line-clamp-2">{product.description || "Produs artizanal din lapte proaspăt, 100% natural."}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-emerald-800">{product.price} <span className="text-base font-medium">Lei</span></span>
                        <Link to="/register" className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
              {loadingProducts && <p className="text-white/50 text-center col-span-3 py-10">Se încarcă bunătățile...</p>}
            </div>
            
            <div className="mt-16 text-center">
              <Link to="/register" className="inline-flex items-center gap-2 text-white border border-white/30 rounded-full px-8 py-3 hover:bg-white hover:text-emerald-900 transition-colors font-bold tracking-wide">
                Vezi toată gama <ChevronRight className="w-5 h-5"/>
              </Link>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS / SOCIAL PROOF */}
        <section id="recenzii" className="py-24 bg-emerald-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Ce Spun Clienții Noștri</h2>
              <p className="text-slate-600">Comunitatea din Suceava care alege sănătatea în fiecare zi.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2rem] shadow-sm border border-emerald-100/50"
                >
                  <div className="flex text-[#D4AF37] mb-4">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-slate-700 mb-6 italic leading-relaxed">"{t.text}"</p>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">Client Verificat</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICII & CONTACT */}
        <section id="contact" className="py-24 max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="lg:w-1/2 p-12 md:p-20 flex flex-col justify-center relative z-10">
              <h4 className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm mb-3">Livrări Acasă</h4>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">Prospețime direct la ușa ta.</h2>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Livrăm cu mașini frigorifice în Suceava și împrejurimi (Pătrăuți, Mitoc, Ițcani, Burdujeni, Șcheia, Salcea, Plopeni). 
                Abonamentul nostru îți aduce pachetul săptămânal fără să te mai gândești la asta!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <Link to="/register" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-center transition-colors shadow-lg">
                  Creează un Abonament
                </Link>
              </div>
            </div>
            
            <div className="lg:w-1/2 bg-white p-12 md:p-20 relative z-10 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Unde ne găsești</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Locație Fermă & Magazin</h4>
                    <p className="text-slate-600 mt-1">Str. Tudor Arghezi nr. 18, Pătrăuți, Suceava</p>
                    <a href="https://maps.app.goo.gl/uZgDq8EPwyd4GNhX7" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold text-sm mt-2 inline-block hover:underline">Deschide în Google Maps</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Contact Direct</h4>
                    <p className="text-slate-600 mt-1">Proprietar: Titus (0744 707 486)</p>
                    <p className="text-slate-600">Contact Ouă: Brendon (0741 686 060)</p>
                    <p className="text-slate-600">General: 0787 292 044</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Program</h4>
                    <p className="text-slate-600 mt-1">Luni – Sâmbătă: 07:00 – 22:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FLOATING CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        animate={{ opacity: isScrolled ? 1 : 0, y: isScrolled ? 0 : 100 }}
        className="fixed bottom-6 right-6 z-50 pointer-events-none"
      >
        <Link to="/register" className="pointer-events-auto shadow-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transform hover:scale-105 transition-all">
          <span className="hidden sm:inline">Vreau Produse Proaspete</span>
          <span className="sm:hidden">Comandă</span>
          <ChevronRight className="w-5 h-5"/>
        </Link>
      </motion.div>

      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <img src="/logo.png" loading="lazy" alt="Ferma Agape" className="h-10 w-10 mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
          <p className="text-sm">&copy; {new Date().getFullYear()} Ferma Agape – Pătrăuți, Suceava. Toate drepturile rezervate.</p>
        </div>
      </footer>
    </div>
  );
}