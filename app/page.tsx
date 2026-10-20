'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

export default function AtelierWelcome() {
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio bloqueado"));
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[40vh] flex flex-col items-center justify-center font-mono text-xs text-pink-400 tracking-widest">
        <span>✧ LOADING_DATABASE.SYS ...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center animate-[fadeIn_0.3s_ease-out]">
      
      {/* ⚡ CINTA MARQUEE CON ESTILO SOFT POP */}
      <div className="w-full bg-white/90 rounded-full border border-pink-200/50 py-2.5 overflow-hidden whitespace-nowrap select-none flex text-[11px] font-black tracking-widest text-pink-400 uppercase shadow-xs">
        <div className="flex gap-12 animate-[marquee_25s_linear_infinite]">
          <span>Stray Kids! ✦ Enhypen! ✦ Cosas nuevas en stock ✦ Gos abiertos y nuevos ✦ Stray Kids! ✦ Enhypen! ✦ Cosas nuevas en stock ✦ Gos abiertos y nuevos</span>
        </div>
      </div>

      {/* 🖥️ SECCIÓN DEL ESCRITORIO VIRTUAL CYBER-CUTE MULTICOLOR */}
      <section className="w-full max-w-5xl px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/40 relative min-h-[440px] mt-6 rounded-3xl border border-white/60 shadow-[0_15px_30px_-15px_rgba(255,182,193,0.1)]">
        
        {/* COLUMNA IZQUIERDA: ICONOS */}
        <div className="md:col-span-1 flex md:flex-col gap-6 justify-center md:justify-start pt-4 items-center">
          <Link href="/gos" className="flex flex-col items-center cursor-pointer group">
            <span className="text-3xl group-hover:scale-105 transition-transform duration-150">📁</span>
            <span className="text-[10px] font-extrabold text-sky-400 mt-1.5 text-center tracking-wider">gos.sys</span>
          </Link>
          <Link href="/info-rules" className="flex flex-col items-center cursor-pointer group">
            <span className="text-3xl group-hover:scale-105 transition-transform duration-150">📝</span>
            <span className="text-[10px] font-extrabold text-purple-400 mt-1.5 text-center tracking-wider">rules.txt</span>
          </Link>
        </div>

        {/* VENTANA 1 (Izquierda - Detalle Azul Cielo Pastel 🩵) */}
        <div className="bg-white/95 rounded-2xl overflow-hidden shadow-xs border border-sky-100 md:col-span-4 self-start transform md:-rotate-1 hover:rotate-0 transition-transform duration-200">
          <div className="bg-sky-50/50 border-b border-sky-100 px-3 py-1.5 flex items-center justify-between text-[9px] text-sky-400 font-mono font-bold">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-300"/> preview_01.jpg</span>
            <span>✕ ⏤</span>
          </div>
          <div className="p-2.5 bg-white">
            <img src="https://i.postimg.cc/FKZt0hDG/441894935b5b1026b720976faa08bc5e.jpg" alt="Kpop Inspo" loading="lazy" className="w-full h-64 object-cover rounded-xl" />
          </div>
        </div>

        {/* VENTANA 2 (Centro - Crema y Amarillo Retro Pop 💛) */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xs md:col-span-3 self-center p-5 text-center space-y-4 border border-amber-100 relative z-10 md:-translate-y-2">
          <div className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-widest text-left border-b border-amber-50 pb-1.5 flex justify-between">
            <span>msg_window.sys</span>
            <span className="text-pink-400">✦</span>
          </div>
          <p className="font-serif italic text-amber-500 text-xl tracking-tight lowercase">atelierdehyun</p>
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 leading-tight">Gos & Proxy Help</h2>
          <Link href="/shop" className="bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-white text-[10px] uppercase font-black tracking-wildest py-2.5 rounded-full transition-all duration-150 w-full inline-block text-center shadow-xs">Enter Shop</Link>
        </div>

        {/* VENTANA 3 (Derecha - Lavanda/Morado Soft 💜) */}
        <div className="bg-white/95 rounded-2xl overflow-hidden shadow-xs border border-purple-100 md:col-span-4 self-end transform md:rotate-1 hover:rotate-0 transition-transform duration-200 relative">
          <div className="bg-purple-50/50 border-b border-purple-100 px-3 py-1.5 flex items-center justify-between text-[9px] text-purple-400 font-mono font-bold">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-300"/> preview_02.jpg</span>
            <span>✕ ⏤</span>
          </div>
          <div className="p-2.5 bg-white">
            <img src="https://i.postimg.cc/C5fSGWZs/eca2f6969986d86cf77c8801c39c0026.jpg" alt="Merch Inspo" loading="lazy" className="w-full h-64 object-cover rounded-xl" />
          </div>
          <span className="absolute -top-2.5 -left-2.5 text-amber-400 text-2xl drop-shadow-sm">✦</span>
        </div>

      </section>
      {/* 🎹 NUEVO REPRODUCTOR NATIVO CYBER-CUTE MULTICOLOR */}
      <div className="w-full max-w-5xl mt-5 px-2">
        <div className="w-full bg-gradient-to-r from-pink-100/90 via-purple-50/90 to-sky-100/90 border border-pink-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-pink-200 text-xl animate-[spin_8s_linear_infinite]">
              夹
            </div>
            <div className="font-mono text-left">
              <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">now_playing.mp3</p>
              <p className="text-[11px] font-bold text-zinc-500 lowercase">after you by skz ✦</p>
            </div>
          </div>

{/* 🎹 Elemento de audio nativo */}
<audio ref={audioRef} loop preload="auto">
<source src="https://files.catbox.moe/4394lb.mp3" type="audio/mpeg" />
  Tu navegador no soporta el elemento de audio.
</audio>
          {/* Botón de reproducción retro pop */}
          <button 
            onClick={togglePlay}
            className="bg-white text-pink-500 border border-pink-200 coding-font text-xs uppercase tracking-widest px-5 py-2 rounded-full shadow-xs hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-2 font-bold"
          >
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY '}
          </button>
        </div>
      </div>

      {/* 🤍 SECCIÓN INFERIOR DE ACCESOS RÁPIDOS POR CATEGORÍA MULTICOLOR */}
      <section className="w-full max-w-5xl p-6 bg-white/40 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 rounded-3xl border border-white/60 shadow-xs mb-12">
        
        {/* 📸 1. INSTAGRAM */}
        <a href="https://instagram.com/maisonhyun" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group cursor-pointer">
          <div className="w-full aspect-[4/3] rounded-2xl bg-[#FFF2F4] border border-pink-100 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5">
            <span className="text-[10px] font-black tracking-widest uppercase text-pink-500 bg-white border border-pink-200 px-3 py-1.5 rounded-full shadow-xs">
              instagram
            </span>
            <span className="absolute bottom-2 right-2 text-pink-300 text-xs opacity-40">✧</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 mt-2.5 text-center tracking-wide">Sigue mi cuenta principal</p>
        </a>

        {/* 📦 2. IN STOCK ITEMS */}
        <Link href="/shop" className="flex flex-col items-center group cursor-pointer">
          <div className="w-full aspect-[4/3] rounded-2xl bg-[#E3FFF3] border border-emerald-100 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5">
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600 bg-white border border-emerald-200 px-3 py-1.5 rounded-full shadow-xs">
              in stock items
            </span>
            <span className="absolute bottom-2 right-2 text-emerald-300 text-xs opacity-40">✦</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 mt-2.5 text-center tracking-wide">Listos para enviar</p>
        </Link>

        {/* 💬 3. WHATSAPP */}
        <a href="https://chat.whatsapp.com/FMBE0gchYcMKkD7BPxd5q7" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group cursor-pointer">
          <div className="w-full aspect-[4/3] rounded-2xl bg-[#E0F2FE] border border-sky-100 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5">
            <span className="text-[10px] font-black tracking-widest uppercase text-sky-600 bg-white border border-sky-200 px-3 py-1.5 rounded-full shadow-xs">
              whatsapp
            </span>
            <span className="absolute bottom-2 right-2 text-sky-300 text-xs opacity-40">✧</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 mt-2.5 text-center tracking-wide">Ingresa a la comunidad</p>
        </a>

        {/* ✈️ 4. PROXY KR */}
        <Link href="/proxy-service" className="flex flex-col items-center group cursor-pointer">
          <div className="w-full aspect-[4/3] rounded-2xl bg-[#FEF3C7] border border-amber-100 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5">
            <span className="text-[10px] font-black tracking-widest uppercase text-amber-600 bg-white border border-amber-200 px-3 py-1.5 rounded-full shadow-xs">
              proxy kr
            </span>
            <span className="absolute bottom-2 right-2 text-amber-300 text-xs opacity-40">✦</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 mt-2.5 text-center tracking-wide">¿Ayuda desde Corea?</p>
        </Link>

      </section>

    </div>
  );
}
