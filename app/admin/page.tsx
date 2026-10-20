'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

type Go = { id: number; title: string; group_name: string }

type ArticuloAgrupado = {
  idUnico: string
  tipo: 'GO' | 'SHOP'
  nombreItem: string
  subTexto: string
  precio: number
  limite: string
}

type ResumenJoiner = {
  correo: string
  articulos: ArticuloAgrupado[]
  totalAcumulado: number
}

type ProductoAdmin = {
  id: number;
  nombre_producto: string;
  precio: number;
  go_id: number;
}

export default function AdminPanelPremium() {
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  
  const [listaJoiners, setListaJoiners] = useState<ResumenJoiner[]>([])
  const [gosAdmin, setGosAdmin] = useState<Go[]>([])
  const [productosAdmin, setProductosAdmin] = useState<ProductoAdmin[]>([])
  const correoAdmin = 'liahwang1852@gmail.com'

  // Estados Formulario 1 (GOs globales)
  const [newGoTitle, setNewGoTitle] = useState('')
  const [newGoGroup, setNewGoGroup] = useState('')
  const [newGoStatus, setNewGoStatus] = useState('OPEN')
  const [newGoImage, setNewGoImage] = useState('')

  // Estados Formulario 2 (Items/Productos de GOs)
  const [selectedGoId, setSelectedGoId] = useState<number | null>(null)
  const [newProdName, setNewProdName] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [newProdSlots, setNewProdSlots] = useState('')
  const [newProdImage, setNewProdImage] = useState('')

  // Estados Formulario 3 (Productos en Stock / Shop)
  const [newShopName, setNewShopName] = useState('')
  const [newShopPrice, setNewShopPrice] = useState('')
  const [newShopStatus, setNewShopStatus] = useState('INSTOCK')
  const [newShopImage, setNewShopImage] = useState('') // Estado para la foto de la Shop
  async function cargarDatosHibridos() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUsuarioEmail(user.email)
        
        if (user.email === correoAdmin) {
          const mapeoClientes: { [key: string]: ArticuloAgrupado[] } = {}

          // Descargar GOs globales
          const { data: dataGos } = await supabase.from('gos').select('*')
          if (dataGos) {
            setGosAdmin(dataGos.map(g => ({ id: g.id, title: g.title, group_name: g.group_name })))
            if (dataGos.length > 0 && !selectedGoId) setSelectedGoId(dataGos.id)

            dataGos.forEach(go => {
              const claims = go.claims_integrantes || {}
              const precioFijoGO = 12.50
              
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

          // Descargar Productos Catálogo para borrar
          const { data: dataAllProds } = await supabase.from('productos').select('id, nombre_producto, precio, go_id')
          if (dataAllProds) setProductosAdmin(dataAllProds)

          // Descargar Pedidos Shop Stock
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
                  subTexto: `ESTADO: ${ped.estado || 'EN STOCK'} 📦`,
                  precio: ped.total_pagar || 0,
                  limite: 'Inmediato'
                })
              }
            })
          }

          const resumenFinal: ResumenJoiner[] = Object.keys(mapeoClientes).map(correo => {
            const items = mapeoClientes[correo]
            const total = items.reduce((suma, item) => suma + item.precio, 0)
            return { correo, articulos: items, totalAcumulado: total }
          })

          setListaJoiners(resumenFinal)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatosHibridos() }, [])
  async function uploadImageHandler(e: React.ChangeEvent<HTMLInputElement>, targetForm: 'go' | 'prod' | 'shop') {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSubiendoImagen(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('fotos-productos')
      .upload(filePath, file)

    if (uploadError) {
      alert('Error subiendo imagen: ' + uploadError.message)
      setSubiendoImagen(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('fotos-productos')
      .getPublicUrl(filePath)

    if (targetForm === 'go') {
      setNewGoImage(publicUrl)
    } else if (targetForm === 'prod') {
      setNewProdImage(publicUrl)
    } else {
      setNewShopImage(publicUrl) // Guarda la foto en el estado de la Shop
    }
    setSubiendoImagen(false)
    alert('¡Imagen cargada correctamente desde tu galería! 📸✨')
  }

  async function handleCrearGO(e: React.FormEvent) {
    e.preventDefault()
    if (!newGoTitle || !newGoGroup) return alert('Por favor llena el título y grupo 🎀')
    setLoadingForm(true)

    const { error } = await supabase.from('gos').insert([
      { title: newGoTitle.toUpperCase(), group_name: newGoGroup.toLowerCase(), status: newGoStatus, imagen_general: newGoImage || null }
    ])

    setLoadingForm(false)
    if (!error) {
      alert('¡Lanzamiento Global creado con éxito! ✨')
      setNewGoTitle('')
      setNewGoGroup('')
      setNewGoImage('')
      cargarDatosHibridos()
    } else {
      alert('Error al guardar el GO: ' + error.message)
    }
  }

  async function handleCrearProducto(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGoId || !newProdName || !newProdPrice || !newProdSlots) {
      return alert('Por favor completa todos los datos del artículo 🧸')
    }
    setLoadingForm(true)

    const { error } = await supabase.from('productos').insert([
      { go_id: selectedGoId, nombre_producto: newProdName.toUpperCase(), precio: Number(newProdPrice), lista_slots: newProdSlots, imagen_producto: newProdImage || null, claims_integrantes: {} }
    ])

    setLoadingForm(false)
    if (!error) {
      alert('¡Artículo añadido correctamente al catálogo! 📦')
      setNewProdName('')
      setNewProdPrice('')
      setNewProdSlots('')
      setNewProdImage('')
      cargarDatosHibridos()
    } else {
      alert('Error al guardar el artículo: ' + error.message)
    }
  }
  async function handleCrearItemShop(e: React.FormEvent) {
    e.preventDefault()
    if (!newShopName || !newShopPrice) return alert('Por favor llena el nombre y precio de la mercancía 🛍️')
    setLoadingForm(true)

    const { error } = await supabase.from('pedidos').insert([
      {
        detalles: newShopName.toUpperCase(),
        total_pagar: Number(newShopPrice),
        estado: newShopStatus,
        imagen_producto: newShopImage || null, // Guardamos la foto subida en la base de datos
        user_email: 'STOCK_TIENDA_FISICA'
      }
    ])

    setLoadingForm(false)
    if (!error) {
      alert('¡Producto en Stock publicado correctamente en la Shop! 📦✨')
      setNewShopName('')
      setNewShopPrice('')
      setNewShopImage('')
      cargarDatosHibridos()
    } else {
      alert('Error al guardar en la Shop: ' + error.message)
    }
  }

  async function handleEliminarProducto(idProd: number) {
    if (!confirm('¿Estás segura de que deseas borrar este ítem del sistema? El cambio será permanente 🧸')) return
    const { error } = await supabase.from('productos').delete().eq('id', idProd)
    if (!error) {
      alert('¡Artículo eliminado con éxito! ✨')
      cargarDatosHibridos()
    } else {
      alert('Error al eliminar: ' + error.message)
    }
  }

  async function handleEliminarGO(idGo: number) {
    if (!confirm('⚠️ ¡ALERTA CRÍTICA! Si eliminas esta másterlist, se borrarán todos sus artículos e integrantes asociados de golpe. ¿Deseas continuar?')) return
    const { error } = await supabase.from('gos').delete().eq('id', idGo)
    if (!error) {
      alert('¡Másterlist eliminada correctamente! 🧹')
      setSelectedGoId(null)
      cargarDatosHibridos()
    } else {
      alert('Error al eliminar: ' + error.message)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs text-zinc-400">✧ abriendo_escritorio_global_admin.sys ...</div>
  
  if (usuarioEmail !== correoAdmin) {
    return (
      <div className="min-h-screen bg-[#FFF0F4] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <p className="text-sm font-bold text-rose-500 bg-white border border-rose-100 px-6 py-3 rounded-full shadow-sm">✕ Acceso denegado. Panel exclusivo de Atelier de Hyun 🎀</p>
        <Link href="/gos" className="text-xs font-mono uppercase tracking-widest text-zinc-400 underline hover:text-zinc-900">Volver a la Masterlist ➔</Link>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-700 w-full flex flex-col items-center antialiased pb-12 px-4">
      
      {/* Botón Volver */}
      <div className="w-full max-w-5xl pt-6 text-left">
        <Link href="/gos" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-600 transition-colors">
          🗂️ ⏤ volver a la masterlist
        </Link>
      </div>

      {/* Grilla triple de formularios */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-start">
        
        {/* STEP 1: LANZAMIENTO GLOBAL */}
        <form onSubmit={handleCrearGO} className="bg-white border border-pink-100 rounded-3xl p-5 space-y-2.5 shadow-xs">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-pink-500 border-b border-pink-50 pb-1 font-mono">✿ STEP 1: REGISTRAR GO GLOBAL</h2>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Título del GO</label>
            <input type="text" placeholder="STRAY KIDS POPUP" value={newGoTitle} onChange={e => setNewGoTitle(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Banda / Grupo</label>
            <input type="text" placeholder="stray kids" value={newGoGroup} onChange={e => setNewGoGroup(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Portada Catálogo</label>
            <input type="file" accept="image/*" onChange={e => uploadImageHandler(e, 'go')} className="text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100 cursor-pointer" />
            {newGoImage && <p className="text-[8px] text-emerald-500 font-mono mt-0.5">✓ Portada lista</p>}
          </div>
          <button type="submit" disabled={loadingForm || subiendoImagen} className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[9px] uppercase py-2 rounded-full tracking-widest transition shadow-sm mt-1">
            {loadingForm ? 'GUARDANDO...' : '➕ LANZAR GO'}
          </button>
        </form>

        {/* STEP 2: ARTÍCULOS CATÁLOGO */}
        <form onSubmit={handleCrearProducto} className="bg-white border border-pink-100 rounded-3xl p-5 space-y-2.5 shadow-xs">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-pink-500 border-b border-pink-50 pb-1 font-mono">✿ STEP 2: AGREGAR ARTÍCULOS</h2>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Seleccionar Destino</label>
            <select value={selectedGoId || ''} onChange={e => setSelectedGoId(Number(e.target.value))} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none w-full">
              {gosAdmin.map(g => (
                <option key={g.id} value={g.id}>[{g.group_name.toUpperCase()}] - {g.title.toLowerCase()}</option>
              ))}
            </select>
            {selectedGoId && (
              <button type="button" onClick={() => handleEliminarGO(selectedGoId)} className="text-[8px] text-rose-500 underline font-mono tracking-wider text-right hover:text-rose-700 block w-full mt-0.5">
                🗑️ Eliminar másterlist completa
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase text-zinc-400">Ítem</label>
              <input type="text" placeholder="PHOTOCARD" value={newProdName} onChange={e => setNewProdName(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none" />
            </div>
            <div className="w-20 flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase text-zinc-400">Precio</label>
              <input type="number" step="0.01" placeholder="12.50" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Slots (Separados por comas)</label>
            <input type="text" placeholder="Chan, Felix (O 'Random')" value={newProdSlots} onChange={e => setNewProdSlots(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Foto del Ítem</label>
            <input type="file" accept="image/*" onChange={e => uploadImageHandler(e, 'prod')} className="text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100 cursor-pointer" />
            {newProdImage && <p className="text-[8px] text-emerald-500 font-mono mt-0.5">✓ Foto ítem enlazada</p>}
          </div>
          <button type="submit" disabled={loadingForm || subiendoImagen} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-[9px] uppercase py-2 rounded-full tracking-widest transition shadow-sm mt-1">
            {loadingForm ? 'AÑADIENDO...' : '📦 PUBLICAR PRODUCTO'}
          </button>
        </form>

        {/* STEP 3: STOCK FÍSICO SHOP CON CARGA DE IMAGEN DETECTABLE */}
        <form onSubmit={handleCrearItemShop} className="bg-white border border-pink-100 rounded-3xl p-5 space-y-2.5 shadow-xs">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-pink-500 border-b border-pink-50 pb-1 font-mono">✿ STEP 3: CONTROL STOCK FÍSICO (SHOP)</h2>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Nombre de la Mercancía en Stock</label>
            <input type="text" placeholder="Ej: STRAY KIDS GREETINGS" value={newShopName} onChange={e => setNewShopName(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Precio del Producto (USD)</label>
            <input type="number" step="0.01" placeholder="Ej: 55.00" value={newShopPrice} onChange={e => setNewShopPrice(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Estado de Disponibilidad</label>
            <select value={newShopStatus} onChange={e => setNewShopStatus(e.target.value)} className="border border-zinc-100 rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 focus:outline-none w-full">
              <option value="INSTOCK">📦 PRODUCTO EN STOCK (DISPONIBLE)</option>
              <option value="SOLD OUT">✕ SOLD OUT (AGOTADO)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-bold uppercase text-zinc-400">Foto del Producto Stock</label>
            <input type="file" accept="image/*" onChange={e => uploadImageHandler(e, 'shop')} className="text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100 cursor-pointer" />
            {newShopImage && <p className="text-[8px] text-emerald-500 font-mono mt-0.5">✓ Foto Shop enlazada</p>}
          </div>
          <button type="submit" disabled={loadingForm || subiendoImagen} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase py-2 rounded-full tracking-widest transition shadow-sm mt-1">
            {loadingForm ? 'SUBIENDO...' : '🛍️ SUBIR DIRECTO A LA SHOP'}
          </button>
        </form>

      </div>
      {/* PANEL DE CONTROL DE PRODUCTOS */}
      <div className="w-full max-w-4xl bg-white border border-pink-100 rounded-3xl p-6 mt-6 shadow-xs space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-purple-600 border-b border-pink-50 pb-1 font-mono">🛠️ CONTROL Y BORRADO RÁPIDO DE PRODUCTOS</h2>
        {productosAdmin.length === 0 ? (
          <p className="text-xs font-mono text-zinc-400 py-2">No hay ningún artículo registrado en el catálogo para borrar 🍰</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {productosAdmin.map((prod) => {
              const padre = gosAdmin.find(g => g.id === prod.go_id);
              return (
                <div key={prod.id} className="flex justify-between items-center p-3 border border-zinc-100 rounded-2xl bg-zinc-50/50">
                  <div className="truncate pr-2">
                    <p className="text-[12px] font-bold text-zinc-800 uppercase truncate">{prod.nombre_producto}</p>
                    <p className="text-[9px] font-mono text-zinc-400 truncate">GO: {padre ? padre.title.toLowerCase() : 'Desconocido'} | \${prod.precio}</p>
                  </div>
                  <button type="button" onClick={() => handleEliminarProducto(prod.id)} className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition-all shrink-0">Borrar</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Control de Joiners */}
      <div className="w-full max-w-4xl space-y-6 mt-8">
        <div className="bg-white border border-pink-100 rounded-3xl p-5 text-center">
          <h1 className="text-xl font-black tracking-tight text-zinc-700 lowercase">panel control de joiners<span className="text-pink-400 font-serif">✿</span></h1>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase tracking-wider font-bold">Resumen total unificado por cliente (GOs + Shop)</p>
        </div>

        {listaJoiners.length === 0 ? (
          <div className="bg-white border border-pink-100 rounded-3xl p-12 text-center text-zinc-400 text-xs font-mono">No tienes ningún pedido registrado todavía 🍰</div>
        ) : (
          listaJoiners.map((joiner) => (
            <div key={joiner.correo} className="bg-white border border-pink-100 rounded-3xl overflow-hidden p-6 space-y-4 shadow-2xs">
              <div className="flex justify-between items-center border-b border-pink-50 pb-3 flex-wrap gap-2">
                <span className="text-[9px] bg-purple-600 text-white font-mono px-3 py-1 rounded-full font-bold uppercase">👤 JOINER ACTIVO</span>
                <span className="text-xs font-mono font-bold text-zinc-600 break-all">{joiner.correo}</span>
              </div>
              
              <div className="space-y-3 pt-2">
                {joiner.articulos.map((item) => (
                  <div key={item.idUnico} className="flex justify-between items-center border-b border-zinc-50 pb-2.5 last:border-0 last:pb-0 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-zinc-950 text-white">
                          {item.tipo}
                        </span>
                        <h4 className="text-[13px] font-bold text-zinc-800 lowercase">{item.nombreItem}</h4>
                      </div>
                      <p className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wide mt-0.5">{item.subTexto}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-black text-zinc-700">\${item.precio.toFixed(2)}</span>
                      <p className="text-[8px] font-mono text-zinc-400">Límite: {item.limite}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-zinc-950 text-white rounded-2xl p-4 flex justify-between items-center mt-2">
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
