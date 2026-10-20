'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

type ArticuloAgrupado = {
  idUnico: string
  tipo: 'GO' | 'SHOP'
  nombreItem: string
  subTexto: string // Ej: "COMPONENTE: CHAN" o "CANTIDAD: 1 un."
  precio: number
  limite: string
}

type ResumenJoiner = {
  correo: string
  articulos: ArticuloAgrupado[]
  totalAcumulado: number
}

export default function AdminPanelPremium() {
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [listaJoiners, setListaJoiners] = useState<ResumenJoiner[]>([])
  const correoAdmin = 'liahwang1852@gmail.com' // Tu correo de control

  async function cargarDatosHibridos() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUsuarioEmail(user.email)
        
        if (user.email === correoAdmin) {
          // Diccionario temporal para agrupar todo por el correo del cliente
          const mapeoClientes: { [key: string]: ArticuloAgrupado[] } = {}

          // 📡 1. AGARRAR TODOS LOS GOS Y SUS CLAIMS
          const { data: dataGos } = await supabase.from('gos').select('*')
          if (dataGos) {
            dataGos.forEach(go => {
              const claims = go.claims_integrantes || {}
              const precioFijoGO = 12.50 // Precio base que maneja tu diseño para los GOs actuales
              
              Object.keys(claims).forEach(integrante => {
                const correoCliente = claims[integrante]
                if (correoCliente) {
                  if (!mapeoClientes[correoCliente]) mapeoClientes[correoCliente] = []
                  
                  mapeoClientes[correoCliente].push({
                    idUnico: `go-${go.id}-${integrante}`,
                    tipo: 'GO',
                    nombreItem: go.title || 'Orden Grupal',
                    subTexto: `COMPONENTE: ${integrante.toUpperCase()}`,
                    precio: precioFijoGO,
                    limite: go.due_date ? new Date(go.due_date).toLocaleDateString() : '22/10/2026'
                  })
                }
              })
            })
          }

          // 📡 2. AGARRAR TODAS LAS COMPRAS DE LA SHOP (Tabla pedidos)
          const { data: dataPedidos } = await supabase.from('pedidos').select('*')
          if (dataPedidos) {
            dataPedidos.forEach(ped => {
              const correoCliente = ped.user_email
              if (correoCliente) {
                if (!mapeoClientes[correoCliente]) mapeoClientes[correoCliente] = []
                
                mapeoClientes[correoCliente].push({
                  idUnico: `shop-${ped.id}`,
                  tipo: 'SHOP',
                  nombreItem: ped.detalles || 'Artículo de Tienda Física',
                  subTexto: 'PRODUCTO EN STOCK 📦',
                  precio: ped.total_pagar || 0,
                  limite: 'Inmediato'
                })
              }
            })
          }

          // 🧮 3. TRANSFORMAR EL MAPEO EN UN ARREGLO CON TOTALES SUMADOS AUTOMÁTICAMENTE
          const resumenFinal: ResumenJoiner[] = Object.keys(mapeoClientes).map(correo => {
            const items = mapeoClientes[correo]
            const total = items.reduce((suma, item) => suma + item.precio, 0)
            return {
              correo,
              articulos: items,
              totalAcumulado: total
            }
          })

          setListaJoiners(resumenFinal)
        }
      }
    } catch (err) {
      console.error("Error procesando el panel administrativo:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatosHibridos() }, [])

  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs text-zinc-400">✧ abriendo_escritorio_global_admin.sys ...</div>

  if (usuarioEmail !== correoAdmin) {
    return (
      <div className="min-h-screen bg-[#FFF0F4] flex flex-col items-center justify-center p-4 font-sans text-center space-y-4">
        <p className="text-sm font-bold text-rose-500 bg-white border border-rose-100 px-6 py-3 rounded-full shadow-sm">
          ✕ Acceso denegado. Este panel es exclusivo para la administración de Atelier de Hyun 🎀
        </p>
        <Link href="/gos" className="text-xs font-mono uppercase tracking-widest text-zinc-400 underline hover:text-zinc-900">
          Volver a la Masterlist ➔
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-700 w-full flex flex-col items-center antialiased pb-12 px-4">
      
      {/* 🧭 REGRESAR AL DESKTOP */}
      <div className="w-full max-w-xl pt-6 text-left">
        <Link href="/gos" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-600 transition-colors">
          🗂️ ⏤ volver a la masterlist
        </Link>
      </div>

      {/* 👑 CONTENEDOR MAESTRO DE TARJETAS */}
      <div className="w-full max-w-xl space-y-6 mt-4">
        
        {/* ENCABEZADO ESTILO ATELIER DE HYUN */}
        <div className="bg-white border border-pink-100 rounded-3xl p-6 text-center shadow-[0_15px_30px_rgba(255,182,193,0.08)]">
          <h1 className="text-2xl font-black tracking-tight text-zinc-700 lowercase">
            panel control de joiners<span className="text-pink-400 font-serif">✿</span>
          </h1>
          <p className="text-[11px] text-zinc-400 font-mono mt-1 uppercase tracking-wider font-bold">
            Vista total unificada por cliente (GOs + Shop)
          </p>
        </div>

        {listaJoiners.length === 0 ? (
          <div className="bg-white border border-pink-100 rounded-3xl p-12 text-center text-zinc-400 text-xs font-mono">
            No tienes ningún pedido ni claim registrado en el sistema todavía 🍰
          </div>
        ) : (
          listaJoiners.map((joiner) => (
            <div 
              key={joiner.correo}
              className="bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-[0_10px_25px_rgba(255,182,193,0.1)] p-6 space-y-4"
            >
              {/* INDICADOR DEL CLIENTE */}
              <div className="flex justify-between items-center border-b border-pink-50 pb-3 flex-wrap gap-2">
                <span className="text-[10px] bg-purple-600 text-white font-mono px-3 py-1 rounded-full font-bold uppercase shadow-2xs">
                  👤 JOINER ACTIVO
                </span>
                <span className="text-xs font-mono font-bold text-zinc-600 break-all">{joiner.correo}</span>
              </div>

              {/* LISTADO DE COMPRAS DE ESTE CLIENTE ESPECÍFICO */}
              <div className="space-y-3 pt-2">
                {joiner.articulos.map((item) => (
                  <div 
                    key={item.idUnico} 
                    className="flex justify-between items-center border-b border-zinc-50 pb-2.5 last:border-0 last:pb-0 gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md ${
                          item.tipo === 'SHOP' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-950 text-white'
                        }`}>
                          {item.tipo}
                        </span>
                        <h4 className="text-[13px] font-bold text-zinc-800 lowercase">{item.nombreItem}</h4>
                      </div>
                      <p className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wide mt-0.5">
                        {item.subTexto}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-black text-zinc-700">\${item.precio.toFixed(2)}</span>
                      <p className="text-[8px] font-mono text-zinc-400">Límite: {item.limite}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* BLOQUE DE TOTAL ACUMULADO ESTILO TU RESUMEN */}
              <div className="bg-zinc-950 text-white rounded-2xl p-4 flex justify-between items-center shadow-xs mt-2 select-none">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">TOTAL PEDIDO ACUMULADO:</span>
                <span className="text-sm font-black text-white font-mono">\${joiner.totalAcumulado.toFixed(2)} USD</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
