import React, { useEffect, useState } from 'react'
import { UserPlus, Users, MailCheck, MailX, Trash2, Coins, CheckCircle2, Clock, Copy, Share2 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useFriends } from '../hooks/useFriends'

function FriendsView({ user, formatCurrency, showToast }) {
  const { friendRequests, sentRequests, friends, claims, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, createClaim, updateClaimStatus } = useFriends(user)
  const [inviteUid, setInviteUid] = useState('')
  const [claimData, setClaimData] = useState({ toUid: '', amount: '', description: '' })
  const [updatingClaimId, setUpdatingClaimId] = useState(null)

  // Helpers
  const normalizeUid = (value) => String(value || '').trim()
  const isLikelyUid = (value) => /^[A-Za-z0-9:_-]{6,128}$/.test(String(value || ''))

  // Detectar UID desde la URL (?invite=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const incoming = normalizeUid(params.get('invite') || params.get('uid') || params.get('friend'))
      if (incoming && isLikelyUid(incoming)) {
        setInviteUid(incoming)
        // Si hay usuario y no es el mismo UID, ofrecer auto-enviar
        if (user?.uid && user.uid !== incoming) {
          const shouldSend = window.confirm('Se ha detectado una invitación. ¿Quieres enviar solicitud a este ID ahora?')
          if (shouldSend) {
            ;(async () => {
              try {
                await sendFriendRequest(incoming)
                setInviteUid('')
                showToast && showToast('Solicitud enviada')
              } catch (e) {
                showToast && showToast('No se pudo enviar la solicitud', 'error')
              }
            })()
          } else {
            showToast && showToast('ID detectado. Puedes revisar y enviar manualmente.')
          }
        } else if (user?.uid === incoming) {
          showToast && showToast('Ese es tu propio ID. No puedes agregarte a ti mismo.', 'error')
        }
        // Limpiar query para evitar reintentos en navegación posterior
        if (window.history?.replaceState) {
          const url = new URL(window.location.href)
          url.searchParams.delete('invite')
          url.searchParams.delete('uid')
          url.searchParams.delete('friend')
          window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams.toString()}` : '') + url.hash)
        }
      }
    } catch {}
  }, [user?.uid])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Amigos</h1>
          <p className="text-slate-600 dark:text-gray-400">Añade amigos por su ID y gestiona solicitudes y reclamaciones</p>
        </div>
      </div>

      {/* Añadir amigo */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"/>
            Agregar amigo por ID
          </h3>
        </div>
        
        <div className="space-y-4">
          {/* Formulario para agregar amigo */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              value={inviteUid} 
              onChange={(e)=>setInviteUid(e.target.value)} 
              placeholder="UID del amigo" 
              className="input-field flex-1" 
            />
            <button 
              className="btn-primary whitespace-nowrap" 
              onClick={async ()=>{ 
                const uid = normalizeUid(inviteUid)
                if (!uid || !isLikelyUid(uid)) { showToast && showToast('UID inválido', 'error'); return }
                if (uid === user?.uid) { showToast && showToast('No puedes agregarte a ti mismo', 'error'); return }
                try {
                  await sendFriendRequest(uid)
                  setInviteUid('')
                  showToast && showToast('Solicitud enviada')
                } catch (e) {
                  showToast && showToast('No se pudo enviar la solicitud', 'error')
                }
              }}
              disabled={!normalizeUid(inviteUid)}
            >
              Enviar
            </button>
          </div>

          {/* Tu ID */}
          <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Tu ID:</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-600 text-sm flex-1 break-all">
                    {user?.uid}
                  </span>
                  <button
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Copiar ID"
                    onClick={async ()=>{ 
                      await navigator.clipboard.writeText(user?.uid || ''); 
                      showToast && showToast('ID copiado'); 
                    }}
                  >
                    <Copy className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                  </button>
                  <button
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Compartir"
                    onClick={async ()=>{
                      const link = `${window.location.origin}/?invite=${user?.uid}`
                      const text = `Agrega mi ID en SplitGo: ${user?.uid}\n${link}`
                      if (navigator.share) {
                        try { await navigator.share({ title: 'Mi ID de SplitGo', text, url: link }) } catch {}
                      } else {
                        await navigator.clipboard.writeText(text)
                        showToast && showToast('Texto copiado para compartir')
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center sm:items-end">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 self-start sm:self-center">Código QR:</label>
                <button
                  aria-label="Mostrar código QR"
                  className="rounded-lg border-2 border-slate-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md active:scale-[0.98] transition-all duration-200 bg-white dark:bg-gray-800 p-2"
                  title="Toca para ampliar"
                  onClick={()=>document.getElementById('qr-modal')?.showModal()}
                >
                  <QRCodeCanvas 
                    value={(typeof window !== 'undefined' && user?.uid) ? `${window.location.origin}/?invite=${user.uid}` : (user?.uid || '')} 
                    size={64} 
                    level="M" 
                    includeMargin={false} 
                    bgColor="#ffffff" 
                    fgColor="#111827" 
                  />
                </button>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-1 text-center">Toca para ampliar</span>
              </div>
            </div>
          </div>
        </div>

        <dialog id="qr-modal" className="rounded-2xl backdrop:bg-black/20 backdrop:backdrop-blur-sm">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm mx-auto">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4">Mi código QR</h3>
              <div className="bg-white dark:bg-gray-100 p-4 rounded-xl border border-slate-200 dark:border-gray-600 inline-block">
                <QRCodeCanvas 
                  value={(typeof window !== 'undefined' && user?.uid) ? `${window.location.origin}/?invite=${user.uid}` : (user?.uid || '')} 
                  size={200} 
                  level="H" 
                  includeMargin={true} 
                  bgColor="#ffffff" 
                  fgColor="#111827" 
                />
              </div>
              <div className="mt-4 text-sm text-slate-600 dark:text-gray-400">
                Comparte este código para que te añadan como amigo
              </div>
              <div className="mt-4 text-xs text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="font-mono break-all">{user?.uid}</div>
              </div>
              <div className="mt-6">
                <button 
                  className="btn-primary w-full" 
                  onClick={()=>document.getElementById('qr-modal')?.close()}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </dialog>
      </div>

      {/* Solicitudes entrantes */}
      {friendRequests.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-600"/>
            Solicitudes recibidas
            <span className="ml-2 bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full">
              {friendRequests.length}
            </span>
          </h3>
          <div className="space-y-3">
            {friendRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-gray-100">{r.fromName || r.fromUid}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono">{r.fromUid}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={()=>acceptFriendRequest(r.id, r.fromUid)} 
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    title="Aceptar"
                  >
                    <MailCheck className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={()=>rejectFriendRequest(r.id, r.fromUid)} 
                    className="px-3 py-2 bg-slate-300 dark:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-lg hover:bg-slate-400 dark:hover:bg-gray-500 transition-colors"
                    title="Rechazar"
                  >
                    <MailX className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amigos */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-indigo-600"/>
          Tus amigos
          {friends.length > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
              {friends.length}
            </span>
          )}
        </h3>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4"/>
            <p className="text-slate-600 dark:text-gray-400 mb-2">Aún no tienes amigos añadidos</p>
            <p className="text-sm text-slate-500 dark:text-gray-500">Envía solicitudes usando sus IDs para empezar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map(f => (
              <div key={f.uid} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-gray-100">{f.username || f.displayName || f.uid}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono">{f.uid}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={()=>removeFriend(f.uid)} 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar amigo"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reclamaciones */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center"><Coins className="w-5 h-5 mr-2 text-amber-600"/>Reclamar pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={claimData.toUid} onChange={(e)=>setClaimData({...claimData, toUid: e.target.value})} className="input-field">
            <option value="">Selecciona amigo</option>
            {friends.map(f => <option key={f.uid} value={f.uid}>{f.username || f.displayName || f.uid}</option>)}
          </select>
          <input type="number" min="0" step="0.01" placeholder="Monto" value={claimData.amount} onChange={(e)=>setClaimData({...claimData, amount: e.target.value})} className="input-field" />
          <input type="text" placeholder="Descripción (opcional)" value={claimData.description} onChange={(e)=>setClaimData({...claimData, description: e.target.value})} className="input-field" />
        </div>
        <div className="mt-3 flex justify-end">
          <button className="btn-primary" onClick={async ()=>{ await createClaim(claimData); setClaimData({ toUid:'', amount:'', description:'' }); showToast && showToast('Reclamación creada') }}>Crear</button>
        </div>

        {claims.length > 0 && (
          <div className="mt-6 space-y-3">
            {claims.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700 rounded-xl">
                <div>
                  <div className="font-medium text-slate-900 dark:text-gray-100">{c.fromUid === user.uid ? 'Tú reclamas a' : 'Te reclama'} {(() => {
                    const otherUid = c.fromUid === user.uid ? c.toUid : c.fromUid
                    const other = friends.find(fr => fr.uid === otherUid)
                    return other?.username || other?.displayName || otherUid
                  })()}</div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">{c.description || 'Sin descripción'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold">{formatCurrency ? formatCurrency(c.amount) : `€${Number(c.amount).toFixed(2)}`}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${c.status==='pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{c.status}</div>
                  {c.status==='pending' && c.toUid === user.uid && (
                    <button
                      type="button"
                      disabled={updatingClaimId === c.id}
                      onClick={async ()=>{
                        try {
                          setUpdatingClaimId(c.id)
                          await updateClaimStatus(c.id, 'paid')
                          showToast && showToast('Marcado como pagado')
                        } catch (e) {
                          showToast && showToast('No se pudo actualizar la reclamación', 'error')
                        } finally {
                          setUpdatingClaimId(null)
                        }
                      }}
                      className={`btn-primary py-2 ${updatingClaimId===c.id ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      <CheckCircle2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FriendsView


