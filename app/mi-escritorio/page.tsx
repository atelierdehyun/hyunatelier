'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

// Definimos el tipo de datos basado en la vista agrupada que creamos
type PedidoAgrupado = {
  user_email: string;
  total_pedidos: number;
  todos_los_detalles: string;
  monto_total_acumulado: number;
  proxima_fecha_limite: string | null;
}

export default function MiEscritorioAdmin() {
  const [resumenJoiners, setResumenJoiners] = useState<PedidoAgrupado[]>([])
  const [loading, setLoading] = useState(true)

  async function cargarTotalesJoiners() {
    setLoading(true)
    // Consultamos directamente la vista agrupada que creamos en Supabase
    const { data, error } = await supabase
      .from('pedidos_totales_por_joiner')
      .select('*')
    
    if (data) {
      setResumenJoiners(data)
    } else if (error) {
      console.error("Error cargando totales:", error)
    }
    setLoading(false)
  }

  useEffect(() => { 
    cargarTotalesJoiners() 
  }, [])

  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs text-zinc-400">✧ cargando_totales_globales.sys ...</div>

  return (
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-900 w-full flex flex-col items-center antialiased pb-12 p-4">
      {/* CABECERA */}
      <div className="w-full max-w-3xl flex justify-between items-center pt-4">
        <Link href="/gos" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-500">🗂️ ⏤ volver a la masterlist</Link>
        <span className="text-[9px] bg-purple-600 text-white font-mono px-3 py-1 rounded-full uppercase">👑 Panel Admin</span>
      </div>

      <div className="w-full max-w-3xl bg-white border border-zinc-900 rounded-xl overflow-hidden shadow-sm mt-4 p-1 bg-zinc-50/50">
        <div className="bg-white border-b border-zinc-100 rounded-t-lg px-4 py-2.5 flex items-center justify-between text-[9px] text-zinc-400 font-mono select-none">
          <span className="font-bold text-zinc-600">✕ control_de_joiners_global.sys</span>
          <span>● conectado</span>
        </div>

        <div className="bg-white border-t border-zinc-100 rounded-b-lg p-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tighter lowercase bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">control de joiners<span className="text-zinc-900">.</span></h1>
            <p className="text-[11px] text-zinc-400 tracking-wide uppercase font-semibold">Monitorea los reclamos globales activos y totales por persona 🎀</p>
          </div>

          {resumenJoiners.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 font-mono text-xs">No hay pedidos registrados en el sistema todavía 🍰</div>
          ) : (
            <div className="space-y-4">
              {resumenJoiners.map((joiner) => (
                <div key={joiner.user_email} className="border border-zinc-200 bg-white rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-pink-200">
                  <div className="space-y-1.5 w-full md:max-w-[70%]">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="bg-zinc-950 text-white font-mono text-[9px] uppercase px-2 py-0.5 rounded-md font-bold">
                        {joiner.total_pedidos} {joiner.total_pedidos === 1 ? 'pedido' : 'pedidos'}
                      </span>
                      <h3 className="font-bold text-sm text-purple-600 font-mono break-all">{joiner.user_email}</h3>
                    </div>
                    {/* Lista consolidada de todo lo que compró (GOs + Shop) */}
                    <p className="text-xs text-zinc-500 lowercase line-clamp-2">
                      <span className="font-semibold text-zinc-400 font-mono text-[10px] uppercase">Artículos:</span> {joiner.todos_los_detalles}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-center gap-1 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Total a cobrar</span>
                    <span className="text-lg font-black text-pink-500">
                      ${joiner.monto_total_acumulado.toFixed(2)} USD
                    </span>
                    {joiner.proxima_fecha_limite && (
                      <span className="text-[9px] font-mono bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded-md mt-1">
                        Próximo Límite: {new Date(joiner.proxima_fecha_limite).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
