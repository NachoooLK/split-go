import React, { useState, useEffect } from 'react'
import { X, Users, Clock, CheckCircle, AlertCircle, UserCheck } from 'lucide-react'

function GroupJoinModal({ groupData, inviteToken, generalToken, onJoin, onClose, user }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [userName, setUserName] = useState(user?.displayName || user?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [inviteType, setInviteType] = useState('specific') // 'specific' or 'general'

  useEffect(() => {
    if (groupData?.memberSlots) {
      if (generalToken) {
        // General invite - show all unclaimed general slots
        const generalSlots = groupData.memberSlots.filter(slot => 
          slot.type === 'pending' && 
          slot.status === 'unclaimed' &&
          slot.inviteType === 'general'
        )
        setAvailableSlots(generalSlots)
        setInviteType('general')
      } else if (inviteToken) {
        // Specific invite - show only the matching slot
        const specificSlots = groupData.memberSlots.filter(slot => 
          slot.type === 'pending' && 
          slot.status === 'unclaimed' &&
          slot.inviteToken === inviteToken &&
          slot.inviteType === 'specific' &&
          new Date(slot.expiresAt) > new Date()
        )
        setAvailableSlots(specificSlots)
        setInviteType('specific')
      }
    }
  }, [groupData, inviteToken, generalToken])

  const handleJoinGroup = async () => {
    if (!selectedSlot) {
      setError('Por favor selecciona tu identidad')
      return
    }

    if (inviteType === 'general' && !userName.trim()) {
      setError('Por favor ingresa tu nombre')
      return
    }

    setLoading(true)
    setError('')

    try {
      const joinData = {
        groupId: groupData.id,
        slotId: selectedSlot.id,
        userUid: user?.uid,
        userName: inviteType === 'general' ? userName.trim() : (user?.displayName || user?.email || 'Usuario')
      }

      if (inviteType === 'general') {
        joinData.generalToken = generalToken
        await onJoin(joinData, 'general')
      } else {
        joinData.inviteToken = inviteToken
        await onJoin(joinData, 'specific')
      }
    } catch (err) {
      setError('Error al unirse al grupo. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  const isExpired = availableSlots.length === 0 && groupData?.memberSlots?.some(slot => 
    slot.inviteToken === inviteToken && new Date(slot.expiresAt) <= new Date()
  )

  const isAlreadyClaimed = availableSlots.length === 0 && groupData?.memberSlots?.some(slot => 
    slot.inviteToken === inviteToken && slot.status === 'claimed'
  )

  if (isExpired) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">
                Enlace expirado
              </h2>
              <p className="text-slate-600 dark:text-gray-400 mb-6">
                Este enlace de invitación ha expirado. Contacta al administrador del grupo para obtener una nueva invitación.
              </p>
              <button onClick={onClose} className="btn-primary w-full">
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isAlreadyClaimed) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">
                Enlace ya utilizado
              </h2>
              <p className="text-slate-600 dark:text-gray-400 mb-6">
                Este enlace de invitación ya ha sido utilizado por otra persona. Cada enlace solo puede usarse una vez.
              </p>
              <button onClick={onClose} className="btn-primary w-full">
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">
              Únete al grupo
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Group Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-gray-100">
                    {groupData?.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    {groupData?.totalMembers} miembros en total
                  </p>
                </div>
              </div>
            </div>

            {availableSlots.length > 0 ? (
              <>
                {inviteType === 'general' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      ¿Cómo te llamas?
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ingresa tu nombre"
                      className="input-field w-full"
                      maxLength={50}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                      Este nombre se mostrará a otros miembros del grupo
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">
                    {inviteType === 'general' 
                      ? 'Selecciona qué slot del grupo quieres tomar:' 
                      : 'Selecciona tu identidad en el grupo:'
                    }
                  </h4>
                  <div className="space-y-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedSlot?.id === slot.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedSlot?.id === slot.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-gray-600 text-slate-600 dark:text-gray-300'
                            }`}>
                              {inviteType === 'general' 
                                ? '👤' 
                                : slot.name.charAt(0).toUpperCase()
                              }
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-gray-100">
                                {inviteType === 'general' 
                                  ? (slot.name || `Slot ${availableSlots.indexOf(slot) + 1}`)
                                  : slot.name
                                }
                              </p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">
                                {inviteType === 'general' 
                                  ? 'Slot disponible' 
                                  : 'Slot reservado para ti'
                                }
                              </p>
                            </div>
                          </div>
                          {selectedSlot?.id === slot.id && (
                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className={`border rounded-xl p-4 mb-6 ${
                  inviteType === 'general' 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-start space-x-3">
                    <UserCheck className={`w-5 h-5 mt-0.5 ${
                      inviteType === 'general' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                    <div className={`text-sm ${
                      inviteType === 'general' 
                        ? 'text-purple-700 dark:text-purple-300' 
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      <p className="font-medium">
                        {inviteType === 'general' 
                          ? '🌐 Enlace general' 
                          : '🔗 Enlace específico'
                        }
                      </p>
                      <p className="mt-1 text-xs">
                        {inviteType === 'general' 
                          ? 'Puedes elegir cualquier slot disponible y decidir tu nombre en el grupo.'
                          : 'El administrador del grupo reservó estos slots con nombres específicos. Al seleccionar tu identidad, otros miembros sabrán quién eres en el grupo.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleJoinGroup}
                  disabled={!selectedSlot || loading || (inviteType === 'general' && !userName.trim())}
                  className="btn-primary w-full"
                >
                  {loading ? 'Uniéndose...' : 'Unirme al grupo'}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">
                  No hay slots disponibles
                </h3>
                <p className="text-slate-600 dark:text-gray-400">
                  Todos los slots de este grupo ya han sido ocupados o el enlace no es válido.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupJoinModal
