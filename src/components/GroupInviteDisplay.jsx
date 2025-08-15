import React, { useState } from 'react'
import { Copy, Share, Link, QrCode, Clock, Check, X } from 'lucide-react'

function GroupInviteDisplay({ group, onManageSlots }) {
  const [copiedToken, setCopiedToken] = useState(null)

  const copyInviteLink = async (token, slotName) => {
    const link = `${window.location.origin}?invite=${token}&group=${group.id}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const shareInviteLink = async (token, slotName) => {
    const link = `${window.location.origin}?invite=${token}&group=${group.id}`
    const text = `¡Únete al grupo "${group.name}"! Tu slot reservado es: ${slotName}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invitación al grupo',
          text: text,
          url: link
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copy
      copyInviteLink(token, slotName)
    }
  }

  const pendingSlots = group.memberSlots?.filter(slot => 
    slot.type === 'pending' && 
    slot.status === 'unclaimed' &&
    new Date(slot.expiresAt?.toDate?.() || slot.expiresAt) > new Date()
  ) || []

  const claimedSlots = group.memberSlots?.filter(slot => 
    slot.status === 'claimed'
  ) || []

  const expiredSlots = group.memberSlots?.filter(slot => 
    slot.type === 'pending' && 
    (slot.status === 'unclaimed' && new Date(slot.expiresAt?.toDate?.() || slot.expiresAt) <= new Date())
  ) || []

  if (!group.memberSlots || group.memberSlots.length === 0) {
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
          Enlaces de invitación
        </h3>
        {onManageSlots && (
          <button 
            onClick={onManageSlots}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Gestionar slots
          </button>
        )}
      </div>

      {/* Pending Invites */}
      {pendingSlots.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-amber-500" />
            Pendientes ({pendingSlots.length})
          </h4>
          <div className="space-y-3">
            {pendingSlots.map(slot => (
              <div key={slot.id} className="border border-slate-200 dark:border-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900 dark:text-gray-100">
                    {slot.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    Expira: {new Date(slot.expiresAt?.toDate?.() || slot.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyInviteLink(slot.inviteToken, slot.name)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      copiedToken === slot.inviteToken
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40'
                    }`}
                  >
                    {copiedToken === slot.inviteToken ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar enlace</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => shareInviteLink(slot.inviteToken, slot.name)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    <Share className="w-4 h-4" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claimed Slots */}
      {claimedSlots.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3 flex items-center">
            <Check className="w-4 h-4 mr-2 text-green-500" />
            Confirmados ({claimedSlots.length})
          </h4>
          <div className="space-y-2">
            {claimedSlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {slot.name}
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                    ({slot.actualName})
                  </span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  Confirmado el {new Date(slot.claimedAt?.toDate?.() || slot.claimedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired Slots */}
      {expiredSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3 flex items-center">
            <X className="w-4 h-4 mr-2 text-red-500" />
            Expirados ({expiredSlots.length})
          </h4>
          <div className="space-y-2">
            {expiredSlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="font-medium text-red-900 dark:text-red-100">
                  {slot.name}
                </span>
                <span className="text-xs text-red-600 dark:text-red-400">
                  Expiró el {new Date(slot.expiresAt?.toDate?.() || slot.expiresAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingSlots.length === 0 && claimedSlots.length === 0 && expiredSlots.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-gray-400">
          <Link className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay enlaces de invitación activos</p>
        </div>
      )}
    </div>
  )
}

export default GroupInviteDisplay
