import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "hyuneatelier",
  description: "Group Orders & K-Pop Shop",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Fondo con un patrón sutil de cuadrícula/rayas estilo papelería kawaii */}
      <body className="antialiased bg-[#FFF0F4] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:30px_30px] min-h-screen text-zinc-700">
        
        {/* CONTENEDOR FLOTANTE CENTRALIZADO (Mantiene todo unido como una app de escritorio) */}
        <header className="w-full max-w-6xl mx-auto pt-6 px-4 select-none">
          
          {/* BARRA SUPERIOR DE VENTANA RETRO INTEGRADA */}
          <div className="w-full bg-white/95 rounded-t-2xl border-t border-x border-pink-200/80 px-5 py-2.5 flex justify-between items-center text-[10px] font-mono text-pink-400/90 uppercase tracking-widest shadow-[0_4px_20px_-5px_rgba(255,182,193,0.2)]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
              </div>
              <span className="ml-1 font-bold">✧ hyuneatelier.SYS</span>
            </div>
            <div className="hidden md:flex gap-4 font-bold text-zinc-400/80">
              <span> ✦</span>
              <span>⋆𐙚₊˚⊹♡</span>
            </div>
          </div>

          {/* CUERPO DEL NAVBAR PRINCIPAL: Todo en una sola línea ordenada */}
          <div className="w-full bg-white/80 backdrop-blur-md rounded-b-2xl border-b border-x border-pink-100/80 px-5 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-[0_15px_30px_-10px_rgba(255,182,193,0.25)]">
            
            {/* LOGOTIPO */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="bg-[#FFF0F4] text-pink-500 px-5 py-2 rounded-full text-sm font-black tracking-tight lowercase border border-pink-200 shadow-sm hover:shadow-md transition-all duration-200 block"
              >
                hyuneatelier<span className="text-amber-400 font-serif ml-0.5">.𐔌՞. .՞𐦯 ݁˖</span>
              </Link>
            </div>

            {/* ENLACES DE NAVEGACIÓN */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-black tracking-widest text-pink-400/90 uppercase">
              <Link href="/" className="hover:text-pink-600 transition-colors">welcome</Link>
              <Link href="/gos" className="hover:text-pink-600 transition-colors">gos</Link>
              <Link href="/shop" className="hover:text-pink-600 transition-colors">shop</Link>
              <Link href="/proxy-service" className="hover:text-pink-600 transition-colors">proxy</Link>
              <Link href="/joiner-login" className="hover:text-pink-600 transition-colors">login</Link>
            </nav>

            {/* BOTONES DERECHOS */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link 
                href="/mi-escritorio" 
                className="bg-gradient-to-r from-pink-100 to-rose-50  text-pink-600 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-pink-200/60 shadow-sm hover:scale-102 transition-all"
              >
                mi escritorio 🎀
              </Link>
              <Link 
                href="/admin" 
                className="bg-purple-50 text-purple-400 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-purple-100 shadow-sm hover:scale-102 transition-all"
              >
                admin ⚙️
              </Link>
            </div>

          </div>

        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="max-w-6xl mx-auto px-4 pt-8 pb-12">
          {children}
        </main>

      </body>
    </html>
  );
}
