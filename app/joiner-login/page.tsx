'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // 🌟 Agregamos useSearchParams
import { supabase } from '../supabase';

export default function JoinerLogin() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 📡 Hook para leer la URL
  
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  // 🔀 LA CLAVE: Si viene de la tienda guardará '/shop'. Si entra normal, irá a '/gos' por defecto.
  const redirectTo = searchParams.get('redirect') || '/gos';

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMensaje('Por favor, llena todos los campos ✦');
      return;
    }

    setMensaje('');
    setCargando(true);

    try {
      if (esRegistro) {
        // 🔐 REGISTRO EN EL PANEL DE USUARIOS DE SUPABASE
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) {
          setMensaje(`Error: ${error.message} ✕`);
        } else {
          setMensaje('¡Cuenta creada con éxito! Ya puedes iniciar sesión... ✨');
          setTimeout(() => {
            setEsRegistro(false);
            setMensaje('');
            setPassword('');
          }, 2000);
        }
      } else {
        // 🔑 LOGUEO EN EL PANEL DE USUARIOS DE SUPABASE
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          setMensaje(`Error: ${error.message} ✕`);
        } else {
          setMensaje('¡Sesión iniciada con éxito! Redirigiendo... ✨');
          setTimeout(() => {
            // 🚀 INTERRUPTOR INTELIGENTE: Te devuelve exactamente a donde venías
            router.push(redirectTo);
          }, 1500);
        }
      }
    } catch (err) {
      setMensaje('Error: Falla de red o conexión bloqueada ✕');
    } finally {
      setCargando(false);
    }
  };

  const alternarModo = () => {
    setEsRegistro(!esRegistro);
    setMensaje('');
    setEmail('');
    setPassword('');
  };
  // 🌸 INTERFAZ MULTICOLOR SUAVE RETRO
  return (
    <div className="min-h-screen bg-[#FFF0F4] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:30px_30px] font-sans text-zinc-700 w-full flex flex-col items-center justify-center antialiased pb-12 p-4">
      
      {/* 🖥️ CAJITA DE LOGIN / REGISTRO (Estilo Miniventana del Sistema Operativo Suave) */}
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-md border border-purple-100 rounded-3xl overflow-hidden shadow-[0_20px_40px_-15px_rgba(168,85,247,0.15)]">
        
        {/* Barra superior de ventana fina */}
        <div className="bg-purple-50/50 border-b border-purple-100 px-5 py-3 flex items-center justify-between text-[10px] text-purple-400 font-mono font-bold select-none">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-300" />
            <span>{esRegistro ? 'register_auth.sys' : 'security_auth.sys'}</span>
          </span>
          <span>✕ ⏤</span>
        </div>

        {/* CONTENIDO INTERIOR */}
        <div className="p-6 space-y-6">
          
          {/* HEADER DEL LOGIN / REGISTRO */}
          <div className="text-center space-y-1 relative">
            <span className="font-serif italic text-xl text-purple-400 lowercase block">welcome back, joiner... ✨</span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-600 lowercase">
              {esRegistro ? 'joiner register' : 'joiner login'}
              <span className="text-pink-400 font-serif">✿</span>
            </h1>
            <p className="text-[10px] text-zinc-400 tracking-wide uppercase font-medium mt-1">
              {esRegistro 
                ? 'Regístrate para empezar a coleccionar 🎀' 
                : 'Ingresa para revisar tus photocards y claims 🎀'
              }
            </p>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={manejarSubmit} className="space-y-4 text-left font-mono text-xs">
            
            {/* Campo de Correo */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block ml-1">
                correo electrónico:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu_correo@ejemplo.com"
                disabled={cargando}
                className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:outline-none focus:border-purple-300 bg-white placeholder-zinc-300 text-xs font-sans font-medium transition-all text-center disabled:opacity-50"
              />
            </div>

            {/* Campo de Contraseña */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block ml-1">
                contraseña secreta:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={cargando}
                className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:outline-none focus:border-purple-300 bg-white placeholder-zinc-300 text-xs font-sans font-medium transition-all text-center disabled:opacity-50"
              />
            </div>

            {/* Mensajes de Alerta */}
            {mensaje && (
              <p className={`text-[10px] font-bold px-4 py-2 rounded-full border text-center ${
                mensaje.includes('Error') || mensaje.includes('Por favor')
                  ? 'bg-rose-50 border-rose-100 text-rose-500' 
                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                {mensaje}
              </p>
            )}

            {/* Botón Píldora de Envío */}
            <button 
              type="submit"
              disabled={cargando}
              className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-full shadow-xs hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer mt-2 disabled:opacity-50 text-center active:scale-[0.98]"
            >
              {cargando ? 'Conectando...' : esRegistro ? 'crear mi cuenta ➔' : 'entrar al escritorio ➔'}
            </button>
          </form>

          {/* ENLACES SECUNDARIOS EXTRA */}
          <div className="text-center pt-4 border-t border-purple-50 flex justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wide">
            <Link href="/shop" className="hover:text-purple-400 transition-colors">
              ⏤ volver a la tienda
            </Link>
            <span 
              onClick={alternarModo} 
              className="cursor-pointer hover:text-purple-400 transition-colors"
            >
              {esRegistro ? '¿ya tienes cuenta? logueate' : '¿nuevo joiner? crear cuenta'}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
