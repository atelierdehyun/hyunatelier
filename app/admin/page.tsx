'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

type Go = { id: number; title: string; group_name: string }
type ArticuloAgrupado = { idUnico: string; tipo: 'GO' | 'SHOP'; nombreItem: string; subTexto: string; precio: number; limite: string; }
type ResumenJoiner = { correo: string; articulos: ArticuloAgrupado[]; totalAcumulado: number; }
type ProductoAdmin = { id: number; nombre_producto: string; precio: number; go_id: number; cantidad_disponible: number; descripcion: string | null; lista_slots?: string | null; stock_slots?: { [key: string]: number } | null; isShop?: boolean; estado_pago?: string; due_date?: string; }

export default function AdminPanelPremium() {
  const [pestanaAdmin, setPestanaAdmin] = useState<'lanzar' | 'items' | 'joiners' | 'stock'>('lanzar')
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingForm, setLoadingForm] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  
  const [listaJoiners, setListaJoiners] = useState<ResumenJoiner[]>([])
  const [gosAdmin, setGosAdmin] = useState<Go[]>([])
  const [productosAdmin, setProductosAdmin] = useState<ProductoAdmin[]>([])
  const [productosTiendaAdmin, setProductosTiendaAdmin] = useState<ProductoAdmin[]>([])
  const [inputsStock, setInputsStock] = useState<{ [prodId: number]: { [slot: string]: string } }>({})
  const [idProductoStockSelected, setIdProductoStockSelected] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const correoAdmin = 'liahwang1852@gmail.com'

  const [newGoTitle, setNewGoTitle] = useState('')
  const [newGoGroup, setNewGoGroup] = useState('stray kids')
  const [newGoStatus, setNewGoStatus] = useState('OPEN')
  const [newGoImage, setNewGoImage] = useState('')
  const [selectedGoId, setSelectedGoId] = useState<number | null>(null)
  const [newProdName, setNewProdName] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [newProdSlots, setNewProdSlots] = useState('')
  const [newProdImage, setNewProdImage] = useState('')
  const [newProdQty, setNewProdQty] = useState('1')
  const [newProdDesc, setNewProdDesc] = useState('')
  const [newShopName, setNewShopName] = useState('')
  const [newShopPrice, setNewShopPrice] = useState('')
  const [newShopStatus, setNewShopStatus] = useState('INSTOCK')
  const [newShopImage, setNewShopImage] = useState('')
  const [newShopGroup, setNewShopGroup] = useState('stray kids')
  const [newShopQty, setNewShopQty] = useState('1')
  const [newShopDesc, setNewShopDesc] = useState('')

  const [editandoProducto, setEditandoProducto] = useState<ProductoAdmin | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editQty, setEditQty] = useState('')
  const [editDesc, setEditDesc] = useState('')
  async function uploadImageHandler(e: React.ChangeEvent<HTMLInputElement>, targetForm: 'go' | 'prod' | 'shop') {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoImagen(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const { error } = await supabase.storage.from('fotos-productos').upload(fileName, file)
    if (error) { alert('Error: ' + error.message); setSubiendoImagen(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('fotos-productos').getPublicUrl(fileName)
    if (targetForm === 'go') setNewGoImage(publicUrl)
    else if (targetForm === 'prod') setNewProdImage(publicUrl)
    else setNewShopImage(publicUrl)
    setSubiendoImagen(false)
    alert('¡Imagen cargada correctamente! 📸✨')
  }

  async function cargarDatosHibridos() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email && user.email === correoAdmin) {
        setUsuarioEmail(user.email)
        const mapeoClientes: { [key: string]: ArticuloAgrupado[] } = {}

        const { data: dataGos } = await supabase.from('gos').select('*')
        if (dataGos) {
          setGosAdmin(dataGos.map(g => ({ id: g.id, title: g.title, group_name: g.group_name })))
          if (dataGos.length > 0 && !selectedGoId) setSelectedGoId(dataGos[0].id)
        }

        const { data: dataAllProds } = await supabase.from('productos').select('id, nombre_producto, precio, go_id, cantidad_disponible, descripcion, lista_slots, stock_slots, claims_integrantes, gos(title)')
        if (dataAllProds) {
          setProductosAdmin(dataAllProds)
          const estructura: typeof inputsStock = {}
          dataAllProds.forEach(p => {
            estructura[p.id] = {}
            const slots = p.lista_slots ? p.lista_slots.split(',').map(s => s.trim()) : []
            slots.forEach(s => { estructura[p.id][s] = String(p.stock_slots?.[s] ?? 0) })
            
            const claims = p.claims_integrantes || {}
            Object.keys(claims).forEach(integrante => {
              const dataClaim = claims[integrante]
              if (!dataClaim) return
              if (typeof dataClaim === 'string') {
                const correoCliente = dataClaim
                if (!mapeoClientes[correoCliente]) mapeoClientes[correoCliente] = []
                mapeoClientes[correoCliente].push({
                  idUnico: `go-old-${p.id}-${integrante}`, tipo: 'GO', nombreItem: (p.gos as any)?.title || 'Orden Grupal',
                  subTexto: `COMPONENTE: ${integrante.toUpperCase()} (1 und)`, precio: p.precio || 12.50, limite: 'Ver Masterlist'
                })
              } else if (typeof dataClaim === 'object') {
                Object.entries(dataClaim).forEach(([correoCliente, cantidad]) => {
                  if (!correoCliente || !cantidad) return
                  if (!mapeoClientes[correoCliente]) mapeoClientes[correoCliente] = []
                  mapeoClientes[correoCliente].push({
                    idUnico: `go-new-${p.id}-${integrante}-${correoCliente}`, tipo: 'GO', nombreItem: (p.gos as any)?.title || 'Orden Grupal',
                    subTexto: `COMPONENTE: ${integrante.toUpperCase()} (${cantidad} und)`, precio: (p.precio || 12.50) * Number(cantidad), limite: 'Ver Masterlist'
                  })
                })
              }
            })
          })
          setInputsStock(estructura)
        }

        const { data: dataTiendaProds } = await supabase.from('tienda_productos').select('*')
        if (dataTiendaProds) {
          setProductosTiendaAdmin(dataTiendaProds.map(p => ({
            id: p.id, nombre_producto: p.nombre_producto, precio: p.precio, go_id: 0,
            cantidad_disponible: p.cantidad_disponible, descripcion: p.descripcion,
            estado_pago: p.estado_pago, due_date: p.due_date, isShop: true
          })))
        }

        const { data: dataPedidos } = await supabase.from('pedidos').select('*')
        if (dataPedidos) {
          dataPedidos.forEach(ped => {
            const mail = ped.user_email
            if (mail && mail !== 'STOCK_TIENDA_FISICA') {
              if (!mapeoClientes[mail]) mapeoClientes[mail] = []
              mapeoClientes[mail].push({
                idUnico: `shop-${ped.id}`, tipo: 'SHOP', nombreItem: ped.producto_nombre || 'Artículo Shop',
                subTexto: `ESTADO: ${ped.estado_pago || 'PENDIENTE'} 📦`, precio: ped.total_pagar || 0, limite: 'Inmediato'
              })
            }
          })
        }

        setListaJoiners(Object.keys(mapeoClientes).map(correo => ({
          correo, articulos: mapeoClientes[correo], totalAcumulado: mapeoClientes[correo].reduce((s, i) => s + i.precio, 0)
        })))
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { cargarDatosHibridos() }, [])
  const handleEditInputLocal = (prodId: number, slot: string, valor: string) => {
    setInputsStock(prev => ({ ...prev, [prodId]: { ...(prev[prodId] || {}), [slot]: valor } }))
  }

  async function handleGuardarStockBD(prodId: number) {
    const inputsProd = inputsStock[prodId] || {}
    const jsonNuevo: { [key: string]: number } = {}
    Object.entries(inputsProd).forEach(([slot, val]) => { jsonNuevo[slot] = Math.max(0, parseInt(val) || 0) })
    const { error } = await supabase.from('productos').update({ stock_slots: jsonNuevo }).eq('id', prodId)
    if (!error) { alert('¡Inventario guardado con éxito! ✨'); cargarDatosHibridos(); }
    else alert('Error: ' + error.message)
  }

  async function handleCreateGO(e: React.FormEvent) {
    e.preventDefault(); if (!newGoTitle) return alert('Pon el título 🎀')
    setLoadingForm(true)
    const { error } = await supabase.from('gos').insert([{ title: newGoTitle.toUpperCase(), group_name: newGoGroup.toLowerCase(), status: newGoStatus, imagen_general: newGoImage || null }])
    setLoadingForm(false)
    if (!error) { alert('¡GO global creado con éxito! ✨'); setNewGoTitle(''); cargarDatosHibridos(); }
  }

  async function handleCrearProducto(e: React.FormEvent) {
    e.preventDefault(); if (!selectedGoId || !newProdName || !newProdPrice || !newProdSlots) return alert('Completa todos los datos 🧸')
    setLoadingForm(true)
    const slotsArr = newProdSlots.split(',').map(s => s.trim())
    const jsonStockInicial: { [key: string]: number } = {}
    slotsArr.forEach(s => { jsonStockInicial[s] = Number(newProdQty) })

    const { error } = await supabase.from('productos').insert([{ 
      go_id: selectedGoId, nombre_producto: newProdName.toUpperCase(), precio: Number(newProdPrice), 
      lista_slots: newProdSlots, imagen_producto: newProdImage || null, claims_integrantes: {},
      cantidad_disponible: Number(newProdQty), stock_slots: jsonStockInicial, descripcion: newProdDesc || null
    }])
    setLoadingForm(false)
    if (!error) { alert('¡Artículo publicado! 📦'); setNewProdName(''); setNewProdPrice(''); setNewProdSlots(''); setNewProdDesc(''); cargarDatosHibridos(); }
  }

  async function handleCrearItemShop(e: React.FormEvent) {
    e.preventDefault(); if (!newShopName || !newShopPrice) return alert('Llena los datos')
    setLoadingForm(true)
    const { error } = await supabase.from('tienda_productos').insert([{ 
      nombre_producto: newShopName.toUpperCase(), precio: Number(newShopPrice), cantidad_disponible: Number(newShopQty), 
      descripcion: newShopDesc || null, estado_pago: newShopStatus, due_date: newShopGroup, imagen_producto: newShopImage || null 
    }])
    setLoadingForm(false)
    if (!error) { alert('¡Añadido correctamente a la Shop! 🛍️✨'); setNewShopName(''); setNewShopPrice(''); setNewShopDesc(''); setNewShopImage(''); cargarDatosHibridos(); }
    else alert('Error: ' + error.message)
  }

  async function handleEliminarGO(idGo: number) {
    if (!confirm('⚠️ ¿Borrar másterlist entera?')) return
    const { error } = await supabase.from('gos').delete().eq('id', idGo)
    if (!error) { setSelectedGoId(null); cargarDatosHibridos(); }
  }

  async function handleEliminarProducto(idProd: number, isShop?: boolean) {
    if (!confirm('¿Borrar este ítem de forma permanente?')) return
    const targetTable = isShop ? 'tienda_productos' : 'productos'
    const { error } = await supabase.from(targetTable).delete().eq('id', idProd)
    if (!error) cargarDatosHibridos()
  }

  const iniciarEdicion = (p: ProductoAdmin) => { setEditandoProducto(p); setEditName(p.nombre_producto); setEditPrice(String(p.precio)); setEditQty(String(p.cantidad_disponible)); setEditDesc(p.descripcion || ''); }
  
  async function handleGuardarEdicion(e: React.FormEvent) {
    e.preventDefault(); if (!editandoProducto) return;
    setLoadingForm(true)
    const targetTable = editandoProducto.isShop ? 'tienda_productos' : 'productos'
    const { error } = await supabase.from(targetTable).update({ nombre_producto: editName.toUpperCase(), precio: Number(editPrice), cantidad_disponible: Number(editQty), descripcion: editDesc || null }).eq('id', editandoProducto.id)
    setLoadingForm(false); setEditandoProducto(null); cargarDatosHibridos();
  }
  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs text-zinc-400">✧ cargando_herramientas_admin.sys ...</div>
  if (usuarioEmail !== correoAdmin) {
    return (
      <div className="min-h-screen bg-[#FFF0F4] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <p className="text-sm font-bold text-rose-500 bg-white border border-rose-100 px-6 py-3 rounded-full shadow-sm">✕ Acceso denegado. Panel exclusivo de Atelier de Hyun 🎀</p>
        <Link href="/gos" className="text-xs font-mono uppercase tracking-widest text-zinc-400 underline">Volver a la Masterlist ➔</Link>
      </div>
    )
  }

  const todosLosProductosAdmin = [...productosAdmin, ...productosTiendaAdmin]

  return (
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-700 w-full flex flex-col items-center antialiased pb-12 p-4">
      <div className="w-full max-w-4xl pt-6 flex justify-between items-center border-b pb-3">
        <Link href="/gos" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-pink-600">🗂️ ⏤ volver a la masterlist</Link>
        <span className="text-[9px] bg-purple-600 text-white font-mono px-3 py-1 rounded-full uppercase font-bold">👑 CONTROL ATELIER</span>
      </div>

      <div className="w-full max-w-4xl mt-4 flex gap-1 bg-white p-1 rounded-xl border border-pink-100 shadow-2xs">
        <button type="button" onClick={() => setPestanaAdmin('lanzar')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${pestanaAdmin === 'lanzar' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-500'}`}>📁 Registrar GO / Shop</button>
        <button type="button" onClick={() => setPestanaAdmin('items')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${pestanaAdmin === 'items' ? 'bg-purple-600 text-white shadow-xs' : 'text-zinc-500'}`}>🛠️ Control Ítems</button>
        <button type="button" onClick={() => setPestanaAdmin('joiners')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${pestanaAdmin === 'joiners' ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-500'}`}>👤 Saldos Joiners</button>
        <button type="button" onClick={() => setPestanaAdmin('stock')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${pestanaAdmin === 'stock' ? 'bg-rose-500 text-white shadow-xs' : 'text-zinc-500'}`}>📦 Gestor Stock</button>
      </div>

      <div className="w-full max-w-4xl mt-4">
      {pestanaAdmin === 'lanzar' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start animate-fade">
            <form onSubmit={handleCreateGO} className="bg-white border rounded-3xl p-5 space-y-2.5">
              <h2 className="text-[10px] font-black uppercase text-pink-500 border-b pb-1 font-mono">✿ STEP 1: REGISTRAR GO GLOBAL</h2>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Título del GO</label><input type="text" placeholder="STRAY KIDS" value={newGoTitle} onChange={e => setNewGoTitle(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50" /></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Banda / Grupo</label><input type="text" placeholder="stray kids" value={newGoGroup} onChange={e => setNewGoGroup(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50" /></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Portada Catálogo</label><input type="file" accept="image/*" onChange={e => uploadImageHandler(e, 'go')} className="text-[10px] text-zinc-500" /></div>
              <button type="submit" disabled={loadingForm || subiendoImagen} className="w-full bg-zinc-950 text-white font-black text-[9px] uppercase py-2 rounded-full tracking-widest mt-1">➕ LANZAR GO</button>
            </form>

            <form onSubmit={handleCrearProducto} className="bg-white border rounded-3xl p-5 space-y-2.5">
              <h2 className="text-[10px] font-black uppercase text-pink-500 border-b pb-1 font-mono">✿ STEP 2: AGREGAR ARTÍCULOS</h2>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Seleccionar Destino</label><select value={selectedGoId || ''} onChange={e => setSelectedGoId(Number(e.target.value))} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 w-full">{gosAdmin.map(g => (<option key={g.id} value={g.id}>[{g.group_name.toUpperCase()}] - {g.title.toLowerCase()}</option>))}</select>{selectedGoId && (<button type="button" onClick={() => handleEliminarGO(selectedGoId)} className="text-[8px] text-rose-500 underline text-right mt-0.5 block w-full">🗑️ Eliminar másterlist</button>)}</div>
              <div className="flex gap-1.5"><div className="flex-1 flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Ítem</label><input type="text" placeholder="PC" value={newProdName} onChange={e => setNewProdName(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50" /></div><div className="w-20 flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Precio</label><input type="number" step="0.01" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50" /></div></div>
              <div className="flex gap-1.5"><div className="flex-1 flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Slots / Integrantes</label><input type="text" placeholder="Chan, Felix" value={newProdSlots} onChange={e => setNewProdSlots(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50" /></div><div className="w-20 flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Stock Qty</label><input type="number" min="1" value={newProdQty} onChange={e => setNewProdQty(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 text-center font-bold" /></div></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Descripción</label><input type="text" placeholder="Preventa" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} className="border rounded-xl px-3 py-1 text-xs bg-zinc-50/50" /></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Foto</label><input type="file" accept="image/*" onChange={e => uploadImageHandler(e, 'prod')} className="text-[10px]" /></div>
              <button type="submit" disabled={loadingForm || subiendoImagen} className="w-full bg-purple-600 text-white font-black text-[9px] uppercase py-2 rounded-full mt-1">📦 PUBLICAR ARTÍCULO</button>
            </form>

            <form onSubmit={handleCrearItemShop} className="bg-white border rounded-3xl p-5 space-y-2.5">
              <h2 className="text-[10px] font-black uppercase text-pink-500 border-b pb-1 font-mono">✿ STEP 3: CONTROL STOCK (SHOP)</h2>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Categoría</label><select value={newShopGroup} onChange={e => setNewShopGroup(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 font-bold"><option value="stray kids">🌟 STRAY KIDS SHOP</option><option value="enhypen">🧬 ENHYPEN SHOP</option><option value="otros">🍰 OTROS SHOP</option></select></div>
              <div className="flex gap-1.5"><div className="flex-1 flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Mercancía</label><input type="text" placeholder="ALBUM" value={newShopName} onChange={e => setNewShopName(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50" /></div><div className="w-20 flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Qty</label><input type="number" min="0" value={newShopQty} onChange={e => setNewShopQty(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50 text-center font-bold text-amber-600" /></div></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Precio USD</label><input type="number" step="0.01" value={newShopPrice} onChange={e => setNewShopPrice(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50" /></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Detalles</label><input type="text" value={newShopDesc} onChange={e => setNewShopDesc(e.target.value)} className="border rounded-xl px-3 py-1 text-xs bg-zinc-50/50" /></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Estado</label><select value={newShopStatus} onChange={e => setNewShopStatus(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-zinc-50/50"><option value="INSTOCK">📦 IN STOCK</option><option value="SOLD OUT">✕ SOLD OUT</option></select></div>
              <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Foto</label><input type="file" accept="image/*" onChange={e => uploadImageHandler(e, 'shop')} className="text-[10px]" /></div>
              <button type="submit" disabled={loadingForm || subiendoImagen} className="w-full bg-amber-500 text-white font-black text-[9px] uppercase py-2 rounded-full mt-1">🛍️ SUBIR A LA SHOP</button>
            </form>
          </div>
        )}
        {pestanaAdmin === 'items' && (
          <div className="w-full bg-white border rounded-3xl p-6 space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-purple-600 border-b pb-1 font-mono">🛠️ CONTROL Y BORRADO RÁPIDO DE PRODUCTOS</h2>
            {todosLosProductosAdmin.length === 0 ? <p className="text-xs font-mono text-zinc-400 py-2">No hay artículos registrados 🍰</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {todosLosProductosAdmin.map((prod) => {
                  const padre = gosAdmin.find(g => g.id === prod.go_id);
                  return (
                    <div key={`${prod.isShop ? 'shop' : 'go'}-${prod.id}`} className="flex justify-between items-center p-3 border rounded-2xl bg-zinc-50/50 gap-2 text-xs">
                      <div className="truncate flex-1">
                        <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded mr-1.5 uppercase ${prod.isShop ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>{prod.isShop ? 'SHOP' : 'GO'}</span>
                        <p className="font-bold text-zinc-800 uppercase truncate inline">{prod.nombre_producto}</p>
                        <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">Origen: {prod.isShop ? (prod.due_date || 'Tienda') : (padre ? padre.title.toLowerCase() : 'Masterlist')} | ${prod.precio} | Cantidad: {prod.cantidad_disponible}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => iniciarEdicion(prod)} className="bg-zinc-100 border text-zinc-700 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-full">Editar</button>
                        <button type="button" onClick={() => handleEliminarProducto(prod.id, prod.isShop)} className="bg-rose-50 border text-rose-600 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-full">Borrar</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {pestanaAdmin === 'joiners' && (
          <div className="bg-white border rounded-3xl p-6 space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-purple-600 border-b pb-1 font-mono">👤 RESUMEN UNIFICADO DE JOINERS GLOBALES</h2>
            {listaJoiners.length === 0 ? <p className="text-xs font-mono text-zinc-400 text-center py-6">No hay reclamos registrados aún 🍰</p> : (
              <div className="space-y-3">
                {listaJoiners.map((j) => (
                  <div key={j.correo} className="border p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs bg-zinc-50/30">
                    <div>
                      <p className="font-mono font-bold text-purple-600 break-all">{j.correo}</p>
                      <div className="space-y-0.5 mt-1 text-[11px] text-zinc-500">
                        {j.articulos?.map((art) => <p key={art.idUnico}>• <span className="font-bold uppercase text-zinc-400">[{art.tipo}]</span> {art.nombreItem} ({art.subTexto}) — ${art.precio}</p>)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <p className="text-sm font-black text-pink-500">${j.totalAcumulado.toFixed(2)} USD</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {pestanaAdmin === 'stock' && (
          <div className="bg-white border rounded-3xl p-6 space-y-4 animate-fade">
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-wider text-purple-600 border-b pb-1 font-mono">📦 GESTOR DE STOCK INDIVIDUAL (SLOTS)</h2>
              <p className="text-[10px] text-zinc-400 mt-1 uppercase font-semibold">Selecciona un artículo para abrir y modificar el inventario de sus integrantes de inmediato</p>
            </div>
            <div className="flex flex-col gap-1.5 bg-zinc-50 p-3 rounded-xl border">
              <label className="text-[9px] font-bold uppercase text-zinc-400">Buscar / Seleccionar Producto del Catálogo</label>
              <select value={idProductoStockSelected || ''} onChange={(e) => setIdProductoStockSelected(Number(e.target.value) || null)} className="w-full border rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-purple-400 font-bold uppercase text-zinc-700">
                <option value="">⏤ SELECCIONAR UN ARTÍCULO PARA EDITAR INVENTARIO ⏤</option>
                {productosAdmin.map(p => (<option key={p.id} value={p.id}>📦 {p.nombre_producto.toLowerCase()}</option>))}
              </select>
            </div>
            {idProductoStockSelected && productosAdmin.find(p => p.id === idProductoStockSelected) ? (
              (() => {
                const prodFocus = productosAdmin.find(p => p.id === idProductoStockSelected)!;
                const slots = prodFocus.lista_slots ? prodFocus.lista_slots.split(',').map(s => s.trim()) : [];
                return (
                  <div className="space-y-4 pt-2 animate-fade">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {slots.length === 0 ? <p className="text-xs text-zinc-400 col-span-full text-center py-2">Este ítem no tiene slots configurados 🍰</p> :
                        slots.map(s => (
                          <div key={s} className="bg-white p-2 rounded-lg border flex flex-col gap-0.5 text-[11px] shadow-3xs">
                            <span className="font-bold uppercase text-zinc-400 truncate">{s}</span>
                            <input type="number" min="0" value={inputsStock[prodFocus.id]?.[s] || '0'} onChange={(e) => handleEditInputLocal(prodFocus.id, s, e.target.value)} className="w-full bg-zinc-50 border rounded px-1.5 py-0.5 font-bold font-mono text-zinc-800 text-center focus:outline-purple-400" />
                          </div>
                        ))
                      }
                    </div>
                    {slots.length > 0 && (<button type="button" onClick={() => handleGuardarStockBD(prodFocus.id)} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">💾 Guardar cambios de inventario para: {prodFocus.nombre_producto.toLowerCase()} ✨</button>)}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 bg-zinc-50/30 rounded-2xl border border-dashed border-zinc-200"><span className="text-xs text-zinc-400 font-mono">Elige un producto arriba para desplegar sus integrantes 🌸</span></div>
            )}
          </div>
        )}
      </div>

      {editandoProducto && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleGuardarEdicion} className="bg-white border rounded-3xl p-6 max-w-md w-full space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b pb-1"><h3 className="text-xs font-black uppercase font-mono text-purple-600">📝 EDITAR PRODUCTO</h3><button type="button" onClick={() => setEditandoProducto(null)} className="text-zinc-400 text-xs font-bold">✕ CERRAR</button></div>
            <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Nombre</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs font-bold" /></div>
            <div className="grid grid-cols-2 gap-3"><div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Precio</label><input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs" /></div><div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Stock</label><input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs text-center font-bold" /></div></div>
            <div className="flex flex-col gap-1"><label className="text-[8px] font-bold uppercase text-zinc-400">Descripción</label><textarea rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs resize-none" /></div>
            <button type="submit" disabled={loadingForm} className="w-full bg-purple-600 text-white font-black text-[10px] uppercase py-2.5 rounded-full mt-2">💾 GUARDAR CAMBIOS</button>
          </form>
        </div>
      )}

    </div>
  )
}
