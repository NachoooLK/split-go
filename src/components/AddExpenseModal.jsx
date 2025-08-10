import React, { useState, useEffect, useRef } from 'react'
import { X, DollarSign, Calendar, Tag, Users } from 'lucide-react'
import { classifyCategoryAI } from '../services/aiCategorizer'

function AddExpenseModal({ categories, group, onAdd, onUpdate, onClose, suggestCategory, initialExpense }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    paidBy: group ? group.members[0] : '',
    splitBetween: group ? [...group.members] : [],
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringNextDate: new Date().toISOString().split('T')[0]
  })
  const [errors, setErrors] = useState({})
  const [categoryManuallySet, setCategoryManuallySet] = useState(false)
  const [suggested, setSuggested] = useState('food')
  const abortRef = useRef()

  useEffect(() => {
    // Auto-focus en el campo de descripción
    const descriptionInput = document.getElementById('expense-description')
    if (descriptionInput) {
      descriptionInput.focus()
    }

    // Cleanup on unmount
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  // Prefill when editing
  useEffect(() => {
    if (!initialExpense) return
    setFormData(prev => ({
      ...prev,
      description: initialExpense.description || '',
      amount: initialExpense.amount != null ? String(initialExpense.amount) : '',
      category: initialExpense.category || 'food',
      date: initialExpense.date ? new Date(initialExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paidBy: initialExpense.paidBy || (group ? group.members[0] : ''),
      splitBetween: Array.isArray(initialExpense.splitBetween) ? [...initialExpense.splitBetween] : (group ? [...group.members] : []),
      isRecurring: !!initialExpense.isRecurring,
      recurringFrequency: initialExpense.recurringFrequency || 'monthly',
      recurringNextDate: initialExpense.recurringNextDate ? new Date(initialExpense.recurringNextDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }))
  }, [initialExpense, group])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0'
    }
    
    if (group && formData.splitBetween.length < 1) {
      newErrors.splitBetween = 'Selecciona al menos una persona'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // AI-powered category suggestion with debouncing
  useEffect(() => {
    const desc = formData.description || ''
    if (!desc.trim()) return

    const timeoutId = setTimeout(async () => {
      try {
        // Abort any previous request
        if (abortRef.current) {
          abortRef.current.abort()
        }
        abortRef.current = new AbortController()

        const guess = await classifyCategoryAI(desc)
        setSuggested(guess)
        if (!categoryManuallySet && guess !== formData.category) {
          setFormData(prev => ({ ...prev, category: guess }))
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Category suggestion aborted')
        } else {
          console.warn('Category suggestion failed:', error)
        }
      }
    }, 500) // 500ms debounce

    return () => {
      clearTimeout(timeoutId)
    }
  }, [formData.description, categoryManuallySet, suggestCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const expense = {
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: new Date(formData.date),
      isRecurring: !!formData.isRecurring,
      recurringFrequency: formData.recurringFrequency,
      recurringNextDate: formData.recurringNextDate ? new Date(formData.recurringNextDate) : undefined,
      ...(group && {
        paidBy: formData.paidBy,
        splitBetween: formData.splitBetween
      })
    }
    
    if (initialExpense && onUpdate) {
      onUpdate(expense)
    } else {
      onAdd(expense)
    }
  }

  const handleMemberToggle = (member) => {
    setFormData(prev => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(member)
        ? prev.splitBetween.filter(m => m !== member)
        : [...prev.splitBetween, member]
    }))
  }

  const handleAmountChange = (e) => {
    const value = e.target.value
    // Solo permitir números y un punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, amount: value }))
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }))
      }
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              {initialExpense ? (group ? 'Editar gasto grupal' : 'Editar gasto personal') : (group ? 'Nuevo gasto grupal' : 'Nuevo gasto personal')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Descripción */}
            <div>
              <label htmlFor="expense-description" className="block text-sm font-medium text-slate-700 mb-2">
                Descripción del gasto
              </label>
              <input
                id="expense-description"
                type="text"
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: '' }))
                  }
                }}
                placeholder="Ej: Almuerzo restaurante, Metro, Supermercado..."
                className={`input-field ${errors.description ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monto (€)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className={`input-field pl-10 ${errors.amount ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoría
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setCategoryManuallySet(true)
                    setFormData(prev => ({ ...prev, category: e.target.value }))
                  }}
                  className="input-field pl-10"
                >
                  {Object.entries(categories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.emoji} {category.name}
                    </option>
                  ))}
                </select>
                {suggestCategory && suggested && suggested !== formData.category && (
                  <div className="mt-2 text-xs text-slate-600">
                    Sugerido: <button type="button" onClick={() => { setCategoryManuallySet(false); setFormData(prev => ({ ...prev, category: suggested })) }} className="font-medium text-indigo-600 hover:underline">
                      {categories[suggested]?.emoji} {categories[suggested]?.name}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Recurrente */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ¿Es un pago recurrente?
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e)=> setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0"
                />
                <label htmlFor="isRecurring" className="text-slate-700">Marcar como recurrente</label>
              </div>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Frecuencia</label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e)=> setFormData(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                    className="input-field"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Próxima fecha</label>
                  <input
                    type="date"
                    value={formData.recurringNextDate}
                    onChange={(e)=> setFormData(prev => ({ ...prev, recurringNextDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {/* Campos específicos para grupos */}
            {group && (
              <>
                {/* Quién pagó */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ¿Quién pagó?
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={formData.paidBy}
                      onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
                      className="input-field pl-10"
                    >
                      {group.members.map(member => (
                        <option key={member} value={member}>{member}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* División del gasto */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    ¿Entre quién dividir?
                  </label>
                  <div className="space-y-3">
                    {group.members.map(member => (
                      <label key={member} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.splitBetween.includes(member)}
                          onChange={() => handleMemberToggle(member)}
                          className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">👤</span>
                          </div>
                          <span className="font-medium text-slate-900">{member}</span>
                        </div>
                        {formData.splitBetween.includes(member) && formData.amount && (
                          <span className="text-sm text-slate-600 ml-auto">
                            €{(parseFloat(formData.amount || 0) / formData.splitBetween.length).toFixed(2)}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.splitBetween && (
                    <p className="mt-2 text-sm text-red-600">{errors.splitBetween}</p>
                  )}
                </div>
              </>
            )}

            {/* Preview del gasto */}
            {formData.description && formData.amount && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <h3 className="text-sm font-medium text-indigo-800 mb-2">Vista previa:</h3>
                <div className="text-sm text-indigo-700">
                  <div className="flex items-center justify-between">
                    <span>{formData.description}</span>
                    <span className="font-bold">€{parseFloat(formData.amount || 0).toFixed(2)}</span>
                  </div>
                  {group && formData.splitBetween.length > 0 && (
                    <div className="mt-2 text-xs">
                      €{(parseFloat(formData.amount || 0) / formData.splitBetween.length).toFixed(2)} por persona 
                      ({formData.splitBetween.length} {formData.splitBetween.length === 1 ? 'persona' : 'personas'})
                    </div>
                  )}
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
                {initialExpense ? 'Guardar cambios' : 'Añadir gasto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddExpenseModal
