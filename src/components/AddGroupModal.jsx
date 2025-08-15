import React, { useState, useEffect } from 'react'
import { X, Users, Plus, Trash2, UserPlus, Link, Clock } from 'lucide-react'
import { useFriends } from '../hooks/useFriends'

function AddGroupModal({ onAdd, onClose, user }) {
  const { friends } = useFriends(user)
  const [step, setStep] = useState(1) // 1: Basic info, 2: Member selection, 3: Review
  const [formData, setFormData] = useState({
    name: '',
    totalMembers: 3,
    memberSlots: []
  })
  const [errors, setErrors] = useState({})

  // Initialize member slots when totalMembers changes
  useEffect(() => {
    const newSlots = Array.from({ length: formData.totalMembers }, (_, index) => ({
      id: `slot_${index}`,
      name: index === 0 ? 'Tú' : '', // First slot is for the creator
      type: index === 0 ? 'reserved' : 'pending', // First slot is reserved for creator
      friendUid: null,
      status: index === 0 ? 'claimed' : 'unclaimed', // First slot is claimed by creator
      inviteType: index === 0 ? 'reserved' : 'specific' // Default to specific invites
    }))
    
    // Preserve existing data when possible, but always keep first slot for creator
    formData.memberSlots.forEach((existingSlot, index) => {
      if (newSlots[index]) {
        if (index === 0) {
          // Keep first slot reserved for creator
          newSlots[index] = {
            ...newSlots[index],
            name: 'Tú',
            type: 'reserved',
            status: 'claimed'
          }
        } else {
          newSlots[index] = existingSlot
        }
      }
    })
    
    setFormData(prev => ({ ...prev, memberSlots: newSlots }))
  }, [formData.totalMembers])

  // Auto-convert to friend type if user selects a friend
  const handleFriendSelection = (index, friend) => {
    if (friend) {
      assignFriendToSlot(index, friend)
    }
  }

  const validateStep = (currentStep) => {
    const newErrors = {}
    
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre del grupo es requerido'
      }
      if (formData.totalMembers < 2 || formData.totalMembers > 20) {
        newErrors.totalMembers = 'Debe haber entre 2 y 20 miembros'
      }
    }
    
    if (currentStep === 2) {
      // First slot is always reserved for creator, so we need at least one more configured slot
      const filledSlots = formData.memberSlots.slice(1).filter(slot => 
        slot.name.trim() || slot.type === 'friend'
      )
      if (filledSlots.length < 1) {
        newErrors.memberSlots = 'Se requiere configurar al menos un miembro adicional'
      }
      
      // Check for duplicate friends (excluding the first slot which is reserved for creator)
      const selectedFriends = formData.memberSlots.slice(1)
        .filter(slot => slot.type === 'friend' && slot.friendUid)
        .map(slot => slot.friendUid)
      
      const uniqueFriends = [...new Set(selectedFriends)]
      if (selectedFriends.length !== uniqueFriends.length) {
        newErrors.memberSlots = 'No puedes seleccionar el mismo amigo dos veces'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateStep(step)) return
    
    // Process member slots into the format expected by backend
    const memberData = formData.memberSlots.map(slot => ({
      id: slot.id,
      name: slot.name || `Miembro ${formData.memberSlots.indexOf(slot) + 1}`,
      type: slot.type,
      friendUid: slot.friendUid,
      status: slot.type === 'friend' ? 'invited' : 'unclaimed',
      inviteType: slot.inviteType || 'specific',
      inviteToken: slot.type === 'pending' ? generateInviteToken() : null,
      expiresAt: slot.type === 'pending' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null // 7 days
    }))
    
    // Generate a general invite token if there are any general invite slots
    const hasGeneralSlots = memberData.some(slot => slot.inviteType === 'general')
    const generalInviteToken = hasGeneralSlots ? generateInviteToken() : null
    
    const group = {
      name: formData.name.trim(),
      totalMembers: formData.totalMembers,
      memberSlots: memberData,
      generalInviteToken: generalInviteToken,
      createdBy: user?.uid
    }
    
    onAdd(group)
  }

  const generateInviteToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const updateSlot = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      memberSlots: prev.memberSlots.map((slot, i) => 
        i === index ? { ...slot, ...updates } : slot
      )
    }))
    if (errors.memberSlots) {
      setErrors(prev => ({ ...prev, memberSlots: '' }))
    }
  }

  const assignFriendToSlot = (index, friend) => {
    updateSlot(index, {
      name: friend.username || friend.displayName || friend.uid,
      type: 'friend',
      friendUid: friend.uid
    })
  }

  const setSlotAsPending = (index, name) => {
    updateSlot(index, {
      name: name || '',
      type: 'pending',
      friendUid: null
    })
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      {[1, 2, 3].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            stepNum <= step 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-200 text-slate-500'
          }`}>
            {stepNum}
          </div>
          {stepNum < 3 && (
            <div className={`w-12 h-0.5 mx-2 ${
              stepNum < step ? 'bg-indigo-600' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Información básica</h3>
        <p className="text-sm text-slate-600">Define el nombre y tamaño del grupo</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nombre del grupo
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }))
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
          }}
          placeholder="Ej: Viaje a París, Casa compartida..."
          className={`input-field ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Total de miembros
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            min="2"
            max="20"
            value={formData.totalMembers}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, totalMembers: parseInt(e.target.value) || 2 }))
              if (errors.totalMembers) setErrors(prev => ({ ...prev, totalMembers: '' }))
            }}
            className={`input-field w-20 ${errors.totalMembers ? 'border-red-300 focus:ring-red-500' : ''}`}
          />
          <span className="text-sm text-slate-600">personas (incluido tú)</span>
        </div>
        {errors.totalMembers && (
          <p className="mt-1 text-sm text-red-600">{errors.totalMembers}</p>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="text-sm text-indigo-700">
            <p className="font-medium">En el siguiente paso podrás:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Invitar amigos directamente</li>
              <li>• Reservar slots para personas que no están en tus contactos</li>
              <li>• Generar enlaces únicos de invitación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Asignar miembros</h3>
        <p className="text-sm text-slate-600">¿Es un amigo tuyo o alguien nuevo?</p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {formData.memberSlots.map((slot, index) => (
          <div key={slot.id} className={`border rounded-lg p-3 ${
            index === 0 
              ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
              : 'border-slate-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  {index === 0 ? 'Tú (Creador)' : `Miembro ${index + 1}`}
                </span>
                {index === 0 && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-full">
                    Reservado
                  </span>
                )}
              </div>
              {index === 0 ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 dark:text-green-400">👤 Tú</span>
                </div>
              ) : (
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      // Toggle between friend selection and manual entry
                      const isCurrentlyFriend = slot.type === 'friend'
                      if (isCurrentlyFriend) {
                        setSlotAsPending(index, '')
                      } else {
                        // Convert to friend type to show friend selector
                        updateSlot(index, { type: 'friend', friendUid: null })
                      }
                    }}
                    disabled={friends.length === 0}
                    className={`p-1.5 rounded-lg transition-colors duration-200 ${
                      slot.type === 'friend' 
                        ? 'bg-green-100 text-green-600 border border-green-300' 
                        : friends.length > 0
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                        : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                    title={
                      slot.type === 'friend' 
                        ? 'Cambiar a enlace' 
                        : friends.length > 0 
                        ? '¿Es un amigo?' 
                        : 'No tienes amigos agregados'
                    }
                  >
                    <UserPlus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {index === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Este es tu slot como creador del grupo
                </p>
              </div>
            ) : slot.type === 'friend' ? (
              <div>
                <select
                  value={slot.friendUid || ''}
                  onChange={(e) => {
                    const selectedFriend = friends.find(f => f.uid === e.target.value)
                    if (selectedFriend) {
                      assignFriendToSlot(index, selectedFriend)
                    } else {
                      // If "Selecciona un amigo" is selected, convert back to pending
                      setSlotAsPending(index, '')
                    }
                  }}
                  className="input-field w-full"
                >
                  <option value="">Selecciona un amigo</option>
                  {friends.length > 0 ? (
                    friends.map(friend => {
                      // Check if this friend is already selected in another slot
                      const isAlreadySelected = formData.memberSlots.some((otherSlot, otherIndex) => 
                        otherIndex !== index && 
                        otherSlot.type === 'friend' && 
                        otherSlot.friendUid === friend.uid
                      )
                      
                      return (
                        <option 
                          key={friend.uid} 
                          value={friend.uid}
                          disabled={isAlreadySelected}
                        >
                          {friend.username || friend.displayName || friend.uid}
                          {isAlreadySelected ? ' (ya seleccionado)' : ''}
                        </option>
                      )
                    })
                  ) : (
                    <option value="" disabled>No tienes amigos agregados</option>
                  )}
                </select>
                <p className="mt-1 text-xs text-green-600">
                  ✅ Ya es tu amigo - recibirá invitación directa
                </p>
                {friends.length === 0 && (
                  <p className="mt-1 text-xs text-orange-600">
                    💡 Ve a "Amigos" para agregar amigos primero
                  </p>
                )}
                {friends.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    {friends.length} amigo{friends.length !== 1 ? 's' : ''} disponible{friends.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={slot.name}
                  onChange={(e) => updateSlot(index, { name: e.target.value })}
                  placeholder="Escribe el nombre (ej: Nacho) o déjalo vacío"
                  className="input-field w-full"
                />
                
                {/* Tipo de enlace */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`inviteType_${index}`}
                      checked={slot.inviteType !== 'general'}
                      onChange={() => updateSlot(index, { inviteType: 'specific' })}
                      className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-700 dark:text-gray-300">
                        Enlace específico
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">
                        {slot.name ? `Para "${slot.name}" únicamente` : 'Requiere nombre específico'}
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`inviteType_${index}`}
                      checked={slot.inviteType === 'general'}
                      onChange={() => updateSlot(index, { inviteType: 'general' })}
                      className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-700 dark:text-gray-300">
                        Enlace general
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">
                        Cualquiera puede elegir este slot
                      </div>
                    </div>
                  </label>
                </div>
                
                <div className="text-xs">
                  {slot.inviteType === 'general' ? (
                    <p className="text-purple-600 dark:text-purple-400">
                      🌐 Se creará enlace general - quien entre podrá elegir su identidad
                    </p>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400">
                      🔗 Se creará enlace específico - se registrará automáticamente con este nombre
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {errors.memberSlots && (
        <p className="text-sm text-red-600">{errors.memberSlots}</p>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Resumen</h3>
        <p className="text-sm text-slate-600">Revisa la configuración del grupo</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
        <div>
          <span className="text-sm font-medium text-slate-700">Nombre:</span>
          <span className="ml-2 text-slate-900">{formData.name}</span>
        </div>
        
        <div>
          <span className="text-sm font-medium text-slate-700">Total miembros:</span>
          <span className="ml-2 text-slate-900">{formData.totalMembers}</span>
        </div>
        
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Configuración de miembros:</p>
          <div className="space-y-2">
            {formData.memberSlots.map((slot, index) => (
              <div key={slot.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-900">
                  {index === 0 ? 'Tú (Creador)' : (slot.name || `Miembro ${index + 1}`)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  index === 0
                    ? 'bg-green-100 text-green-700'
                    : slot.type === 'friend' 
                    ? 'bg-green-100 text-green-700' 
                    : slot.inviteType === 'general'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {index === 0 
                    ? 'Creador' 
                    : slot.type === 'friend' 
                    ? 'Invitación directa' 
                    : slot.inviteType === 'general'
                    ? 'Enlace general'
                    : 'Enlace específico'
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Link className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Al crear el grupo:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Los amigos recibirán invitaciones automáticamente</li>
              <li>• Se generarán enlaces específicos para personas concretas</li>
              <li>• Se generará un enlace general para slots abiertos</li>
              <li>• Los enlaces expirarán en 7 días si no se usan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-auto animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Nuevo grupo</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6 text-slate-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 pt-6">
            {renderStepIndicator()}
          </div>

          {/* Form */}
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="p-6 pt-0">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Botones */}
            <div className="flex space-x-3 pt-6 mt-6 border-t border-slate-200 dark:border-gray-700">
              <button
                type="button"
                onClick={step > 1 ? handleBack : onClose}
                className="btn-secondary flex-1"
              >
                {step > 1 ? 'Atrás' : 'Cancelar'}
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {step === 3 ? 'Crear grupo' : 'Siguiente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddGroupModal