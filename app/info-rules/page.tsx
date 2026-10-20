'use client';

import Link from 'next/link';

export default function Info() {
  // Lista de reglas de tu proxy/tienda (¡puedes editar los textos fácilmente!)
  const reglas = [
    {
      id: 1,
      titulo: "🌸 01. pedidos y cotizaciones",
      contenido: "Todas las cotizaciones de Bunjang, Aladin o Twitter KR se procesan en un lapso de 24 a 48 horas. Una vez recibido el pago, se realiza la compra de inmediato."
    },
    {
      id: 2,
      titulo: "✈️ 02. envíos internacionales (batches)",
      contenido: "Los artículos se consolidan en la bodega de Seúl. Los envíos marítimos/aéreos tardan aproximadamente de 3 a 5 semanas en llegar a destino una vez que se pide el envío."
    },
    {
      id: 3,
      titulo: "🎀 03. cancelaciones y reembolsos",
      contenido: "Al ser productos importados bajo pedido, no se aceptan cancelaciones ni devoluciones."
    },
    {
      id: 4,
      titulo: "📦 04. entregas y envíos locales",
      contenido: "Una vez que el lote llega a mis manos y pasa aduana, te notificaré por la masterlist para coordinar tu envío local o entrega personal según las reglas vigentes."
    }
  ];

  return (
    // 🌸 FONDO COQUETTE RETRO CONTINUO
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-900 w-full flex flex-col items-center antialiased pb-12">
      
      {/* 🧭 ENLACE PARA REGRESAR AL DESKTOP */}
      <div className="w-full max-w-2xl px-4 pt-6 text-left">
        <Link href="/" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-500 transition-colors">
          🗂️ ⏤ back to desktop
        </Link>
      </div>

      {/* 🖥️ VENTANA PRINCIPAL INFO & RULES (Estilo Ventana del Sistema) */}
      <div className="w-full max-w-2xl bg-white border border-zinc-900 rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.03)] mt-4 p-1 bg-zinc-50/50">
        
        {/* Barra superior de ventana fina */}
        <div className="bg-white border-b border-zinc-100 rounded-t-lg px-4 py-2.5 flex items-center justify-between text-[9px] text-zinc-400 font-mono select-none">
          <span className="font-bold text-zinc-600">✕ terms_and_rules.txt</span>
          <span>▢ ⏤</span>
        </div>

        {/* CONTENIDO INTERIOR BLANCO */}
        <div className="bg-white border-t border-zinc-100 rounded-b-lg p-6 space-y-6">
          
          {/* TITULO EDITORIAL DE LA SECCIÓN */}
          <div className="text-center space-y-1 py-2 border-b border-zinc-100 pb-4">
            <span className="font-serif italic text-2xl text-pink-400 lowercase block">lee atentamente... ♡</span>
            <h1 className="text-3xl font-black tracking-tighter lowercase bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              info & rules<span className="text-zinc-900">.</span>
            </h1>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed mt-1">
              Por favor, lee las guías y términos de servicio que se encuentran en las destacadas de instagram, sin embargo, encuentra aquí un poco de información importante...
            </p>
          </div>

          {/* 📋 LISTA DE REGLAS EN CAJITAS LIMPIAS */}
          <div className="space-y-4">
            {reglas.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-zinc-100 rounded-2xl p-5 hover:border-zinc-300 transition-all shadow-sm space-y-2 relative group"
              >
                {/* Cabecera de la tarjetita */}
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center justify-between">
                  <span>{item.titulo}</span>
                </h2>
                
                {/* Texto de la regla */}
                <p className="text-xs text-zinc-500 leading-relaxed font-normal pt-1">
                  {item.contenido}
                </p>

                {/* Mini destello decorativo Y2K */}
                <span className="absolute top-3 right-4 text-xs text-pink-200 group-hover:text-pink-400 transition-colors">✦</span>
              </div>
            ))}
          </div>

          {/* 🧸 NOTA ADICIONAL FINAL */}
          <div className="bg-[#FFF9FA] border border-dashed border-rose-200 rounded-xl p-4 text-center">
            <p className="text-[11px] text-rose-500 font-medium">
              Al realizar cualquier reclamo (claim) o depósito, aceptas automáticamente estos términos. ¡Gracias por confiar en mi! ✨
            </p>
          </div>

          {/* Pie de página de la ventana */}
          <div className="text-center pt-2 text-[9px] font-mono text-zinc-300 uppercase tracking-widest">
            ✦ atelierdehyun operating system v1.0 ✦
          </div>

        </div>
      </div>

    </div>
  );
}
