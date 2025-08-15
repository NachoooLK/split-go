import React, { useState, useEffect, useRef } from 'react'
import { X, DollarSign, Calendar, Tag, Users, Camera } from 'lucide-react'
import { classifyCategoryAI } from '../services/aiCategorizer'
import TicketScanner from './TicketScanner'

function AddExpenseModal({ categories, group, onAdd, onUpdate, onClose, suggestCategory, initialExpense, user }) {
  // Helper function to get all available members (including pending slots)
  const getAllAvailableMembers = (group) => {
    if (!group) return []
    
    // If group has memberSlots, use them
    if (group.memberSlots && group.memberSlots.length > 0) {
      return group.memberSlots.map(slot => slot.name || `Miembro ${group.memberSlots.indexOf(slot) + 1}`)
    }
    
    // Fallback to members array
    return group.members || []
  }

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    paidBy: group ? getAllAvailableMembers(group)[0] : '',
    splitBetween: group ? [...getAllAvailableMembers(group)] : [],
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringNextDate: new Date().toISOString().split('T')[0]
  })
  const [errors, setErrors] = useState({})
  const [categoryManuallySet, setCategoryManuallySet] = useState(false)
  const [suggested, setSuggested] = useState('food')
  const [showTicketScanner, setShowTicketScanner] = useState(false)
  const [useDetailedSplit, setUseDetailedSplit] = useState(false)
  const [extractedItems, setExtractedItems] = useState([])
  const [itemAssignments, setItemAssignments] = useState({})
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
      paidBy: initialExpense.paidBy || (group ? getAllAvailableMembers(group)[0] : ''),
      splitBetween: Array.isArray(initialExpense.splitBetween) ? [...initialExpense.splitBetween] : (group ? [...getAllAvailableMembers(group)] : []),
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
    
    if (group) {
      if (useDetailedSplit && extractedItems.length > 0) {
        // Validar que al menos un item tenga asignaciones
        const hasAssignments = extractedItems.some((_, index) => 
          itemAssignments[index] && itemAssignments[index].length > 0
        )
        if (!hasAssignments) {
          newErrors.splitBetween = 'Asigna al menos un item a una persona'
        }
        // En división detallada, no validar formData.splitBetween ya que se usan las asignaciones de items
      } else if (formData.splitBetween.length < 1) {
        newErrors.splitBetween = 'Selecciona al menos una persona'
      }
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
    
    // Si usamos división detallada, generar splitBetween desde las asignaciones
    let finalSplitBetween = formData.splitBetween
    if (group && useDetailedSplit && extractedItems.length > 0) {
      // Obtener todos los miembros únicos que tienen items asignados
      const assignedMembers = new Set()
      Object.values(itemAssignments).forEach(members => {
        if (Array.isArray(members)) {
          members.forEach(member => assignedMembers.add(member))
        }
      })
      finalSplitBetween = Array.from(assignedMembers)
    }
    
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
        splitBetween: finalSplitBetween,
        // Agregar datos de división detallada si está activada
        ...(useDetailedSplit && extractedItems.length > 0 && {
          useDetailedSplit: true,
          items: extractedItems,
          itemAssignments: itemAssignments
        })
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

  const handleTicketDataExtracted = (ticketData) => {
    console.log('✅ Datos extraídos del ticket:', ticketData)
    // Rellenar campos con datos extraídos del ticket
    setFormData(prev => ({
      ...prev,
      description: ticketData.description || ticketData.merchant || prev.description,
      amount: ticketData.amount ? String(ticketData.amount) : prev.amount,
      category: ticketData.suggestedCategory || prev.category,
      date: ticketData.date || prev.date
    }))
    
    // Si hay items extraídos, configurar para división detallada
    if (ticketData.items && ticketData.items.length > 0) {
      setExtractedItems(ticketData.items)
      setUseDetailedSplit(true)
      // Inicializar asignaciones vacías
      const assignments = {}
      ticketData.items.forEach((item, index) => {
        assignments[index] = []
      })
      setItemAssignments(assignments)
    }
    
    // Si se sugiere una categoría, no marcar como manual
    if (ticketData.suggestedCategory) {
      setCategoryManuallySet(false)
      setSuggested(ticketData.suggestedCategory)
    }
    
    // Limpiar errores si los campos ahora tienen datos
    if (ticketData.description || ticketData.merchant) {
      setErrors(prev => ({ ...prev, description: '' }))
    }
    if (ticketData.amount) {
      setErrors(prev => ({ ...prev, amount: '' }))
    }
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

  const handleItemAssignment = (itemIndex, member) => {
    setItemAssignments(prev => {
      const current = prev[itemIndex] || []
      const isAssigned = current.includes(member)
      
      return {
        ...prev,
        [itemIndex]: isAssigned 
          ? current.filter(m => m !== member)
          : [...current, member]
      }
    })
  }

  const addCustomItem = () => {
    const newIndex = extractedItems.length
    setExtractedItems(prev => [...prev, { name: '', price: 0 }])
    setItemAssignments(prev => ({ ...prev, [newIndex]: [] }))
  }

  const updateCustomItem = (index, field, value) => {
    setExtractedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeCustomItem = (index) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index))
    setItemAssignments(prev => {
      const newAssignments = { ...prev }
      delete newAssignments[index]
      // Reindexar las asignaciones
      const reindexed = {}
      Object.entries(newAssignments).forEach(([key, value]) => {
        const numKey = parseInt(key)
        if (numKey > index) {
          reindexed[numKey - 1] = value
        } else {
          reindexed[key] = value
        }
      })
      return reindexed
    })
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content pb-safe overflow-x-hidden" onClick={e => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full mx-auto animate-scale-in flex flex-col overflow-x-hidden" style={{ maxHeight: '75vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100">
              {initialExpense ? (group ? 'Editar gasto' : 'Editar gasto') : (group ? 'Nuevo gasto' : 'Nuevo gasto')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: '0' }}>
            <form id="expense-form" onSubmit={handleSubmit} className="p-4 space-y-4 overflow-x-hidden">
            {/* Ticket Scanner Button */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-indigo-900 dark:text-indigo-100">¿Tienes un ticket?</h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">Escanéalo para rellenar automáticamente</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('📷 Abriendo TicketScanner')
                    setShowTicketScanner(true)
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
                >
                  <Camera className="w-3 h-3" />
                  <span>Escanear</span>
                </button>
              </div>
            </div>
            {/* Descripción y Monto en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="expense-description" className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Descripción
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
                  placeholder="Ej: Almuerzo..."
                  className={`input-field text-sm py-2 ${errors.description ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Monto (€)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className={`input-field text-sm py-2 pl-8 ${errors.amount ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p>
                )}
              </div>
            </div>

            {/* Categoría y Fecha en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <div className="relative">
                  <Tag className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setCategoryManuallySet(true)
                      setFormData(prev => ({ ...prev, category: e.target.value }))
                    }}
                    className="input-field text-sm py-2 pl-8"
                  >
                    {Object.entries(categories).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {suggestCategory && suggested && suggested !== formData.category && (
                  <div className="mt-1 text-xs text-slate-600 dark:text-gray-400">
                    Sugerido: <button type="button" onClick={() => { setCategoryManuallySet(false); setFormData(prev => ({ ...prev, category: suggested })) }} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      {categories[suggested]?.emoji} {categories[suggested]?.name}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field text-sm py-2 pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Recurrente */}
            <div>
              <div className="flex items-center space-x-2">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e)=> setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-0"
                />
                <label htmlFor="isRecurring" className="text-xs text-slate-700 dark:text-gray-300">Marcar como recurrente</label>
              </div>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">Frecuencia</label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e)=> setFormData(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                    className="input-field text-sm py-2"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">Próxima fecha</label>
                  <input
                    type="date"
                    value={formData.recurringNextDate}
                    onChange={(e)=> setFormData(prev => ({ ...prev, recurringNextDate: e.target.value }))}
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
            )}

            {/* Campos específicos para grupos */}
            {group && (
              <>
                {/* Quién pagó */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                    ¿Quién pagó?
                  </label>
                  <div className="relative">
                    <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                    <select
                      value={formData.paidBy}
                      onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
                      className="input-field text-sm py-2 pl-8"
                    >
                      {getAllAvailableMembers(group).map(member => (
                        <option key={member} value={member}>{member}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* División del gasto */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-gray-300">
                      ¿Entre quién dividir?
                    </label>
                    {extractedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUseDetailedSplit(!useDetailedSplit)}
                        className={`text-xs px-2 py-1 rounded ${
                          useDetailedSplit 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                            : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {useDetailedSplit ? '📝 División detallada' : '⚡ División rápida'}
                      </button>
                    )}
                  </div>
                  
                  {!useDetailedSplit && (
                    <>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mb-3">
                        💡 Puedes dividir gastos con personas que aún no se han unido al grupo. Se mostrarán como "Pendiente de unirse".
                      </p>
                      <div className="space-y-2">
                        {getAllAvailableMembers(group).map(member => {
                          // Check if this member is actually joined (has a UID) or is just a pending slot
                          const memberSlot = group.memberSlots?.find(slot => slot.name === member)
                          const isJoined = memberSlot?.type === 'friend' || memberSlot?.status === 'claimed'
                          const isPending = memberSlot?.type === 'pending' && memberSlot?.status === 'unclaimed'
                          
                          return (
                            <label key={member} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.splitBetween.includes(member)}
                                onChange={() => handleMemberToggle(member)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-0"
                              />
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  isJoined 
                                    ? 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50' 
                                    : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50'
                                }`}>
                                  <span className="text-xs">{isJoined ? '👤' : '⏳'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-900 dark:text-gray-100">{member}</span>
                                  {isPending && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">Pendiente de unirse</span>
                                  )}
                                </div>
                              </div>
                              {formData.splitBetween.includes(member) && formData.amount && !useDetailedSplit && (
                                <span className="text-xs text-slate-600 dark:text-gray-400 ml-auto">
                                  €{(parseFloat(formData.amount || 0) / formData.splitBetween.length).toFixed(2)}
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {useDetailedSplit && extractedItems.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-600 dark:text-gray-400">
                        🍽️ Asigna cada item a las personas que lo consumieron. Puedes asignar el mismo item a varias personas.
                      </p>
                      
                      <div className="space-y-3">
                        {extractedItems.map((item, index) => (
                          <div key={index} className="bg-slate-50 dark:bg-gray-800 rounded-lg p-3 border border-slate-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-gray-100">
                                  {item.name || `Item ${index + 1}`}
                                </span>
                                <span className="text-sm text-slate-600 dark:text-gray-400">
                                  €{item.price?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomItem(index)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 overflow-x-hidden">
                              {getAllAvailableMembers(group).map(member => {
                                const isAssigned = itemAssignments[index]?.includes(member)
                                return (
                                  <button
                                    key={member}
                                    type="button"
                                    onClick={() => handleItemAssignment(index, member)}
                                    className={`text-xs px-2 py-1 rounded transition-colors ${
                                      isAssigned
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-gray-500'
                                    }`}
                                  >
                                    {member}
                                  </button>
                                )
                              })}
                            </div>
                            
                            {itemAssignments[index]?.length > 0 && (
                              <div className="mt-2 text-xs text-slate-600 dark:text-gray-400">
                                €{(item.price / Math.max(1, itemAssignments[index]?.length || 1)).toFixed(2)} por persona
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <button
                        type="button"
                        onClick={addCustomItem}
                        className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-400 text-sm rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        + Añadir item manual
                      </button>
                    </div>
                  )}
                  
                  {errors.splitBetween && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.splitBetween}</p>
                  )}
                </div>
              </>
            )}

            {/* Preview del gasto */}
            {formData.description && formData.amount && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3">
                <h3 className="text-xs font-medium text-indigo-800 dark:text-indigo-200 mb-1">Vista previa:</h3>
                <div className="text-xs text-indigo-700 dark:text-indigo-300">
                  <div className="flex items-center justify-between">
                    <span>{formData.description}</span>
                    <span className="font-bold">€{parseFloat(formData.amount || 0).toFixed(2)}</span>
                  </div>
                  
                  {group && useDetailedSplit && extractedItems.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-medium">División por items:</div>
                      {extractedItems.map((item, index) => {
                        const assignedMembers = itemAssignments[index] || []
                        const costPerPerson = assignedMembers.length > 0 ? item.price / assignedMembers.length : 0
                        return (
                          <div key={index} className="text-xs flex justify-between">
                            <span>{item.name}</span>
                            <span>
                              {assignedMembers.length > 0 
                                ? `€${costPerPerson.toFixed(2)} × ${assignedMembers.length}`
                                : 'Sin asignar'
                              }
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : group && formData.splitBetween.length > 0 ? (
                    <div className="mt-1 text-xs">
                      €{(parseFloat(formData.amount || 0) / formData.splitBetween.length).toFixed(2)} por persona 
                      ({formData.splitBetween.length} {formData.splitBetween.length === 1 ? 'persona' : 'personas'})
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            </form>
          </div>
          
          {/* Footer fijo con botones */}
          <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 rounded-b-2xl">
            {/* Estado de validación en división detallada - compacto */}
            {group && useDetailedSplit && extractedItems.length > 0 && (
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-800 dark:text-blue-200 flex items-center justify-between">
                  <span>División detallada</span>
                  <span>
                    {extractedItems.some((_, index) => itemAssignments[index] && itemAssignments[index].length > 0) 
                      ? `✅ ${extractedItems.filter((_, index) => itemAssignments[index] && itemAssignments[index].length > 0).length}/${extractedItems.length}`
                      : '⚠️ Sin asignar'
                    }
                  </span>
                </div>
              </div>
            )}
            
            {/* Botones */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 text-sm py-3"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="expense-form"
                className="btn-primary flex-1 text-sm py-3"

              >
                {initialExpense ? 'Guardar' : 'Añadir gasto'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Ticket Scanner Modal - Renderizado fuera para evitar problemas de z-index */}
    {showTicketScanner && (
      <TicketScanner
        user={user}
        onDataExtracted={handleTicketDataExtracted}
        onClose={() => setShowTicketScanner(false)}
      />
    )}
    </>
  )
}

export default AddExpenseModal
