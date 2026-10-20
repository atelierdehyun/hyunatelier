'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Link from 'next/link'

type Go = {
  id: number; title: string; status: string; group_name: string;
  lista_slots: string | null; imagen_general: string | null;
  claims_integrantes: { [key: string]: string } | null; due_date?: string;
}

export default function Masterlist() {
  const [pestanaActiva, setPestanaActiva] = useState<'masterlist' | 'mis_claims'>('masterlist')
  const [gos, setGos] = useState<Go[]>([])
  const [loading, setLoading] = useState(true)
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [message, setMessage] = useState('')
  const [goSeleccionado, setGoSeleccionado] = useState<number | null>(null)

  async function inicializarPagina() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) setUsuarioEmail(user.email)
    const { data } = await supabase.from('gos').select('*').order('id', { ascending: true })
    if (data) setGos(data)
    setLoading(false)
  }

  useEffect(() => { inicializarPagina() }, [])

  const slots = (t: string | null) => t ? t.split(',').map(s => s.trim()) : ['Slot 1']

  async function handleClaim(go: Go, integrante: string) {
    if (!usuarioEmail) return setMessage('Inicia sesión primero 🎀')
    const actuales = go.claims_integrantes || {}
    if (actuales[integrante]) return setMessage('Ya reclamado 😭')
    const limite = new Date(); limite.setDate(limite.getDate() + 2)
    const nuevos = { ...actuales, [integrante]: usuarioEmail }
    const { error } = await supabase.from('gos').update({ 
      claims_integrantes: nuevos, joiner_email: usuarioEmail, due_date: limite.toISOString()
    }).eq('id', go.id)
    if (!error) { alert('¡Claim exitoso! Tienes 48h para pagar.'); inicializarPagina() }
  }

  const misClaims = (() => {
    const list: any[] = []
    gos.forEach(g => Object.keys(g.claims_integrantes || {}).forEach(k => {
      if (g.claims_integrantes?.[k] === usuarioEmail) list.push({ title: g.title, int: k, date: g.due_date ? new Date(g.due_date).toLocaleDateString() : '⏳' })
    }))
    return list
  })()

  if (loading) return <div className="min-h-screen bg-[#FFF0F4] flex items-center justify-center font-mono text-xs">✧ loading_database.sys ...</div>
  return (
    <div className="min-h-screen bg-[#FFF0F4] font-sans text-zinc-900 w-full flex flex-col items-center pb-12">
      <div className="w-full max-w-2xl px-4 pt-6 flex justify-between items-center">
        <Link href="/" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">🗂️ ⏤ back to desktop</Link>
        <span className="text-[9px] bg-zinc-900 text-white font-mono px-3 py-1 rounded-full">👤 {usuarioEmail || 'Invitado'}</span>
      </div>

      <div className="w-full max-w-2xl bg-white border border-zinc-900 rounded-xl overflow-hidden mt-4 p-1 bg-zinc-50/50">
        <div className="bg-white border-b border-zinc-100 rounded-t-lg px-2 py-1.5 flex gap-1 text-[10px] font-mono">
          <button onClick={() => setPestanaActiva('masterlist')} className={`px-3 py-1 rounded-md font-bold ${pestanaActiva === 'masterlist' ? 'bg-[#FFF0F4] text-pink-500 border border-rose-100' : 'text-zinc-400'}`}>📂 masterlist.sys</button>
          <button onClick={() => setPestanaActiva('mis_claims')} className={`px-3 py-1 rounded-md font-bold ${pestanaActiva === 'mis_claims' ? 'bg-[#FFF0F4] text-pink-500 border border-rose-100' : 'text-zinc-400'}`}>🎀 mis_claims.sys ({misClaims.length})</button>
        </div>

        {pestanaActiva === 'masterlist' ? (
          <div className="bg-white p-6 space-y-6">
            <h1 className="text-3xl font-black tracking-tighter text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">masterlist.</h1>
            {message && <p className="text-[10px] font-bold text-center text-pink-500">{message}</p>}
            <div className="space-y-4">
              {gos.map(go => {
                const list = slots(go.lista_slots), abierto = goSeleccionado === go.id
                const ok = list.filter(i => go.claims_integrantes?.[i]).length
                return (
                  <div key={go.id} className="border border-zinc-100 rounded-2xl bg-white overflow-hidden">
                    <div onClick={() => setGoSeleccionado(abierto ? null : go.id)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-50">
                      <div>
                        <h3 className="font-bold text-sm text-zinc-800">{go.title}</h3>
                        <div className="flex gap-2 text-[9px] uppercase font-black tracking-wider pt-1">
                          <span className="bg-zinc-50 px-2 py-0.5 rounded border">{go.status}</span>
                          <span className="bg-[#FFF0F4] text-pink-400 px-2 py-0.5 rounded border border-rose-100">{go.group_name}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs font-bold text-zinc-700">{ok} / {list.length} claims</div>
                    </div>
                    {abierto && (
                      <div className="bg-[#FAF9FC]/60 border-t p-5 flex flex-col md:flex-row gap-6">
                        {go.imagen_general && (
                          <div className="w-full md:w-1/3 bg-white border border-zinc-200 p-2 rounded-2xl flex items-center justify-center overflow-hidden">
                            <img src={go.imagen_general} alt={go.title} className="w-full h-auto object-cover rounded-xl" />
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-2 gap-2 self-start">
                          {list.map(int => {
                            const dueño = go.claims_integrantes?.[int]
                            return (
                              <button key={int} disabled={!!dueño} onClick={() => handleClaim(go, int)} className={`flex justify-between items-center px-4 py-3 rounded-xl border text-xs font-bold ${dueño ? 'bg-zinc-100 text-zinc-400' : 'bg-white text-zinc-700 hover:border-zinc-900'}`}>
                                <span>{int.toLowerCase()}</span>
                                <span className="text-[9px] uppercase">{dueño ? 'ocupado' : 'libre ♡'}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 space-y-6">
            <h1 className="text-3xl font-black tracking-tighter text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">resumen de claims.</h1>
            {misClaims.length === 0 ? <p className="text-center text-xs text-zinc-400 py-6 font-mono">No has reservado ningún integrante todavía 🍰</p> : (
              <div className="space-y-6">
                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                  <div className="divide-y divide-zinc-100">
                    {misClaims.map((item, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center text-xs">
                        <div><p className="font-bold text-zinc-800">{item.title}</p><p className="text-[10px] text-pink-400 font-semibold uppercase">Componente: {item.int}</p></div>
                        <div className="text-right"><p className="font-mono font-bold text-zinc-700">$12.50</p><p className="text-[9px] text-rose-500 font-mono">Límite: {item.date}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-zinc-900 text-white p-4 flex justify-between items-center text-xs font-bold">
                    <span className="uppercase text-[10px]">Total a Pagar:</span>
                    <span className="font-mono text-sm">${(misClaims.length * 12.50).toFixed(2)} USD</span>
                  </div>
                </div>
                <div className="border border-purple-100 bg-purple-50/30 rounded-2xl p-5 text-xs text-zinc-600 font-medium space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-wider">💸 Información de Pago</h4>
                  <p>• <span className="font-bold text-zinc-800">Banco:</span> Tu Banco / Nequi / PayPal</p>
                  <p>• <span className="font-bold text-zinc-800">Cuenta:</span> 1234-5678-9012</p>
                  <p>• <span className="font-bold text-zinc-800">Titular:</span> Hyun Atelier Owner</p>
                </div>
                <div className="border border-rose-100 bg-rose-50/40 rounded-2xl p-4 text-[10px] text-rose-600 font-medium">
                  <p className="font-black uppercase text-rose-700">⚠️ Regulaciones:</p>
                  <p>• Plazo de 48 horas (2 días) para registrar tu comprobante una vez hecho el claim.</p>
                  <p>• Pasado el límite, se cobrará una mora de $0.50 ctvs por cada día de retraso.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
