'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

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
}

export default function Masterlist() {
  const [pestanaActiva, setPestanaActiva] = useState<'masterlist' | 'mis_claims'>('masterlist')
  const [gos, setGos] = useState<Go[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [message, setMessage] = useState('')
  
  const [goSeleccionado, setGoSeleccionado] = useState<number | null>(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null)
  const [integranteSeleccionado, setIntegranteSeleccionado] = useState<string | null>(null)
  async function inicializarPagina() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) setUsuarioEmail(user.email)
    
    // Descargamos los datos ordenando los GOs del más nuevo al más viejo
    const { data: dataGos } = await supabase.from('gos').select('*').order('id', { ascending: false })
    const { data: dataProductos } = await supabase.from('productos').select('*').order('id', { ascending: true })
    
    if (dataGos) setGos(dataGos)
    if (dataProductos) setProductos(dataProductos)
    
    const queryParams = new URLSearchParams(window.location.search)
    const urlGoId = queryParams.get('goId')
    
    if (urlGoId && dataGos) {
      const idNumerico = Number(urlGoId)
      setGoSeleccionado(idNumerico)
      if (dataProductos) {
        const primerProducto = dataProductos.find(p => p.go_id === idNumerico)
        if (primerProducto) setProductoSeleccionado(primerProducto.id)
      }
    } else if (dataGos && dataGos.length > 0) {
      const primerGoReal = dataGos[0]
      setGoSeleccionado(primerGoReal.id)
      
      if (dataProductos) {
        const primerProducto = dataProductos.find(p => p.go_id === primerGoReal.id)
        if (primerProducto) {
          setProductoSeleccionado(primerProducto.id)
        } else {
          setProductoSeleccionado(null)
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => { 
    inicializarPagina() 
  }, [])

  const slots = (t: string | null) => t ? t.split(',').map(s => s.trim()) : ['Slot Único']
  async function handleClaim(producto: Producto, integrante: string) {
    if (!usuarioEmail) return setMessage('Inicia sesión primero 🎀')
    
    // 🔍 VERIFICACIÓN DE INVENTARIO: Comprobamos si el ítem tiene existencias reales
    const stockActual = (producto as any).cantidad_disponible ?? 1;
    if (stockActual <= 0) {
      alert('¡Agotado! Este artículo ya se encuentra SOLD OUT 😭');
      return;
    }

    const actuales = producto.claims_integrantes || {}
    if (actuales[integrante]) return setMessage('Ya reclamado 😭')
    
    const limite = new Date(); limite.setDate(limite.getDate() + 2)
    const nuevos = { ...actuales, [integrante]: usuarioEmail }
    
    // 🧮 RESTA AUTOMÁTICA: Calculamos la nueva cantidad restante
    const nuevoStock = stockActual - 1;

    // Actualizamos tanto las reservas como la cantidad disponible en Supabase
    const { error } = await supabase.from('productos').update({ 
      claims_integrantes: nuevos, 
      due_date: limite.toISOString(),
      cantidad_disponible: nuevoStock // La base de datos descuenta 1 unidad sola
    }).eq('id', producto.id)
    
    if (!error) { 
      alert(`¡Claim exitoso! Tienes 48h para registrar tu pago. Quedan ${nuevoStock} unidades libres.`); 
      setIntegranteSeleccionado(null)
      inicializarPagina() 
    }
  }

  const misClaims = (() => {
    const list: any[] = []
    productos.forEach(p => Object.keys(p.claims_integrantes || {}).forEach(k => {
      if (p.claims_integrantes?.[k] === usuarioEmail) {
        const goAsociado = gos.find(g => g.id === p.go_id)
        list.push({ 
          title: goAsociado ? goAsociado.title : 'GO', 
          item: p.nombre_producto,
          int: k, 
          precio: p.precio,
          date: p.due_date ? new Date(p.due_date).toLocaleDateString() : '⏳' 
        })
      }
    }))
    return list
  })()

  const activeGo = gos.find(g => g.id === goSeleccionado)
  const productosDelGo = productos.filter(p => p.go_id === goSeleccionado)
  const activeProducto = productos.find(p => p.id === productoSeleccionado)

  const imagenAExhibir = activeProducto?.imagen_producto || activeGo?.imagen_general

  const handleCambioGo = (id: number) => {
    setGoSeleccionado(id)
    const primerProd = productos.find(p => p.go_id === id)
    setProductoSeleccionado(primerProd ? primerProd.id : null)
    setIntegranteSeleccionado(null)
    setMessage('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs">
        ✧ loading_database.sys ...
      </div>
    )
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

      {/* Tabs */}
      <div className="w-full max-w-6xl px-6 mt-6">
        <div className="flex gap-2 text-[10px] font-mono border-b border-zinc-100 pb-2">
          <button onClick={() => setPestanaActiva('masterlist')} className={`px-4 py-2 rounded-full font-bold transition-all ${pestanaActiva === 'masterlist' ? 'bg-[#FFF0F4] text-pink-500 border border-rose-100' : 'text-zinc-400'}`}>📂 masterlist.sys</button>
          <button onClick={() => setPestanaActiva('mis_claims')} className={`px-4 py-2 rounded-full font-bold transition-all ${pestanaActiva === 'mis_claims' ? 'bg-[#FFF0F4] text-pink-500 border border-rose-100' : 'text-zinc-400'}`}>🎀 mis_claims.sys ({misClaims.length})</button>
        </div>
      </div>

      {pestanaActiva === 'masterlist' ? (
        <div className="w-full max-w-6xl px-6 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* PANEL IZQUIERDO (VISUAL) */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="relative w-full bg-[#EEF7FC] rounded-3xl min-h-[480px] p-8 flex flex-col justify-between overflow-hidden border border-zinc-100">
              <div className="flex-1 flex items-center justify-center">
                {imagenAExhibir ? (
                  <img src={imagenAExhibir} alt="Preview" className="max-h-[300px] w-auto object-contain rounded-2xl drop-shadow-md" />
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
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {activeProducto ? `Viendo: ${activeProducto.nombre_producto}` : 'SELECCIONA UN ITEM'}
                </p>
              </div>
            </div>
            {message && <p className="text-[10px] font-bold text-center text-pink-500 bg-pink-50/50 py-2 rounded-xl border border-pink-100">{message}</p>}
          </div>
          {/* PANEL DERECHO (CONTROLADORES INTERACTIVOS) */}
          <div className="md:col-span-6 flex flex-col gap-5">
            
            {/* 🔄 SELECTOR AUTOMÁTICO DE GOs ACTIVOS */}
            <div className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-wider border-b pb-1 mb-2">
              📂 Cambiar de másterlist / go
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-3">
              {gos.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleCambioGo(g.id)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border ${
                    goSeleccionado === g.id
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {g.title.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-1">Products / Items</div>

            {/* Listado de Productos Ovalados */}
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {productosDelGo.map(prod => {
                const isSelected = productoSeleccionado === prod.id
                return (
                  <button
                    key={prod.id}
                    onClick={() => { setProductoSeleccionado(prod.id); setIntegranteSeleccionado(null); }}
                    className={`w-full py-2.5 px-5 border rounded-full text-xs font-bold tracking-wide transition-all uppercase text-center ${
                      isSelected ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {prod.nombre_producto} — \${prod.precio} USD
                  </button>
                )
              })}
            </div>

            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-1 mt-1">Options</div>

            {/* Grilla de Integrantes en Cápsulas */}
            {activeProducto && (
              <div className="grid grid-cols-2 gap-2">
                {slots(activeProducto.lista_slots).map(int => {
                  const dueño = activeProducto.claims_integrantes?.[int]
                  const isCurrentSelection = integranteSeleccionado === int
                  return (
                    <button
                      key={int}
                      disabled={!!dueño}
                      onClick={() => setIntegranteSeleccionado(isCurrentSelection ? null : int)}
                      className={`flex flex-col items-center justify-center py-2.5 px-4 rounded-full border text-xs font-bold transition-all ${
                        dueño ? 'bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed line-through' :
                        isCurrentSelection ? 'bg-pink-500 text-white border-pink-500 shadow-sm' :
                        'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="truncate max-w-full text-[12px]">{int}</span>
                      <span className={`text-[8px] uppercase tracking-wider font-mono mt-0.5 ${dueño ? 'text-zinc-300' : isCurrentSelection ? 'text-pink-100' : 'text-zinc-400'}`}>
                        {dueño ? 'ocupado' : isCurrentSelection ? 'es tuyo ♡' : 'libre ♡'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Widget de Transferencia Automático */}
            {integranteSeleccionado && activeProducto ? (
              <div className="border border-purple-200 bg-purple-50/40 rounded-2xl p-4 mt-2 space-y-3">
                <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Anexo: Datos Bancarios</h4>
                    <p className="text-[11px] font-bold text-zinc-700 mt-0.5">Item: {activeProducto.nombre_producto} ({integranteSeleccionado})</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-purple-700 text-sm">\${activeProducto.precio} USD</p>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-600 font-medium">
                  <p>• <span className="font-bold text-zinc-800">Banco:</span> Tu Banco / PayPal</p>
                  <p>• <span className="font-bold text-zinc-800">Cuenta:</span> 1234-5678-9012</p>
                  <p>• <span className="font-bold text-zinc-800">Titular:</span> Hyun Atelier Owner</p>
                </div>
                <button onClick={() => handleClaim(activeProducto, integranteSeleccionado)} className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[11px] uppercase py-3 rounded-full tracking-widest transition shadow-md">
                  ✓ Confirmar Reserva (48h de plazo)
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-200 rounded-2xl p-4 text-center text-[10px] font-mono text-zinc-400 uppercase tracking-wider bg-zinc-50/50">
                Selecciona un integrante disponible para ver los datos de pago
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HISTORIAL INDIVIDUAL DE COMPRAS */
        <div className="w-full max-w-2xl px-6 mt-8">
          <h1 className="text-2xl font-black tracking-tight text-center text-zinc-900 mb-6 uppercase">resumen de claims.</h1>
          {misClaims.length === 0 ? (
            <p className="text-center text-xs text-zinc-400 py-12 font-mono border border-dashed border-zinc-200 rounded-2xl bg-zinc-50">No has reservado ningún integrante todavía 🍰</p>
          ) : (
            <div className="space-y-6">
              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="divide-y divide-zinc-100">
                  {misClaims.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-zinc-800">{item.title}</p>
                        <p className="text-[10px] text-pink-500 font-semibold uppercase mt-0.5">{item.item} — {item.int}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-black text-zinc-700">\${item.precio}</p>
                        <p className="text-[9px] text-rose-500 font-mono mt-0.5">Límite: {item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-zinc-950 text-white p-4 flex justify-between items-center text-xs font-bold">
                  <span className="uppercase text-[10px] tracking-wider">Total a Pagar:</span>
                  <span className="font-mono text-sm">\${misClaims.reduce((acc, curr) => acc + Number(curr.precio), 0).toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
