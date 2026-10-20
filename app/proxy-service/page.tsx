'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ProxyService() {
  const [linkCoreano, setLinkCoreano] = useState('');
  const [mensaje, setMensaje] = useState('');

  const manejarCotizacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCoreano.trim()) {
      setMensaje('Por favor, pega un link válido primero ✦');
      return;
    }
    // Aquí se conectará con tu Supabase en el futuro
    setMensaje('¡Link recibido con amor! Cotizando tu pedido... ✨');
    setLinkCoreano('');
  };

  return (
    // 🌸 FONDO COQUETTE RETRO CONTINUO
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-900 w-full flex flex-col items-center antialiased pb-12">
      
      {/* 🧭 ENLACE PARA REGRESAR AL DESKTOP */}
      <div className="w-full max-w-4xl px-4 pt-6 text-left">
        <Link href="/" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-500 transition-colors">
          🗂️ ⏤ back to desktop
        </Link>
      </div>

      {/* 🖥️ CONTENEDOR PRINCIPAL PROXY (Estilo Ventana del Sistema) */}
      <div className="w-full max-w-4xl bg-white border border-zinc-900 rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.03)] mt-4 p-1 bg-zinc-50/50">
        
        {/* Barra superior de ventana fina */}
        <div className="bg-white border-b border-zinc-100 rounded-t-lg px-4 py-2.5 flex items-center justify-between text-[9px] text-zinc-400 font-mono select-none">
          <span className="font-bold text-zinc-600">✕ proxy_assistant.sys</span>
          <span>▢ ⏤</span>
        </div>

        {/* CONTENIDO INTERIOR BLANCO */}
        <div className="bg-white border-t border-zinc-100 rounded-b-lg p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* TITULO EDITORIAL DE LA SECCIÓN (Abarca todo el ancho) */}
          <div className="md:col-span-12 text-center space-y-1 py-2 border-b border-zinc-100 pb-6">
            <span className="font-serif italic text-2xl text-pink-400 lowercase block">de Seúl a tus manitos... ✈️</span>
            <h1 className="text-3xl font-black tracking-tighter lowercase bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              proxy service<span className="text-zinc-900">.</span>
            </h1>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed mt-1">
              ¿Encontraste tu photocard soñada en Bunjang, Pocamarket, Aladin o Twitter KR? ¿O quieres algún producto que nadie más ofrezca? Yo me encargo de comprarla, recibirla en bodega en Seúl y mandarla a tus manos.
            </p>
          </div>

          {/* COLUMNA IZQUIERDA: FORMULARIO DE COTIZACIÓN (md:col-span-7) */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-4 shadow-sm relative">
              <span className="absolute top-3 right-4 text-sky-300 text-sm">✦</span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">
                📥 Solicitar Cotización
              </h2>
              
              <form onSubmit={manejarCotizacion} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block ml-1">
                    Pega el enlace del producto coreano:
                  </label>
                  <input
                    type="text"
                    value={linkCoreano}
                    onChange={(e) => setLinkCoreano(e.target.value)}
                    placeholder="https://bunjang.co.kr..."
                    className="w-full px-4 py-3 rounded-full border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-[#FAF9FB] placeholder-zinc-300 text-xs font-medium transition-all"
                  />
                </div>

                {mensaje && (
                  <p className={`text-[10px] font-bold px-4 py-2 rounded-full border text-center ${
                    mensaje.includes('Por favor') ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}>
                    {mensaje}
                  </p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-zinc-900 border border-zinc-900 text-white hover:bg-pink-500 hover:border-pink-500 text-xs font-bold uppercase tracking-widest py-3 rounded-full shadow-sm transition-all active:scale-[0.98]"
                >
                  Enviar a revisión ♡
                </button>
              </form>
            </div>
          </div>

          {/* COLUMNA DERECHA: STATUS DE BATCHES / ENVIOS (md:col-span-5) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-[#F4F7FF]/40 border border-zinc-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">
                ✈️ Batch Status (Envíos KR)
              </h2>
              
              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-white p-3 rounded-xl border border-zinc-100 flex justify-between items-center shadow-2xs">
                  <span className="text-zinc-700 font-sans font-medium">📦 Batch #24 (PCs)</span>
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase">
                    en aduana
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-zinc-100 flex justify-between items-center shadow-2xs">
                  <span className="text-zinc-700 font-sans font-medium">📦 Batch #25 (Álbumes)</span>
                  <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase">
                    bodega kr
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-zinc-100 flex justify-between items-center shadow-2xs opacity-60">
                  <span className="text-zinc-500 font-sans font-medium">📦 Batch #26 (Próximo)</span>
                  <span className="bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase">
                    abierto
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/*  Swan / Pie de página de la ventana */}
          <div className="md:col-span-12 text-center pt-4 border-t border-zinc-100 text-[9px] font-mono text-zinc-300 uppercase tracking-widest">
            ✦ atelierdehyun operating system v1.0 ✦
          </div>

        </div>
      </div>

    </div>
  );
}
