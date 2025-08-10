import React, { useState } from 'react'
import { X, Users, Plus, Trash2 } from 'lucide-react'

function AddGroupModal({ onAdd, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    members: ['']
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del grupo es requerido'
    }
    
    const validMembers = formData.members.filter(member => member.trim())
    if (validMembers.length < 2) {
      newErrors.members = 'Se requieren al menos 2 miembros'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const group = {
      name: formData.name.trim(),
      members: formData.members.filter(member => member.trim()).map(member => member.trim())
    }
    
    onAdd(group)
  }

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, '']
    }))
  }

  const removeMember = (index) => {
    if (formData.members.length <= 1) return
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }))
  }

  const updateMember = (index, value) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map((member, i) => i === index ? value : member)
    }))
    if (errors.members) {
      setErrors(prev => ({ ...prev, members: '' }))
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Nuevo grupo</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nombre del grupo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del grupo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }))
                  }
                }}
                placeholder="Ej: Viaje a París, Casa compartida..."
                className={`input-field ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Miembros */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Miembros del grupo
              </label>
              <div className="space-y-3">
                {formData.members.map((member, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={member}
                        onChange={(e) => updateMember(index, e.target.value)}
                        placeholder={`Nombre del miembro ${index + 1}`}
                        className={`input-field pl-10 ${errors.members ? 'border-red-300 focus:ring-red-500' : ''}`}
                      />
                    </div>
                    {formData.members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addMember}
                className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>Añadir miembro</span>
              </button>
              
              {errors.members && (
                <p className="mt-2 text-sm text-red-600">{errors.members}</p>
              )}
            </div>

            {/* Preview */}
            {formData.name && formData.members.filter(m => m.trim()).length >= 2 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <h3 className="text-sm font-medium text-indigo-800 mb-2">Vista previa:</h3>
                <div className="text-sm text-indigo-700">
                  <div className="font-medium">{formData.name}</div>
                  <div className="mt-1">
                    {formData.members.filter(m => m.trim()).length} miembros: {' '}
                    {formData.members.filter(m => m.trim()).join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                Crear grupo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddGroupModal