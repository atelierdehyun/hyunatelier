'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic';
const NUMERO_WHATSAPP = '593999530327';
const correoAdmin = 'liahwang1852@gmail.com';

type Go = { id: number; title: string; status: string; group_name: string; imagen_general: string | null; }
type Producto = {
  id: number; go_id: number; nombre_producto: string; precio: number; lista_slots: string | null;
  imagen_producto: string | null; stock_slots: { [key: string]: number } | null;
  claims_integrantes: { [key: string]: { [email: string]: number } } | null; descripcion?: string;
}

export default function Masterlist() {
  const [bandaSeleccionada, setBandaSeleccionada] = useState<'stray kids' | 'enhypen' | 'otros'>('stray kids')
  const [gos, setGos] = useState<Go[]>([]); const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true); const [usuarioEmail, setUsuarioEmail] = useState('')
  const [message, setMessage] = useState(''); const [goSeleccionado, setGoSeleccionado] = useState<number | null>(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null)
  const [carrito, setCarrito] = useState<{ [integrante: string]: number }>({})
  const [mostrarMóduloPago, setMostrarMóduloPago] = useState(false)
  const [datosUltimoClaim, setDatosUltimoClaim] = useState<any>(null)

  // ⚡ NUEVOS ESTADOS OBLIGATORIOS PARA EL CARRITO Y PROOFS
  const [abrirFormularioEnvio, setAbrirFormularioEnvio] = useState(false)
  const [formNombre, setFormNombre] = useState('')
  const [formInstagram, setFormInstagram] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formCiudad, setFormCiudad] = useState('')
  const [formDireccion, setFormDireccion] = useState('')
  const [formMetodoEnvio, setFormMetodoEnvio] = useState('Servientrega')

  async function inicializarPagina(goIdPre: number | null = null, prodIdPre: number | null = null, bandaAct: string = 'stray kids') {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) setUsuarioEmail(session.user.email)
      const { data: dGos } = await supabase.from('gos').select('*')
      const { data: dProds } = await supabase.from('productos').select('*')
      setGos(dGos || []); setProductos(dProds || [])
      if (goIdPre) setGoSeleccionado(goIdPre)
      if (prodIdPre) setProductoSeleccionado(prodIdPre)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { inicializarPagina() }, [])

  const gosFiltrados = gos.filter(g => {
    const n = g.group_name.toLowerCase()
    return bandaSeleccionada === 'stray kids' ? n === 'stray kids' : bandaSeleccionada === 'enhypen' ? n === 'enhypen' : (n !== 'stray kids' && n !== 'enhypen')
  })
  const activeGo = gos.find(g => g.id === goSeleccionado)
  const productosDelGo = productos.filter(p => p.go_id === goSeleccionado)
  const activeProducto = productos.find(p => p.id === productoSeleccionado)

  const handleCambiarCantidadCarrito = (int: string, cambio: number, stockDisp: number) => {
    const nuevaCant = (carrito[int] || 0) + cambio
    if (nuevaCant < 0 || nuevaCant > stockDisp) return
    setMessage(''); setCarrito(prev => ({ ...prev, [int]: nuevaCant }))
  };
  // Al presionar el botón de Checkout, primero validamos el carrito y abrimos el formulario de envío
  function handleGatillarCheckout() {
    if (!usuarioEmail) return setMessage('Inicia sesión primero para realizar tu reserva 🎀')
    if (!activeProducto) return;
    const items = Object.entries(carrito).filter(([_, c]) => c > 0)
    if (items.length === 0) return setMessage('Añade slots al carrito 🐻')
    setMessage('')
    setAbrirFormularioEnvio(true) // Despliega la interfaz de recolección de datos
  }

  async function handleProcesarCompraFinal(e: React.FormEvent) {
    e.preventDefault()
    if (!formNombre || !formInstagram || !formTelefono || !formCiudad || !formDireccion) {
      return alert('Por favor, llena todos los datos de envío e Instagram para tus proofs ya que el proof es necesario SI O SI al momento de comprar conmigo🧸🌸')
    }
    
    setLoading(true)
    const items = Object.entries(carrito).filter(([_, c]) => c > 0)
    const nStock = { ...(activeProducto?.stock_slots || {}) }, nClaims = { ...(activeProducto?.claims_integrantes || {}) }
    let txt = "", tot = 0

    for (const [int, cant] of items) {
      if (cant > (nStock[int] || 0)) { setLoading(false); return alert(`El slot de ${int} se agotó.`); }
      nStock[int] = (nStock[int] || 0) - cant
      if (!nClaims[int]) nClaims[int] = {}
      nClaims[int][usuarioEmail] = (nClaims[int][usuarioEmail] || 0) + cant
      txt += `• ${int} (Cant: ${cant})\n`
      tot += (activeProducto?.precio || 0) * cant
    }

    // Actualizamos el inventario de slots en la tabla productos
    const { error: e1 } = await supabase.from('productos').update({ 
      stock_slots: nStock, claims_integrantes: nClaims, due_date: new Date(Date.now() + 172800000).toISOString() 
    }).eq('id', activeProducto!.id)
    
    if (e1) { setLoading(false); return alert('Error al guardar stock 😭'); }

    // 🚀 INYECCIÓN: Guardamos la orden completa vinculando la ubicación y el instagram del cliente
    await supabase.from('pedidos').insert([{ 
      usuario_email: usuarioEmail, 
      producto_nombre: activeProducto!.nombre_producto, 
      desglose_slots: txt, 
      total_pagar: tot, 
      estado_pago: 'Pendiente Comprobante',
      detalles: `IG: @${formInstagram} | Tlf: ${formTelefono} | Nombre: ${formNombre} | Ciudad: ${formCiudad} | Dir: ${formDireccion} | Envío: ${formMetodoEnvio}`
    }])

    setDatosUltimoClaim({ producto: activeProducto!.nombre_producto, desglose: txt, total: tot, ig: formInstagram, tlf: formTelefono, name: formNombre, ciudad: formCiudad, dir: formDireccion, envio: formMetodoEnvio })
    setCarrito({}); setAbrirFormularioEnvio(false); setMostrarMóduloPago(true)
    inicializarPagina(goSeleccionado, activeProducto!.id, bandaSeleccionada)
  }

  async function handleCancelarClaimAdmin(prod: Producto, int: string, mail: string) {
    const nClaims = { ...prod.claims_integrantes }, nStock = { ...prod.stock_slots }
    if (nClaims[int]?.[mail]) {
      nStock[int] = (nStock[int] || 0) + nClaims[int][mail]; delete nClaims[int][mail]
      if (Object.keys(nClaims[int]).length === 0) delete nClaims[int]
    }
    const { error } = await supabase.from('productos').update({ claims_integrantes: nClaims, stock_slots: nStock }).eq('id', prod.id)
    if (!error) { setMessage(`Slot liberado.`); inicializarPagina(goSeleccionado, prod.id, bandaSeleccionada) }
  }

  const totalLocal = Object.entries(carrito).reduce((acc, [_, c]) => acc + (c * (activeProducto?.precio || 0)), 0)
  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-pink-400">✧ loading_database.sys ... 🌸</div>

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 w-full flex flex-col items-center pb-12 px-4">
      <div className="w-full max-w-4xl pt-4 flex justify-between items-center border-b pb-3">
        <Link href="/" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">🗂️ back to desktop</Link>
        <span className="text-xs bg-zinc-900 text-white font-mono px-3 py-1 rounded-full">👤 {usuarioEmail || 'Invitado'}</span>
      </div>

      {!goSeleccionado ? (
        <div className="w-full max-w-4xl mt-4">
          <div className="flex gap-2 mb-4">
            {(['stray kids', 'enhypen', 'otros'] as const).map(b => (
              <button key={b} type="button" onClick={() => { setBandaSeleccionada(b); setCarrito({}); }} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border ${bandaSeleccionada === b ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-500'}`}>{b}</button>
            ))}
          </div>
          <div className="text-[10px] font-bold uppercase text-zinc-400 mb-2 border-b pb-1">📂 Selecciona un Catálogo ({bandaSeleccionada})</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gosFiltrados.map(g => (
              <button key={g.id} type="button" onClick={() => { setGoSeleccionado(g.id); const firstP = productos.find(p => p.go_id === g.id); setProductoSeleccionado(firstP ? firstP.id : null); setCarrito({}); setMostrarMóduloPago(false); }} className="p-3 rounded-2xl border text-left bg-zinc-50/40 hover:border-zinc-400 flex flex-col justify-between">
                <div className="w-full h-32 bg-[#EEF7FC] rounded-xl flex items-center justify-center overflow-hidden mb-2 border border-zinc-100">
                  {g.imagen_general ? <img src={g.imagen_general} alt="GO" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] text-zinc-300 font-bold">NO PHOTO</span>}
                </div>
                <p className="text-xs font-black uppercase text-zinc-900 line-clamp-2">{g.title.toLowerCase()}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 flex flex-col gap-3">
            <button type="button" onClick={() => { setGoSeleccionado(null); setProductoSeleccionado(null); setCarrito({}); setMostrarMóduloPago(false); }} className="w-full py-2 bg-zinc-100 text-zinc-700 font-bold text-xs uppercase rounded-xl border border-zinc-200 text-center">⬅️ Ver otros catálogos</button>
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border flex flex-col gap-3">
              <div className="w-full h-48 bg-white rounded-xl flex items-center justify-center p-2 border">
                <img src={activeProducto?.imagen_producto || activeGo?.imagen_general || ''} alt="Preview" className="max-h-full object-contain rounded-lg shadow-xs" />
              </div>
              <div>
                <span className="bg-zinc-900 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">{activeGo?.status || 'OPEN'}</span>
                <h3 className="text-sm font-black text-zinc-900 uppercase mt-1">{activeGo?.title}</h3>
                {activeProducto?.descripcion && <p className="text-[11px] text-zinc-600 bg-white p-2.5 rounded-lg border mt-1.5 whitespace-pre-line">{activeProducto.descripcion}</p>}
              </div>
            </div>
            {message && <p className="text-xs font-bold text-center text-pink-500 bg-pink-50 py-1.5 rounded-xl border border-pink-100">{message}</p>}
          </div>
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b pb-1">Items Disponibles</div>
            {!productoSeleccionado ? (
              <div className="flex flex-col gap-1.5">
                {productosDelGo.map(p => (
                  <button key={p.id} type="button" onClick={() => { setProductoSeleccionado(p.id); setCarrito({}); }} className="w-full p-3 rounded-xl border text-xs font-black uppercase bg-white flex justify-between items-center hover:border-zinc-400">
                    <span>📦 {p.nombre_producto.toLowerCase()}</span><span>${p.precio} USD</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-between items-center bg-zinc-950 text-white p-3 rounded-xl shadow-xs">
                <span className="text-xs font-black uppercase truncate">📦 {activeProducto?.nombre_producto.toLowerCase()} — ${activeProducto?.precio} USD</span>
                {productosDelGo.length > 1 && (
                  <button type="button" onClick={() => { setProductoSeleccionado(null); setCarrito({}); setMostrarMóduloPago(false); }} className="text-[10px] bg-white text-zinc-900 font-bold px-2.5 py-1 rounded-md shrink-0">🔄 Cambiar Ítem</button>
                )}
              </div>
            )}

            {activeProducto && productoSeleccionado && !abrirFormularioEnvio && (
              <div className="bg-zinc-50 p-3.5 rounded-2xl border space-y-3">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b pb-1">Elige tus Slots de Integrantes</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {activeProducto.lista_slots?.split(',').map(s => s.trim()).map(int => {
                    const totalC = activeProducto.claims_integrantes?.[int] ? Object.values(activeProducto.claims_integrantes[int]).reduce((a, b) => a + b, 0) : 0
                    const stockD = Math.max(0, (activeProducto.stock_slots?.[int] ?? 0) - totalC)
                    return (
                      <div key={int} className="bg-white p-2.5 rounded-xl border flex justify-between items-center shadow-2xs">
                        <div><p className="text-xs font-black uppercase text-zinc-800">{int}</p><p className="text-[9px] font-mono text-zinc-400">Disp: {stockD}</p></div>
                        {stockD === 0 ? <span className="text-[9px] text-zinc-400 font-bold bg-zinc-50 border px-2 py-0.5 rounded">🔒 OCUPADO</span> : (
                          <div className="flex items-center gap-1.5 bg-zinc-50 p-0.5 rounded border">
                            <button type="button" onClick={() => handleCambiarCantidadCarrito(int, -1, stockD)} className="w-5 h-5 font-bold hover:bg-zinc-200 rounded text-xs flex items-center justify-center">-</button>
                            <span className="font-bold font-mono text-zinc-800 text-xs w-4 text-center">{carrito[int] || 0}</span>
                            <button type="button" onClick={() => handleCambiarCantidadCarrito(int, 1, stockD)} className="w-5 h-5 font-bold hover:bg-zinc-200 rounded text-xs flex items-center justify-center">+</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {totalLocal > 0 && (
                  <div className="bg-zinc-900 text-white rounded-xl p-3 flex flex-col gap-2 shadow-xs">
                    <div className="flex justify-between items-center text-xs font-mono"><span>TOTAL PEDIDO:</span><span className="font-black text-pink-400">${totalLocal.toFixed(2)} USD</span></div>
                    <button type="button" onClick={handleGatillarCheckout} className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 rounded-lg text-xs font-black uppercase tracking-wider">👑 Reservar y llenar datos</button>
                  </div>
                )}
              </div>
            )}
            {/* 📝 FORMULARIO DE ENVÍO E INSTAGRAM */}
            {abrirFormularioEnvio && (
              <form onSubmit={handleProcesarCompraFinal} className="bg-white border border-pink-100 p-5 rounded-2xl space-y-3 shadow-sm animate-fade">
                <div className="border-b pb-1 flex justify-between items-center"><h3 className="text-xs font-black text-purple-600 uppercase font-mono">📋 DATOS DE DESPACHO Y PROOFS</h3><button type="button" onClick={() => setAbrirFormularioEnvio(false)} className="text-[10px] text-zinc-400 font-bold">CANCELAR</button></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Nombre Completo</label><input type="text" placeholder="Ej: Lia Hwang" required value={formNombre} onChange={e => setFormNombre(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Instagram (Sin @)</label><input type="text" placeholder="Ej: hyun_atelier" required value={formInstagram} onChange={e => setFormInstagram(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50 font-bold text-purple-600" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Teléfono / WhatsApp</label><input type="tel" placeholder="Ej: 0999530327" required value={formTelefono} onChange={e => setFormTelefono(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Ciudad / Provincia</label><input type="text" placeholder="Ej: Quito" required value={formCiudad} onChange={e => setFormCiudad(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
                </div>
                <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Dirección Domicilio</label><input type="text" placeholder="Calles principales y referencia" required value={formDireccion} onChange={e => setFormDireccion(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
                <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Método de Envío</label><select value={formMetodoEnvio} onChange={e => setFormMetodoEnvio(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50 font-semibold"><option value="Servientrega a Domicilio">🚚 Servientrega a Domicilio</option><option value="Retiro Físico en Oficina">🍰 Retiro Físico en Cumbayá</option></select></div>
                <button type="submit" className="w-full py-2.5 bg-zinc-950 text-white font-black text-xs uppercase tracking-widest rounded-xl mt-1">🔒 Confirmar Reserva de Slots</button>
              </form>
            )}
            {/* MÓDULO DE DATOS BANCARIOS */}
            {mostrarMóduloPago && datosUltimoClaim && (
              <div className="p-4 bg-[#FFF0F4] border border-rose-200 rounded-xl space-y-2">
                <div className="bg-white p-3 rounded-lg text-xs space-y-1 text-zinc-700 border">
                  <p><strong>🏦 Cuenta de Ahorros:</strong> Banco Pichincha solamente</p>
                  <p><strong>💵 Valor Total a transferir:</strong> <span className="text-pink-500 font-black">${datosUltimoClaim.total.toFixed(2)} USD</span></p>
                </div>
                <a href={`https://whatsapp.com{NUMERO_WHATSAPP}&text=${encodeURIComponent(
                  `¡Hola holis! Acabo de apartar slots en la web 🐻✨\n\n` +
                  `💌 *Joiner:* ${formNombre} (@${datosUltimoClaim.ig})\n` +
                  `📱 *Contacto:* ${datosUltimoClaim.tlf}\n` +
                  `📍 *Destino:* ${datosUltimoClaim.ciudad} — ${datosUltimoClaim.dir}\n` +
                  `🚚 *Método:* ${datosUltimoClaim.envio}\n\n` +
                  `📋 *Desglose de slots:*\n${datosUltimoClaim.desglose}` +
                  `💰 *Total a pagar:* $${datosUltimoClaim.total.toFixed(2)} USD\n\n` +
                  `Adjunto mi comprobante por aquí. ¡Muchas gracias! 💗`
                )}`} target="_blank" rel="noopener noreferrer" onClick={() => setMostrarMóduloPago(false)} className="w-full py-2 bg-emerald-500 text-white font-black text-xs uppercase rounded-lg text-center block">💬 ¡Enviar Comprobante e Info a WhatsApp! 🍰</a>
              </div>
            )}

            {/* Candado de Administrador en minúsculas */}
            {usuarioEmail === correoAdmin && activeProducto && activeProducto.claims_integrantes && Object.keys(activeProducto.claims_integrantes).length > 0 && (
              <div className="mt-2 pt-3 border-t space-y-1.5">
                <div className="text-center"><h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Panel Control Admin 👑</h3></div>
                {Object.keys(activeProducto.claims_integrantes).map((sName) => 
                  Object.entries(activeProducto.claims_integrantes?.[sName] || {}).map(([mail, cant]) => {
                    if (usuarioEmail !== correoAdmin) return null;
                    return (
                      <div key={`${sName}-${mail}`} className="bg-white border rounded-xl p-2.5 flex justify-between items-center text-xs shadow-2xs">
                        <div><p className="font-bold uppercase text-zinc-800">Slot: {sName}</p><p className="text-zinc-500 font-mono text-[10px]">{mail} ({cant} und)</p></div>
                        <button type="button" onClick={() => handleCancelarClaimAdmin(activeProducto, sName, mail)} className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2.5 py-1 rounded border border-rose-200 uppercase hover:bg-rose-100 transition-all shrink-0">Liberar</button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
