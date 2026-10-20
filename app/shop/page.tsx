'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Conexión a tu Supabase

// 🏷️ PRECIOS DE ENVÍO CONFIGURABLES
const PRECIOS_ENVIO = {
  quito: 3.50,
  provincia: 6.50,
  peru: 0.00
};

interface Producto {
  id: number;
  nombre: string;
  precio: string; // Ejemplo de Supabase: "$15.00" o "15"
  tag: string;
  imagen: string;
  grupo: string;
  integrante: string;
  stock: number; 
}

export default function Leftovers() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [productos, setProductos] = useState<Producto[]>([]);
  const [grupoFiltro, setGrupoFiltro] = useState<string>('todos');
  const [selectedProd, setSelectedProd] = useState<Producto | null>(null);
  
  // 🛒 Carrito y datos de entrega extendidos
  const [formData, setFormData] = useState({ 
    name: '', 
    social: '', 
    qty: 1, 
    address: '', 
    shippingOption: 'quito' 
  });
  
  const [orderStep, setOrderStep] = useState<'browse' | 'checkout' | 'auth_required' | 'success'>('browse');

  // 🔑 SESIÓN EN TIEMPO REAL VIA SUPABASE
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  // 📡 CONEXIÓN A TU TABLA DE PRODUCTOS
  useEffect(() => {
    async function descargarProductos() {
      const { data } = await supabase
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

      if (data) {
        setProductos(data);
      }
    }
    descargarProductos();
  }, []);

  const handleOpenOrder = (prod: Producto) => {
    setSelectedProd(prod);
    setFormData({ name: '', social: '', qty: 1, address: '', shippingOption: 'quito' }); 
    if (!isLoggedIn) {
      setOrderStep('auth_required');
    } else {
      setOrderStep('checkout');
    }
  };

  // 🧮 LÓGICA MATEMÁTICA DE PRECIOS AUTOMÁTICA
  const obtenerPrecioNumerico = (precioStr: string): number => {
    const numero = parseFloat(precioStr.replace(/[^0-9.]/g, ''));
    return isNaN(numero) ? 0 : numero;
  };

  const precioProducto = selectedProd ? obtenerPrecioNumerico(selectedProd.precio) : 0;
  const costoEnvio = PRECIOS_ENVIO[formData.shippingOption as keyof typeof PRECIOS_ENVIO] || 0;
  const subtotal = precioProducto * formData.qty;
  const totalPagar = subtotal + costoEnvio;
  const handleWhatsAppRedirect = async () => {
    if (!selectedProd) return;
    
    if (selectedProd.stock <= 0) {
      alert("Lo sentimos, este producto se encuentra agotado.");
      return;
    }

    if (!formData.name || !formData.social || !formData.address) {
      alert("Por favor, completa todos los campos obligatorios del formulario.");
      return;
    }

    try {
      // 🔑 1. OBTENER EL EMAIL DEL USUARIO LOGUEADO
      const { data: { session } } = await supabase.auth.getSession();
      const emailUsuario = session?.user?.email || 'anonimo@shop.com';

      // 📡 2. REGISTRAR LA COMPRA EN LA TABLA 'pedidos' (Para tu panel admin)
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .insert([
          {
            user_email: emailUsuario,
            tipo_servicio: 'SHOP',
            detalles: `${selectedProd.nombre} (Cant: ${formData.qty})`,
            total_pagar: totalPagar,
            estado_pago: 'pendiente',
            fecha_limite: new Date().toISOString()
          }
        ]);

      if (pedidoError) throw pedidoError;

      // 📉 3. DESCONTAR EL STOCK EN LA TABLA 'productos'
      const nuevoStock = selectedProd.stock - formData.qty;
      const { error: stockError } = await supabase
        .from('productos')
        .update({ stock: nuevoStock >= 0 ? nuevoStock : 0 })
        .eq('id', selectedProd.id);

      if (stockError) throw stockError;

      // 📋 4. MENSAJE REDACTADO Y ORGANIZADO AUTOMÁTICAMENTE PARA WHATSAPP
      const mensaje = `¡Hola! Vengo de la web de hyunatelier ✿. Quiero confirmar mi pedido:\n\n` +
        `📦 DETALLES DEL PEDIDO:\n` +
        `- Producto: ${selectedProd.nombre}\n` +
        `- Cantidad: ${formData.qty} un.\n\n` +
        `👤 DATOS DE ENTREGA:\n` +
        `- Nombre: ${formData.name}\n` +
        `- Red Social: ${formData.social}\n` +
        `- Destino: ${formData.shippingOption.toUpperCase()}\n` +
        `- Dirección: ${formData.address}\n\n` +
        `💳 DESGLOSE DE PAGO:\n` +
        `- Subtotal: $${subtotal.toFixed(2)}\n` +
        `- Envío: $${costoEnvio.toFixed(2)}\n` +
        `- TOTAL A PAGAR: $${totalPagar.toFixed(2)}\n\n` +
        `✨ Ya realicé la transferencia, aquí adjunto mi comprobante de pago!`;
      
      const telefonoTienda = "593999530327";
      const url = `https://wa.me/${telefonoTienda}?text=${encodeURIComponent(mensaje)}`;      
      
      // 🚀 5. ABRIR WHATSAPP Y FINALIZAR
      window.open(url, '_blank');
      setOrderStep('success');

      // Actualizar el estado de la lista de productos localmente
      const { data: productosActualizados } = await supabase.from('productos').select('*').order('id', { ascending: false });
      if (productosActualizados) setProductos(productosActualizados);

    } catch (err: any) {
      console.error("Error al procesar la orden:", err);
      alert(`Ocurrió un problema al registrar tu pedido: ${err.message}`);
    }
  };

  // Filtrado de K-Pop inteligente
  const productosFiltrados = grupoFiltro === 'todos' 
    ? productos 
    : productos.filter(p => p.grupo?.toLowerCase() === grupoFiltro.toLowerCase());
    return (
      <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-700 w-full flex flex-col items-center antialiased pb-12 px-4">
        
        {/* 🧭 REGRESAR AL DESKTOP */}
        <div className="w-full max-w-xl pt-6 text-left">
          <Link href="/" className="text-[10px] font-bold text-pink-400 uppercase tracking-widest hover:text-pink-600 transition-colors">
            🗂️ ⏤ back to desktop
          </Link>
        </div>
  
        {/* 💳 TARJETA CONTENEDORA ESTILO GOS */}
        <div className="w-full max-w-xl bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-[0_15px_30px_rgba(255,182,193,0.12)] mt-4 p-6 space-y-6">
          
          {/* ENCABEZADO */}
          <div className="text-center space-y-1.5 border-b border-pink-50 pb-4">
            <h1 className="text-2xl font-black tracking-tight text-zinc-700 lowercase">
              atelier shop<span className="text-amber-400 font-serif">✿</span>
            </h1>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
              tu carrito de compras físico conectado en tiempo real.
            </p>
          </div>
  
          {/* 🔘 FILTROS DE BÚSQUEDA */}
          {orderStep === 'browse' && (
            <div className="flex flex-wrap justify-center gap-1.5 pb-2">
              {['todos', 'stray kids', 'enhypen', 'otros'].map((grupo) => (
                <button
                  key={grupo}
                  onClick={() => setGrupoFiltro(grupo)}
                  className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                    grupoFiltro === grupo
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'bg-zinc-50 text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {grupo}
                </button>
              ))}
            </div>
          )}
  
          {/* 📦 GRILLA DE PRODUCTOS */}
          {orderStep === 'browse' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {productosFiltrados.map((prod) => (
                <div 
                  key={prod.id} 
                  className="bg-white border border-zinc-100 rounded-2xl p-2.5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group relative"
                >
                  {/* Contenedor de la Imagen */}
                  <div className="w-full aspect-square bg-zinc-50 rounded-xl overflow-hidden relative border border-zinc-100">
                    <img src={prod.imagen} alt={prod.nombre} loading="lazy" className={`w-full h-full object-cover ${prod.stock <= 0 ? 'opacity-30 grayscale' : ''}`} />
                    
                    <span className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-xs text-[7px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded-full text-zinc-500 border border-zinc-100">
                      {prod.tag}
                    </span>
  
                    {/* Etiqueta Sold Out */}
                    {prod.stock <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 select-none pointer-events-none">
                        <span className="bg-zinc-800 text-white font-mono text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-xs">
                          sold out
                        </span>
                      </div>
                    )}
                  </div>
  
                  {/* Info del Producto */}
                  <div className="mt-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      {prod.integrante && prod.integrante.toLowerCase() !== 'grupal' && (
                        <span className="text-[8px] font-mono font-bold uppercase text-pink-400 tracking-wider block">
                          ✦ {prod.integrante}
                        </span>
                      )}
                      <h3 className="text-[11px] font-bold text-zinc-600 lowercase line-clamp-1">{prod.nombre}</h3>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs font-black text-zinc-800">{prod.precio}</span>
                      <button 
                        onClick={() => handleOpenOrder(prod)}
                        className="bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full hover:bg-pink-400 transition-all cursor-pointer"
                      >
                        Pedir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        {/* 📝 FORMULARIO DE CHECKOUT */}
        {orderStep === 'checkout' && selectedProd && (
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">📋 Formulario de Pedido</h2>
            <div className="p-3 bg-zinc-50 rounded-2xl flex gap-3 items-center border border-zinc-100">
              <img src={selectedProd.imagen} className="w-12 h-12 object-cover rounded-xl border border-zinc-200" />
              <div>
                <h4 className="text-xs font-bold text-zinc-700">{selectedProd.nombre}</h4>
                <p className="text-[10px] text-zinc-400 font-mono">Precio Unitario: {selectedProd.precio} | Stock: {selectedProd.stock} un.</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div>
                <label className="block text-zinc-400 mb-1 uppercase font-bold text-[9px]">Nombre Completo *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-xl p-2 focus:outline-none focus:border-pink-300 font-sans" placeholder="Ej. Lia Hwang" />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 uppercase font-bold text-[9px]">Instagram / Twitter *</label>
                <input type="text" value={formData.social} onChange={(e) => setFormData({...formData, social: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-xl p-2 focus:outline-none focus:border-pink-300 font-sans" placeholder="Ej. @lia_hwang" />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 uppercase font-bold text-[9px]">Cantidad *</label>
                <input type="number" min="1" max={selectedProd.stock} value={formData.qty} onChange={(e) => setFormData({...formData, qty: Math.min(selectedProd.stock, Math.max(1, parseInt(e.target.value) || 1))})} className="w-full bg-white border border-zinc-200 rounded-xl p-2 focus:outline-none focus:border-pink-300" />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 uppercase font-bold text-[9px]">Método de Envío *</label>
                <select value={formData.shippingOption} onChange={(e) => setFormData({...formData, shippingOption: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-xl p-2 focus:outline-none focus:border-pink-300 appearance-none">
                  <option value="quito">Quito (Servientrega / Laarcourier) - $3.50</option>
                  <option value="provincia">Provincia (Servientrega) - $6.50</option>
                  <option value="peru">Envío Especial Internacional (Perú) - $0.00</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 uppercase font-bold text-[9px]">Dirección de Entrega Completa *</label>
                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-xl p-2 focus:outline-none focus:border-pink-300 font-sans h-16" placeholder="Calle principal, numeración, calle secundaria y referencia..." />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-3 space-y-1.5 font-mono text-[10px] text-zinc-500">
              <div className="flex justify-between"><span>Subtotal ({formData.qty} un.):</span><span className="font-bold text-zinc-700">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Costo de Envío:</span><span className="font-bold text-zinc-700">${costoEnvio.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs font-black text-pink-500 pt-1 border-t border-dashed border-zinc-100">
                <span>TOTAL A PAGAR:</span><span>${totalPagar.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setOrderStep('browse')} className="flex-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-full hover:bg-zinc-200 transition-all cursor-pointer">Volver</button>
              <button onClick={handleWhatsAppRedirect} className="flex-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-full hover:bg-pink-400 transition-all cursor-pointer">Confirmar pedido ➔</button>
            </div>
          </div>
        )}

        {/* 🔒 INICIAR SESIÓN REQUERIDO */}
        {orderStep === 'auth_required' && (
          <div className="text-center py-8 space-y-4">
            <div className="text-3xl">🔑</div>
            <h3 className="text-sm font-bold text-zinc-700">Inicio de Sesión Requerido</h3>
            <p className="text-[11px] text-zinc-400 font-mono max-w-xs mx-auto">Para poder registrar el stock de tu compra en tu escritorio, necesitas estar conectado a tu cuenta.</p>
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setOrderStep('browse')} className="px-4 py-2 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-zinc-200 transition-all">Regresar</button>
              <Link href="/login" className="px-4 py-2 bg-pink-400 text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-pink-500 transition-all">Iniciar Sesión</Link>
            </div>
          </div>
        )}

        {/* 🎉 PEDIDO EXITOSO */}
        {orderStep === 'success' && (
          <div className="text-center py-12 space-y-4">
            <div className="text-4xl animate-bounce">🎀</div>
            <h2 className="text-lg font-black text-zinc-700 lowercase">¡pedido enviado con éxito!</h2>
            <p className="text-[11px] text-zinc-400 font-mono max-w-xs mx-auto">Tu orden ya se guardó en tu cuenta y te redirigimos a WhatsApp para coordinar el pago. ¡Gracias por comprar en Atelier de Hyun! ✿</p>
            <button onClick={() => setOrderStep('browse')} className="mt-4 px-5 py-2 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-pink-400 transition-all cursor-pointer">Ver más productos</button>
          </div>
        )}

      </div>
    </div>
  );
}
  