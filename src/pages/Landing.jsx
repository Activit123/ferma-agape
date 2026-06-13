import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, MapPin, Menu, X } from 'lucide-react';
import { apiRequest } from '../config/api';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [productsPreview, setProductsPreview] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    setLoadingProducts(true);
    apiRequest('/api/products')
      .then(res => res.json())
      .then(data => {
        // Verificăm dacă 'data' este un Array valid
        if (Array.isArray(data)) {
          setProductsPreview(data.filter(p => p.isAvailable).slice(0, 3));
        } else {
          console.error("Eroare de la backend:", data);
          setProductsPreview([]);
        }
      })
      .catch(err => console.error("Eroare incarcare produse:", err))
      .finally(() => setLoadingProducts(false));
  }, []);
  return (
    <div className="min-h-screen bg-[#f6f0e8] text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Leaf className="h-8 w-8 text-emerald-700" />
            <span className="text-2xl font-serif font-semibold tracking-tight text-slate-900">Ferma Agape</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-700">
            <a href="#poveste" className="hover:text-emerald-700 transition">Despre noi</a>
            <a href="#produse" className="hover:text-emerald-700 transition">Produse</a>
            <a href="#servicii" className="hover:text-emerald-700 transition">Servicii</a>
            <a href="#contact" className="hover:text-emerald-700 transition">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-full border border-emerald-700 text-emerald-700 hover:bg-emerald-50 transition">Intră în cont</Link>
            <Link to="/register" className="px-5 py-2 rounded-full bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 transition">Devino client</Link>
          </div>

          <button className="md:hidden p-2 text-slate-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
            <div className="flex flex-col gap-3 pt-4">
              <a href="#poveste" onClick={() => setIsMenuOpen(false)} className="text-slate-700 hover:text-emerald-700 transition">Despre noi</a>
              <a href="#produse" onClick={() => setIsMenuOpen(false)} className="text-slate-700 hover:text-emerald-700 transition">Produse</a>
              <a href="#servicii" onClick={() => setIsMenuOpen(false)} className="text-slate-700 hover:text-emerald-700 transition">Servicii</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-slate-700 hover:text-emerald-700 transition">Contact</a>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-full border border-emerald-700 text-center text-emerald-700">Intră în cont</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-full bg-emerald-700 text-center text-white">Devino client</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_50%)]">
          <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 grid gap-12 md:grid-cols-2 items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">Natură. Tradiție. Premium.</span>
              <h1 className="text-4xl sm:text-5xl font-serif font-bold leading-tight text-slate-900">La Ferma Agape, tradiția se transformă în prospețime pură.</h1>
              <p className="max-w-xl text-lg leading-8 text-slate-700">Nu suntem doar producători de lapte – suntem o familie dedicată care aduce produse lactate naturale, proaspete și autentice direct la ușa ta. Simplu, elegant și cu respect pentru natură.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition">Devino client</Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50 transition">Intră în cont</Link>
              </div>
            </div>
            <div className="relative">
              <img src="https://www.ziromania.ro/wp-content/uploads/2023/10/casa-traditionala-romaneasca-Fundata.jpg" alt="Ferma Tradițională" className="w-full max-h-[520px] rounded-[32px] object-cover shadow-2xl shadow-slate-300/30" />
            </div>
          </div>
        </section>

        <section id="poveste" className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">Despre noi</p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">Ferma Agape aduce gustul natural al Sucevei în fiecare zi.</h2>
              <p className="text-slate-700 leading-8">Suntem o fermă de familie din Pătrăuți, Suceava, unde fiecare produs este făcut cu grijă de la muls până la livrare. Ne bazăm pe tradiție, simplitate și respect pentru mediul înconjurător.</p>
              <p className="text-slate-700 leading-8">Lucrăm cu ingrediente sincere, oferind clienților noștri produse lactate din care te poți bucura în fiecare zi. Calitatea și prospețimea sunt standardul nostru.</p>
            </div>
            <div className="rounded-[32px] bg-emerald-50 p-10 shadow-lg border border-emerald-100">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">Misiunea noastră</p>
              <p className="mt-6 text-slate-700 leading-7">Să aducem produse naturale, oneste și gustoase direct la domiciliul tău, cu respect față de animale și natură.</p>
              <div className="mt-8 space-y-4 text-slate-700">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Prospețime în fiecare zi</h3>
                  <p className="mt-2 leading-7">Mulsă și livrată în aceeași zi, pentru un gust autentic de fermă.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Produse curate</h3>
                  <p className="mt-2 leading-7">Fără aditivi, conservanți sau ingrediente artificiale — doar bunătate din natură.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="produse" className="bg-slate-950 text-white py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Produsele noastre</p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold">Gama noastră de lactate naturale</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-300 leading-7">Produse simple, curate și pregătite pentru familia ta. Fiecare ofertă este gândită să aducă prospețimea și gustul autentic al fermei direct la tine acasă.</p>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              {productsPreview.map(product => (
                <article key={product.id} className="rounded-[28px] overflow-hidden border border-white/10 shadow-xl bg-white/5">
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : "https://cdn.pixabay.com/photo/2016/12/06/18/27/milk-1887234_640.jpg"} 
                    alt={product.name} 
                    className="h-56 w-full object-cover" 
                  />
                  <div className="p-8 bg-slate-950/85 text-white">
                    <p className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-4">{product.unit}</p>
                    <h3 className="text-2xl font-semibold">{product.name}</h3>
                    <p className="mt-4 leading-7 text-slate-200">{product.description || "Produs proaspăt din Ferma Agape."}</p>
                    <p className="mt-4 text-slate-300 font-bold text-xl">{product.price} Lei</p>
                  </div>
                </article>
              ))}
              
              {productsPreview.length === 0 && !loadingProducts && (
                <p className="text-slate-400 text-center col-span-3">Momentan nu avem produse adăugate.</p>
              )}
              {loadingProducts && (
                <p className="text-slate-400 text-center col-span-3">Se încarcă produsele...</p>
              )}
            </div>
          </div>
        </section>

        <section id="servicii" className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="rounded-[32px] bg-emerald-50 p-10 shadow-xl border border-emerald-100">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">Servicii</p>
              <h2 className="mt-4 text-3xl font-serif font-bold text-slate-900">Livrare direct la domiciliu</h2>
              <p className="mt-4 text-slate-700 leading-8">Oferim livrare de lapte și produse lactate proaspete direct la domiciliu, asigurând calitate, prospețime și confort pentru întreaga familie.</p>
              <p className="mt-6 text-slate-700 leading-8">Livrăm în principal în: Pătrăuți, Suceava, Mitocu Dragomirnei, Mitoc, Mitocași, Ițcani, Burdujeni, Șcheia, Salcea, Plopeni și în alte zone din municipiul Suceava și împrejurimi.</p>
            </div>
            <div className="rounded-[32px] bg-slate-950 text-white p-10 shadow-xl border border-slate-800" id="contact">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Date de contact</p>
              <div className="mt-6 space-y-4 text-slate-200">
                <p className="font-semibold text-xl">Ferma Agape</p>
                <p>Telefon: 0787 292 044</p>
                <p>Locație: Str. Tudor Arghezi nr. 18, Pătrăuți, Suceava 727420</p>
                <a href="https://maps.app.goo.gl/uZgDq8EPwyd4GNhX7" target="_blank" rel="noreferrer" className="text-emerald-200 hover:text-white underline">Vezi pe hartă</a>
                <div className="pt-4 border-t border-slate-800">
                  <p>Proprietar: Titus</p>
                  <p>0744 707 486</p>
                  <p>Contact ouă: Brendon</p>
                  <p>0741 686 060</p>
                </div>
              </div>
              <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Misiune</p>
                <p className="mt-4 text-slate-300 leading-7">Ferma Agape – Prospețime, calitate și tradiție, direct de la fermă la ușa dumneavoastră.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">&copy; {new Date().getFullYear()} Ferma Agape – Prospețime, calitate și tradiție, direct de la fermă la ușa dumneavoastră.</div>
      </footer>
    </div>
  );
}