'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

// ⚙️ Número de WhatsApp de destino (Ecuador)
const NUMERO_WHATSAPP = '593999530327';

type Go = {
  id: number;
  title: string;
  status: string;
  group_name: string;
  imagen_general: string | null;
}

type Producto = {
  id: number;
  go_id: number;
  nombre_producto: string;
  precio: number;
  lista_slots: string | null;
  imagen_producto: string | null;
  claims_integrantes: { [key: string]: string } | null;
  due_date?: string;
  descripcion?: string;
}

export default function Masterlist() {
  const [bandaSeleccionada, setBandaSeleccionada] = useState<'stray kids' | 'enhypen' | 'otros'>('stray kids')
  
  const [gos, setGos] = useState<Go[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [message, setMessage] = useState('')
  
  const [goSeleccionado, setGoSeleccionado] = useState<number | null>(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null)
  const [integranteSeleccionado, setIntegranteSeleccionado] = useState<string | null>(null)
  const [usuarioHizoClicEnProducto, setUsuarioHizoClicEnProducto] = useState(false)

  const [mostrarMóduloPago, setMostrarMóduloPago] = useState(false)
  const [datosUltimoClaim, setDatosUltimoClaim] = useState<{ producto: string; slot: string; precio: number } | null>(null)
  async function inicializarPagina(keepGoId?: number | null, keepProdId?: number | null, keepBanda?: 'stray kids' | 'enhypen' | 'otros') {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) setUsuarioEmail(user.email)
    
    const { data: dataGos } = await supabase.from('gos').select('*').order('id', { ascending: false })
    const { data: dataProductos } = await supabase.from('productos').select('*').order('id', { ascending: true })
    
    if (dataGos) setGos(dataGos)
    if (dataProductos) setProductos(dataProductos)
    
    // Si venimos de un claim/cancelación, forzamos a conservar lo que el usuario estaba viendo
    if (keepGoId !== undefined) {
      setGoSeleccionado(keepGoId)
      setProductoSeleccionado(keepProdId || null)
      if (keepBanda) setBandaSeleccionada(keepBanda)
      setLoading(false)
      return
    }

    const queryParams = new URLSearchParams(window.location.search)
    const urlGoId = queryParams.get('goId')
    
    if (urlGoId && dataGos) {
      const idNumerico = Number(urlGoId)
      setGoSeleccionado(idNumerico)
      const goEncontrado = dataGos.find(g => g.id === idNumerico)
      if (goEncontrado) {
        const nombreGrupo = goEncontrado.group_name.toLowerCase()
        setBandaSeleccionada((nombreGrupo === 'stray kids' || nombreGrupo === 'enhypen') ? (nombreGrupo as any) : 'otros')
      }
      if (dataProductos) {
        const primerProducto = dataProductos.find(p => p.go_id === idNumerico)
        if (primerProducto) setProductoSeleccionado(primerProducto.id)
      }
    } else if (dataGos && dataGos.length > 0) {
      const primerGoSKZ = dataGos.find(g => g.group_name.toLowerCase() === 'stray kids')
      const goInicial = primerGoSKZ || dataGos
      if (goInicial) {
        setGoSeleccionado(goInicial.id)
        const gName = goInicial.group_name.toLowerCase()
        setBandaSeleccionada((gName === 'stray kids' || gName === 'enhypen') ? (gName as any) : 'otros')
        if (dataProductos) {
          const primerProducto = dataProductos.find(p => p.go_id === goInicial.id)
          if (primerProducto) setProductoSeleccionado(primerProducto.id)
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => { inicializarPagina() }, [])
  const slots = (t: string | null) => t ? t.split(',').map(s => s.trim()) : ['Slot Único']

  async function handleClaim(producto: Producto, integrante: string) {
    if (!usuarioEmail) return setMessage('Inicia sesión primero, unnie/oppa 🎀')
    const actuales = producto.claims_integrantes || {}
    if (actuales[integrante]) return setMessage('Ya reclamado por otra personita 😭')
    
    const limite = new Date()
    limite.setDate(limite.getDate() + 2) 
    const nuevos = { ...actuales, [integrante]: usuarioEmail }
    
    const { error } = await supabase.from('productos').update({ 
      claims_integrantes: nuevos, due_date: limite.toISOString()
    }).eq('id', producto.id)
    
    if (!error) { 
      setDatosUltimoClaim({ producto: producto.nombre_producto, slot: integrante, precio: producto.precio })
      setIntegranteSeleccionado(null)
      setMostrarMóduloPago(true) 
      // Refrescamos pasando la posición actual para no mover de banda al cliente
      inicializarPagina(goSeleccionado, producto.id, bandaSeleccionada) 
    }
  }

  async function handleCancelarClaim(producto: Producto, slotName: string) {
    const confirmar = window.confirm(`¿Estás segura de que quieres liberar el slot "${slotName}"? 🌸`);
    if (!confirmar) return;

    const actuales = { ...producto.claims_integrantes };
    delete actuales[slotName]; 

    const { error } = await supabase.from('productos').update({ claims_integrantes: actuales }).eq('id', producto.id);

    if (!error) {
      alert('¡Slot liberado con éxito! 🔓');
      // Refrescamos manteniendo la posición exacta de administración
      inicializarPagina(goSeleccionado, producto.id, bandaSeleccionada);
    } else {
      alert('Hubo un error al cancelar: ' + error.message);
    }
  }
  const gosFiltradosPorBanda = gos.filter(g => {
    const nombre = g.group_name.toLowerCase()
    if (bandaSeleccionada === 'stray kids') return nombre === 'stray kids'
    if (bandaSeleccionada === 'enhypen') return nombre === 'enhypen'
    return nombre !== 'stray kids' && nombre !== 'enhypen'
  })

  const activeGo = gos.find(g => g.id === goSeleccionado)
  const productosDelGo = productos.filter(p => p.go_id === goSeleccionado)
  const activeProducto = productos.find(p => p.id === productoSeleccionado)

  const imagenAExhibir = usuarioHizoClicEnProducto && activeProducto?.imagen_producto
    ? activeProducto.imagen_producto 
    : activeGo?.imagen_general

  const handleCambioGo = (id: number) => {
    setGoSeleccionado(id)
    const primerProd = productos.find(p => p.go_id === id)
    setProductoSeleccionado(primerProd ? primerProd.id : null)
    setIntegranteSeleccionado(null)
    setUsuarioHizoClicEnProducto(false)
    setMessage('')
  }

  const handleCambioBandaPestana = (banda: 'stray kids' | 'enhypen' | 'otros') => {
    setBandaSeleccionada(banda)
    const primerGoDeEsaBanda = gos.find(g => {
      const name = g.group_name.toLowerCase()
      if (banda === 'stray kids') return name === 'stray kids'
      if (banda === 'enhypen') return name === 'enhypen'
      return name !== 'stray kids' && name !== 'enhypen'
    })
    if (primerGoDeEsaBanda) {
      handleCambioGo(primerGoDeEsaBanda.id)
    } else {
      setGoSeleccionado(null)
      setProductoSeleccionado(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs text-pink-400">✧ loading_database.sys ... 📑🌸</div>
  }
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 w-full flex flex-col items-center pb-12">
      
      {/* Header */}
      <div className="w-full max-w-6xl px-6 pt-6 flex justify-between items-center">
        <Link href="/" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition">
          🗂️ ⏤ back to desktop
        </Link>
        <span className="text-[9px] bg-zinc-900 text-white font-mono px-3 py-1 rounded-full">
          👤 {usuarioEmail || 'Invitado'}
        </span>
      </div>

      {/* Categorías */}
      <div className="w-full max-w-6xl px-6 mt-6">
        <div className="text-[9px] font-mono font-black uppercase text-zinc-400 tracking-widest mb-1.5">select k-pop group category</div>
        <div className="flex gap-2 border-b border-zinc-100 pb-3">
          <button type="button" onClick={() => handleCambioBandaPestana('stray kids')} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${bandaSeleccionada === 'stray kids' ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>stray kids</button>
          <button type="button" onClick={() => handleCambioBandaPestana('enhypen')} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${bandaSeleccionada === 'enhypen' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>enhypen</button>
          <button type="button" onClick={() => handleCambioBandaPestana('otros')} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${bandaSeleccionada === 'otros' ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>otros grupos</button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="w-full max-w-6xl px-6 mt-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* PANEL IZQUIERDO */}
        <div className="md:col-span-6 flex flex-col gap-4">
          <div className="relative w-full bg-[#EEF7FC] rounded-3xl min-h-[480px] p-8 flex flex-col justify-between overflow-hidden border border-zinc-100">
            <div className="flex-1 flex items-center justify-center">
              {imagenAExhibir ? (
                <img src={imagenAExhibir} alt="Preview" className="max-h-[340px] w-auto object-contain rounded-2xl drop-shadow-md transition-all duration-300" />
              ) : (
                <div className="text-zinc-300 font-black text-3xl tracking-tighter select-none">NO IMAGE</div>
              )}
            </div>
            <div className="space-y-1.5 mt-4">
              <div className="flex gap-2 text-[9px] uppercase font-black tracking-wider">
                <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-700">{activeGo?.status}</span>
                <span className="bg-[#FFF0F4] text-pink-500 px-2 py-0.5 rounded border border-rose-200">{activeGo?.group_name}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">{activeGo?.title}</h2>
              
              {/* DESCRIPCIÓN DINÁMICA */}
              {usuarioHizoClicEnProducto && activeProducto?.descripcion && (
                <p className="text-xs text-zinc-600 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-zinc-200/50 mt-1 font-medium whitespace-pre-line">
                  {activeProducto.descripcion}
                </p>
              )}

              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-1">
                {usuarioHizoClicEnProducto && activeProducto ? `📦 Viendo ítem: ${activeProducto.nombre_producto}` : '✿ Viendo: Portada General del GO'}
              </p>
            </div>
          </div>
          {message && <p className="text-[10px] font-bold text-center text-pink-500 bg-pink-50/50 py-2 rounded-xl border border-pink-100">{message}</p>}
        </div>
        {/* PANEL DERECHO INTERACTIVO */}
        <div className="md:col-span-6 flex flex-col gap-5">
          
          <div className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-wider border-b pb-1 mb-1">
            📂 Órdenes grupales activas ({bandaSeleccionada})
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {gosFiltradosPorBanda.length === 0 ? (
              <span className="text-[10px] font-mono text-zinc-400 py-1">No hay másterlists de este grupo por el momento 🍰</span>
            ) : (
              gosFiltradosPorBanda.map(g => (
                <button type="button" key={g.id} onClick={() => handleCambioGo(g.id)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border ${goSeleccionado === g.id ? 'bg-pink-500 text-white border-pink-500 shadow-xs' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>{g.title.toLowerCase()}</button>
              ))
            )}
          </div>

          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-1 mt-1">Products / Items</div>
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {productosDelGo.map(prod => {
              const isSelected = productoSeleccionado === prod.id
              return (
                <button
                  type="button"
                  key={prod.id}
                  onClick={() => { setProductoSeleccionado(prod.id); setIntegranteSeleccionado(null); setUsuarioHizoClicEnProducto(true); }}
                  className={`w-full py-2.5 px-5 border rounded-full text-xs font-bold tracking-wide transition-all uppercase text-center ${isSelected ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'}`}
                >
                  {prod.nombre_producto} — \${prod.precio} USD
                </button>
              )
            })}
          </div>

          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-1 mt-1">Options</div>
          {activeProducto && (
            <div className="grid grid-cols-2 gap-2">
              {slots(activeProducto.lista_slots).map(int => {
                const dueño = activeProducto.claims_integrantes?.[int]
                const isCurrentSelection = integranteSeleccionado === int
                return (
                  <button 
                    type="button" 
                    key={int} 
                    disabled={!!dueño} 
                    onClick={() => setIntegranteSeleccionado(int)} 
                    className={`py-3 px-4 rounded-2xl text-xs font-black uppercase border transition-all text-center ${dueño ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed line-through' : isCurrentSelection ? 'bg-pink-500 text-white border-pink-500 shadow-xs' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400'}`}
                  >
                    {int} {dueño ? '🔓' : ''}
                  </button>
                )
              })}
            </div>
          )}

          {integranteSeleccionado && activeProducto && (
            <button
              type="button"
              onClick={() => handleClaim(activeProducto, integranteSeleccionado)}
              className="mt-2 w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all"
            >
              Confirmar Reclamo: {integranteSeleccionado}
            </button>
          )}
          {/* DATOS BANCARIOS Y REDIRECCIÓN DIRECTA A WHATSAPP */}
          {mostrarMóduloPago && datosUltimoClaim && (
            <div className="mt-4 p-6 bg-[#FFF0F4] border border-rose-200 rounded-3xl space-y-4 shadow-xs animate-fade">
              <div className="text-center">
                <h4 className="text-sm font-black text-pink-500 uppercase tracking-wide">✨ ¡Yay! Slot apartado con éxito 🫧</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">Realiza tu transferencia para que no expire tu reserva en 48h ⏰</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-rose-100 p-4 rounded-2xl text-[11px] space-y-1.5 text-zinc-700 font-medium relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 text-lg">💳</div>
                <p><strong>🏦 Banco:</strong> Banco Pichincha / Produbanco</p>
                <p><strong>📄 Tipo:</strong> Cuenta de Ahorros</p>
                <p><strong>💵 Valor a transferir:</strong> <span className="text-pink-500 font-black">${Number(datosUltimoClaim.precio).toFixed(2)} USD</span></p>
              </div>

              <a
                href={"https://whatsapp.com" + NUMERO_WHATSAPP + "&text=" + encodeURIComponent(
                  "¡Hola, holis! Acabo de asegurar un slot en tu web 🐻✨\n\n" +
                  "💌 *User Email (para recordatorios):* " + usuarioEmail + "\n" +
                  "📦 *Product / GO:* " + datosUltimoClaim.producto + "\n" +
                  "🪞 *Slot elegido:* " + datosUltimoClaim.slot + "\n" +
                  "💰 *Valor total:* $" + Number(datosUltimoClaim.precio).toFixed(2) + " USD\n\n" +
                  "Adjunto por aquí la fotito de mi comprobante. ¡Muchas gracias! 💗"
                )}
                target="_self"
                rel="noopener noreferrer"
                onClick={() => setMostrarMóduloPago(false)}
                className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-center"
              >
                💬 ¡Enviar comprobante por WhatsApp! 🍰
              </a>
            </div>
          )}

          {/* 🔒 PROTECCIÓN TOTAL DE ADMIN: Todo este panel ahora es exclusivo para ti */}
          {usuarioEmail === 'liahwang1853@gmail.com' && activeProducto && activeProducto.claims_integrantes && Object.keys(activeProducto.claims_integrantes).length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4">
              <div className="text-center space-y-0.5">
                <h3 className="text-xs font-black text-zinc-800 tracking-tight uppercase">panel control de joiners 🌸</h3>
                <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Resumen unificado de la base de datos</p>
              </div>

              {Object.keys(activeProducto.claims_integrantes).map((slotName, idx) => {
                const correoJoiner = activeProducto.claims_integrantes?.[slotName] || 'Sin correo';
                const fechaLimite = activeProducto.due_date ? new Date(activeProducto.due_date).toLocaleDateString() : '⏳';

                return (
                  <div key={idx} className="w-full bg-white border border-zinc-100 rounded-3xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-50 pb-2">
                      <span className="text-[8px] font-black uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-sm">
                        joiner activo
                      </span>
                      <span className="text-[11px] font-mono font-bold text-zinc-500">
                        {correoJoiner}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-zinc-700 flex justify-between items-center">
                      <span>COMPONENTE: {slotName}</span>
                      <span className="text-[9px] font-mono text-zinc-400">Límite: {fechaLimite}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleCancelarClaim(activeProducto, slotName)}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] uppercase rounded-lg border border-rose-200 transition-all"
                    >
                      🗑️ Liberar / Cancelar este Slot
                    </button>

                    <div className="w-full bg-zinc-950 text-white rounded-xl p-3 flex justify-between items-center font-mono text-[11px]">
                      <span className="text-[9px] uppercase font-bold text-zinc-400">TOTAL PEDIDO ACUMULADO:</span>
                      <span className="font-black text-xs">${Number(activeProducto.precio).toFixed(2)} USD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
