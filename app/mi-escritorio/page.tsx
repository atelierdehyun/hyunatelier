'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic';
const NUMERO_WHATSAPP = '593999530327';

type ReclamoGo = {
  idUnico: string;
  catalogoNombre: string;
  itemNombre: string;
  integranteElegido: string;
  precioUnitario: number;
  fechaLimite: string | null;
  diasMora: number;
}

type CompraShop = {
  id: number;
  producto_nombre: string;
  total_pagar: number;
  detalles: string | null;
  estado_pago: string;
}

export default function MiEscritorioJoiner() {
  const [pestanaJoiner, setPestanaInterna] = useState<'gos' | 'compras'>('gos')
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [misGos, setMisGos] = useState<ReclamoGo[]>([])
  const [misCompras, setMisCompras] = useState<CompraShop[]>([])
  const [message, setMessage] = useState('')

  async function cargarEscritorioCliente() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) {
        setLoading(false)
        return
      }
      const emailLogueado = session.user.email
      setUsuarioEmail(emailLogueado)

      // 📥 1. LEER RECLAMOS DE GOs EN TIEMPO REAL
      const { data: dProds } = await supabase.from('productos').select('id, nombre_producto, precio, claims_integrantes, due_date, gos(title)')
      const listaReclamos: ReclamoGo[] = []
      
      if (dProds) {
        dProds.forEach(p => {
          const claims = p.claims_integrantes || {}
          Object.entries(claims).forEach(([intName, comprador]) => {
            // Si el comprador guardado en este objeto JSON es el correo logueado, lo añadimos
            if (comprador === emailLogueado || (typeof comprador === 'object' && comprador !== null && comprador[emailLogueado])) {
              const cantidadElegida = typeof comprador === 'object' ? (comprador[emailLogueado] || 1) : 1;
              
              // Calcular días de mora en base a las 48 horas límites
              let mora = 0
              if (p.due_date) {
                const diffTime = Date.now() - new Date(p.due_date).getTime()
                if (diffTime > 0) mora = Math.floor(diffTime / (1000 * 60 * 60 * 24))
              }

              listaReclamos.push({
                idUnico: `${p.id}-${intName}`,
                catalogoNombre: (p.gos as any)?.title || 'Catálogo Atelier',
                itemNombre: p.nombre_producto,
                integranteElegido: intName,
                precioUnitario: p.precio * cantidadElegida,
                fechaLimite: p.due_date ? new Date(p.due_date).toLocaleDateString() : 'Pendiente',
                diasMora: mora
              })
            }
          })
        })
      }
      setMisGos(listaReclamos)

      // 📥 2. LEER PEDIDOS DE LA TIENDA FÍSICA / SHOP
      const { data: dPedidos } = await supabase.from('pedidos').select('*').eq('user_email', emailLogueado)
      if (dPedidos) setMisCompras(dPedidos)

    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { cargarEscritorioCliente() }, [])

  // Sumador del total acumulado de Group Orders pendientes del joiner
  const totalAcumuladoGos = misGos.reduce((acc, item) => acc + item.precioUnitario, 0)
  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs text-zinc-400">✧ abriendo_tu_escritorio_atelier.sys ...</div>

  if (!usuarioEmail) {
    return (
      <div className="min-h-screen bg-[#FFF0F4] flex flex-col items-center justify-center p-4 text-center gap-3">
        <p className="text-xs font-bold text-pink-500 bg-white border border-pink-100 px-5 py-2.5 rounded-full">🎀 Por favor, inicia sesión para ver tu perfil de joiner</p>
        <Link href="/gos" className="text-xs font-mono uppercase text-zinc-400 underline">Ir al catálogo general ➔</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-700 w-full flex flex-col items-center antialiased pb-12 p-4">
      {/* Cabecera del Usuario */}
      <div className="w-full max-w-2xl flex justify-between items-center pt-4">
        <Link href="/gos" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-500">🗂️ ⏤ volver al catálogo</Link>
        <span className="text-[9px] bg-zinc-950 text-white font-mono px-3 py-1 rounded-full">👤 {usuarioEmail}</span>
      </div>

      {/* 📥 MENÚ DE NAVEGACIÓN PARA EL COMPRADOR */}
      <div className="w-full max-w-2xl mt-4 flex gap-1 bg-white p-1 rounded-xl border border-zinc-200 shadow-2xs">
        <button type="button" onClick={() => setPestanaInterna('gos')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${pestanaJoiner === 'gos' ? 'bg-pink-500 text-white shadow-xs' : 'text-zinc-500 hover:bg-zinc-50'}`}>🐻 mis group orders ({misGos.length})</button>
        <button type="button" onClick={() => setPestanaInterna('compras')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${pestanaJoiner === 'compras' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-500 hover:bg-zinc-50'}`}>🛍️ mis compras shop ({misCompras.length})</button>
      </div>

      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs mt-3 p-5">
        {/* 🐻 PESTAÑA A: GROUP ORDERS ACTIVAS */}
        {pestanaJoiner === 'gos' && (
          <div className="space-y-4 animate-fade">
            <div className="border-b pb-1.5 flex justify-between items-center">
              <h2 className="text-xs font-black text-pink-500 uppercase tracking-wider">📦 Reclamos en Másterlists</h2>
              <span className="text-xs font-black font-mono text-zinc-800">Total Acumulado GOs: ${totalAcumuladoGos.toFixed(2)} USD</span>
            </div>

            {misGos.length === 0 ? (
              <p className="text-xs text-zinc-400 font-mono text-center py-6">Aún no has reclamado ningún slot de integrante. ¡Visita los catálogos activos! 🌸</p>
            ) : (
              <div className="space-y-3">
                {misGos.map(item => (
                  <div key={item.idUnico} className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/30 flex flex-col gap-2.5">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-zinc-400 font-mono text-[9px] uppercase">✨ Catálogo: {item.catalogoNombre}</p>
                        <p className="font-black text-zinc-800 uppercase text-xs mt-0.5">{item.itemNombre}</p>
                        <p className="text-[11px] text-pink-500 font-bold uppercase mt-0.5">🪞 integrante apartado: {item.integranteElegido}</p>
                      </div>
                      <span className="font-black text-zinc-900 text-sm shrink-0">${item.precioUnitario.toFixed(2)} USD</span>
                    </div>

                    {/* Alerta de Mora Dinámica */}
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg border text-[10px] font-mono">
                      <span>⏰ Límite de Pago: <strong>{item.fechaLimite}</strong></span>
                      {item.diasMora > 0 ? (
                        <span className="bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded font-bold uppercase">🚨 Tienes {item.diasMora} {item.diasMora === 1 ? 'día' : 'días'} de Mora</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded font-bold uppercase">Reserva segura 🫧</span>
                      )}
                    </div>

                    {/* Datos de Transferencia Únicos y Directos */}
                    <div className="bg-rose-50/50 border border-rose-100/60 p-3 rounded-xl text-[11px] space-y-1 text-zinc-600 font-medium">
                      <p><strong>🏦 Depósito / Transferencia:</strong> Banco Pichincha / Produbanco (Ahorros)</p>
                      <a
                        href={`https://whatsapp.com{NUMERO_WHATSAPP}&text=${encodeURIComponent(
                          `¡Hola, Atelier de Hyun! ✨\n\nQuiero reportar el pago de mi slot apartado:\n\n💌 *Usuario:* ${usuarioEmail}\n📦 *Ítem:* ${item.itemNombre}\n🪞 *Slot:* ${item.integranteElegido}\n💰 *Valor:* $${item.precioUnitario.toFixed(2)} USD\n\nAdjunto por aquí la fotito de mi comprobante de transferencia. 💗`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest py-2 rounded-lg text-center block mt-2 hover:bg-emerald-600 transition-colors"
                      >
                        💬 Enviar comprobante de este integrante por WhatsApp 🍰
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 🛍️ PESTAÑA B: ARTÍCULOS COMPRADOS EN LA SHOP (PEDIDOS) */}
        {pestanaJoiner === 'compras' && (
          <div className="space-y-4 animate-fade">
            <div className="border-b pb-1.5">
              <h2 className="text-xs font-black text-zinc-800 uppercase tracking-wider">🛍️ Órdenes de Pedidos Realizados (Shop)</h2>
            </div>

            {misCompras.length === 0 ? (
              <p className="text-xs text-zinc-400 font-mono text-center py-6">No registras ninguna compra física en la tienda por el momento 🍰</p>
            ) : (
              <div className="space-y-3">
                {misCompras.map(compra => (
                  <div key={compra.id} className="border border-zinc-200 bg-white rounded-xl p-4 flex justify-between items-center text-xs shadow-3xs transition-all hover:border-zinc-300">
                    <div className="space-y-1 truncate flex-1 pr-3">
                      <div className="flex gap-2 items-center">
                        <span className="bg-zinc-900 text-white font-mono text-[8px] uppercase px-1.5 py-0.5 rounded font-bold">ORDEN #{compra.id}</span>
                        <p className="font-black text-zinc-800 uppercase truncate">{compra.producto_nombre || compra.detalles || 'Pedido Shop'}</p>
                      </div>
                      {compra.detalles && <p className="text-[11px] text-zinc-400 lowercase truncate"><span className="font-bold text-zinc-400 uppercase font-mono text-[9px]">Notas:</span> {compra.detalles}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-zinc-900 text-sm">${Number(compra.total_pagar).toFixed(2)} USD</p>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded border font-bold block mt-1 uppercase ${compra.estado_pago === 'INSTOCK' || compra.estado_pago === 'PAGADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {compra.estado_pago === 'INSTOCK' ? 'ENTREGADO' : compra.estado_pago}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
