'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic';
const NUMERO_WHATSAPP = '593999530327';

// Precios de envío configurables que tenías en tu código original
const PRECIOS_ENVIO = {
  quito: 3.50,
  provincia: 6.50,
  peru: 0.00
};

interface ProductoShop {
  id: number;
  nombre_producto: string;
  precio: number;
  descripcion: string | null;
  estado_pago: string; // 'INSTOCK' o 'SOLD OUT'
  due_date: string; // Aquí guardamos el grupo/categoría (stray kids, enhypen, otros)
  imagen_producto: string | null;
  cantidad_disponible: number;
}

export default function AtelierShop() {
  const [productos, setProductos] = useState<ProductoShop[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODOS')
  const [loading, setLoading] = useState(true)
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [message, setMessage] = useState('')

  // Formulario rápido para checkout directo de la mercancía física
  const [mostrarModalCompra, setMostrarModalCompra] = useState(false)
  const [productoAComprar, setProductoAComprar] = useState<ProductoShop | null>(null)
  const [formNombre, setFormNombre] = useState('')
  const [formInstagram, setFormInstagram] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formCiudad, setFormCiudad] = useState('')
  const [formDireccion, setFormDireccion] = useState('')
  const [formMetodoEnvio, setFormMetodoEnvio] = useState('quito')
  const [datosExito, setDatosExito] = useState<any>(null)

  async function cargarTienda() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) setUsuarioEmail(session.user.email)

      // 🚀 CONEXIÓN REPARADA: Leemos directo de la tabla limpia tienda_productos
      const { data, error } = await supabase.from('tienda_productos').select('*')
      if (error) throw error
      setProductos(data || [])
    } catch (e: any) {
      console.error(e)
      setMessage('Error cargando la tienda física 😭')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarTienda() }, [])

  // Filtrado inteligente por botones
  const productosFiltrados = productos.filter(p => {
    if (categoriaSeleccionada === 'TODOS') return true
    return p.due_date?.toLowerCase() === categoriaSeleccionada.toLowerCase()
  })
  function iniciarCompraDirecta(prod: ProductoShop) {
    if (!usuarioEmail) return alert('Por favor inicia sesión primero para comprar en la shop 🎀')
    setProductoAComprar(prod)
    setMostrarModalCompra(true)
  }

  async function procesarPedidoShop(e: React.FormEvent) {
    e.preventDefault()
    if (!productoAComprar || !formNombre || !formInstagram || !formTelefono || !formCiudad || !formDireccion) {
      return alert('Completa todos los campos e Instagram para tus proofs de entrega 🧸🌸')
    }

    setLoading(true)
    const nuevoStock = Math.max(0, productoAComprar.cantidad_disponible - 1)
    const nuevoEstado = nuevoStock === 0 ? 'SOLD OUT' : productoAComprar.estado_pago

    // 1. Restamos una unidad del stock en tu nueva tabla tienda_productos
    const { error: errorStock } = await supabase.from('tienda_productos')
      .update({ cantidad_disponible: nuevoStock, estado_pago: nuevoEstado })
      .eq('id', productoAComprar.id)

    if (errorStock) { setLoading(false); return alert('Error procesando stock de la tienda 😭'); }

    const costoEnvio = PRECIOS_ENVIO[formMetodoEnvio as keyof typeof PRECIOS_ENVIO] || 0
    const totalFinal = productoAComprar.precio + costoEnvio

    // 2. Inyectamos la orden en pedidos vinculando los datos de envío
    await supabase.from('pedidos').insert([
      {
        usuario_email: usuarioEmail,
        producto_nombre: productoAComprar.nombre_producto,
        total_pagar: totalFinal,
        estado_pago: 'Pendiente Comprobante',
        detalles: `IG: @${formInstagram} | Tlf: ${formTelefono} | Nombre: ${formNombre} | Ciudad: ${formCiudad} | Dir: ${formDireccion} | Envío: ${formMetodoEnvio.toUpperCase()} ($${costoEnvio})`
      }
    ])

    setDatosExito({ producto: productoAComprar.nombre_producto, total: totalFinal, envio: formMetodoEnvio, costo: costoEnvio })
    setMostrarModalCompra(false)
    cargarTienda()
  }
  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-zinc-400">✧ cargando_shop_stock.sys ... 🛍️</div>

  return (
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-800 w-full flex flex-col items-center pb-12 p-4 antialiased">
      <div className="w-full max-w-4xl pt-4 flex justify-between items-center border-b pb-3 border-zinc-200">
        <Link href="/gos" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-600">🗂️ ⏤ ver masterlists</Link>
        <span className="text-[9px] bg-zinc-950 text-white font-mono px-3 py-1 rounded-full">👤 {usuarioEmail || 'Invitado'}</span>
      </div>

      <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs mt-4 p-6 flex flex-col items-center">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">Hyune Atelier Shop</h1>
        <p className="text-xs text-zinc-400 mt-1 uppercase font-semibold">Encuentra aquí merch que está lista para ser enviada o que solo requiere un solo pago, por si no deseas esperar mucho :3</p>

        {/* Botones de Categorías */}
        <div className="flex gap-1.5 bg-zinc-100 p-1 rounded-xl mt-4 border">
          {['TODOS', 'STRAY KIDS', 'ENHYPEN', 'OTROS'].map(cat => (
            <button key={cat} type="button" onClick={() => setCategoriaSeleccionada(cat)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${categoriaSeleccionada === cat ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-200/50'}`}>{cat}</button>
          ))}
        </div>

        {/* GRID DE PRODUCTOS EN VIVO */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          {productosFiltrados.length === 0 ? (
            <p className="text-xs font-mono text-zinc-400 text-center col-span-full py-8 border border-dashed rounded-2xl">No hay mercancía física publicada en esta categoría 🍰</p>
          ) : (
            productosFiltrados.map(p => (
              <div key={p.id} className="border border-zinc-100 bg-zinc-50/40 p-3 rounded-2xl flex flex-col justify-between hover:border-zinc-300 transition-all relative">
                <div className="w-full h-36 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-zinc-200/50 p-1 relative">
                  {p.imagen_producto ? <img src={p.imagen_producto} alt="Item" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] text-zinc-300 font-bold">NO PIC</span>}
                  {p.estado_pago === 'SOLD OUT' && <span className="absolute bg-zinc-950/80 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">SOLD OUT</span>}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-black uppercase text-zinc-900 truncate leading-tight">{p.nombre_producto.toLowerCase()}</p>
                  {p.descripcion && <p className="text-[10px] text-zinc-400 line-clamp-1 lowercase">{p.descripcion}</p>}
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-100">
                    <span className="font-mono text-xs font-black text-zinc-900">${p.precio} USD</span>
                    <button type="button" disabled={p.estado_pago === 'SOLD OUT'} onClick={() => iniciarCompraDirecta(p)} className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg transition-all ${p.estado_pago === 'SOLD OUT' ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600 shadow-3xs'}`}>Pedir</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL CHECKOUT DE PRODUCTO FÍSICO */}
      {mostrarModalCompra && productoAComprar && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={procesarPedidoShop} className="bg-white border rounded-3xl p-5 max-w-md w-full space-y-3 shadow-xl">
            <div className="border-b pb-1 flex justify-between items-center"><h3 className="text-xs font-black text-purple-600 uppercase font-mono">🛍️ COMPRA: {productoAComprar.nombre_producto}</h3><button type="button" onClick={() => setMostrarModalCompra(false)} className="text-zinc-400 text-xs font-bold">✕</button></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Nombre Completo</label><input type="text" required value={formNombre} onChange={e => setFormNombre(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
              <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Instagram (Sin @)</label><input type="text" required value={formInstagram} onChange={e => setFormInstagram(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50 font-bold text-purple-600" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Teléfono</label><input type="tel" required value={formTelefono} onChange={e => setFormTelefono(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
              <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Ciudad / Provincia</label><input type="text" required value={formCiudad} onChange={e => setFormCiudad(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
            </div>
            <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Dirección Domicilio</label><input type="text" required value={formDireccion} onChange={e => setFormDireccion(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50" /></div>
            <div className="flex flex-col gap-0.5"><label className="text-[8px] font-bold uppercase text-zinc-400">Ubicación Envío (Costo adicional)</label><select value={formMetodoEnvio} onChange={e => setFormMetodoEnvio(e.target.value)} className="border rounded-xl px-2.5 py-1.5 text-xs bg-zinc-50/50 font-bold"><option value="quito">Quito (+$3.50)</option><option value="provincia">Otras Provincias (+$6.50)</option><option value="peru">Perú Internac. ($0.00)</option></select></div>
            <button type="submit" className="w-full py-2.5 bg-zinc-950 text-white font-black text-xs uppercase tracking-widest rounded-xl mt-1">🔒 Confirmar Compra de Tienda</button>
          </form>
        </div>
      )}

      {/* COMPROBANTE FINAL DE LA SHOP */}
      {datosExito && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFF0F4] border border-rose-200 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-xl animate-fade text-center">
            <h4 className="text-xs font-black text-pink-500 uppercase">✨ ¡Reserva de Shop Exitosa! 🫧</h4>
            <div className="bg-white p-4 rounded-xl text-left text-xs space-y-1 text-zinc-700">
              <p><strong>🏦 Cuentas:</strong> Pichincha / Produbanco (Ahorros)</p>
              <p><strong>📦 Artículo:</strong> {datosExito.producto}</p>
              <p><strong>💵 Valor Final (+ Envío):</strong> <span className="text-pink-500 font-black">${datosExito.total.toFixed(2)} USD</span></p>
            </div>
            <a href={`https://whatsapp.com{NUMERO_WHATSAPP}&text=${encodeURIComponent(`¡Holis, Atelier! Compré un artículo en stock físico 🛍️✨\n\n💌 *Joiner:* ${formNombre} (@${formInstagram})\n📱 *Contacto:* ${formTelefono}\n📍 *Ubicación:* ${formCiudad} — ${formDireccion}\n\n📦 *Artículo:* ${datosExito.producto}\n💰 *Monto Final (+ Envío):* $${datosExito.total.toFixed(2)} USD\n\nAdjunto por aquí mi comprobante de depósito. 💗`)}`} target="_blank" rel="noopener noreferrer" onClick={() => setDatosExito(null)} className="w-full py-2.5 bg-emerald-500 text-white font-black text-xs uppercase rounded-xl block">💬 Enviar Comprobante a WhatsApp</a>
          </div>
        </div>
      )}
    </div>
  )
}
