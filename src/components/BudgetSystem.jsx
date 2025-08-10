import React, { useState, useMemo } from 'react'
import { Target, Plus, Edit2, Trash2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'

function BudgetSystem({ expenses, categories, formatCurrency }) {
  const [budgets, setBudgets] = useState([
    { id: 1, category: 'food', limit: 300, period: 'monthly' },
    { id: 2, category: 'entertainment', limit: 150, period: 'monthly' }
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    category: 'food',
    limit: '',
    period: 'monthly'
  })

  const budgetAnalysis = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return budgets.map(budget => {
      // Calcular gastos del período actual
      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        
        if (budget.period === 'monthly') {
          return expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear &&
                 expense.category === budget.category
        }
        // Aquí se pueden agregar más períodos (weekly, yearly)
        return expense.category === budget.category
      })

      const spent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0
      const remaining = budget.limit - spent
      
      let status = 'good' // good, warning, danger
      if (percentage > 100) status = 'danger'
      else if (percentage > 80) status = 'warning'

      return {
        ...budget,
        spent,
        percentage: Math.min(percentage, 100),
        remaining,
        status,
        overBudget: spent > budget.limit
      }
    })
  }, [budgets, expenses])

  const handleAddBudget = (e) => {
    e.preventDefault()
    
    if (!formData.limit || parseFloat(formData.limit) <= 0) return
    
    const newBudget = {
      id: Date.now(),
      category: formData.category,
      limit: parseFloat(formData.limit),
      period: formData.period
    }
    
    setBudgets(prev => [...prev, newBudget])
    setFormData({ category: 'food', limit: '', period: 'monthly' })
    setShowAddForm(false)
  }

  const handleEditBudget = (budget) => {
    setEditingBudget(budget.id)
    setFormData({
      category: budget.category,
      limit: budget.limit.toString(),
      period: budget.period
    })
  }

  const handleUpdateBudget = (e) => {
    e.preventDefault()
    
    if (!formData.limit || parseFloat(formData.limit) <= 0) return
    
    setBudgets(prev => prev.map(budget => 
      budget.id === editingBudget 
        ? { ...budget, category: formData.category, limit: parseFloat(formData.limit), period: formData.period }
        : budget
    ))
    
    setEditingBudget(null)
    setFormData({ category: 'food', limit: '', period: 'monthly' })
  }

  const handleDeleteBudget = (id) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'danger': return 'bg-red-500'
      default: return 'bg-slate-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'danger': return <TrendingDown className="w-5 h-5 text-red-600" />
      default: return <Target className="w-5 h-5 text-slate-600" />
    }
  }

  if (!expenses?.length) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Sistema de presupuestos</h3>
          <p className="text-slate-500 mb-4">Agrega algunos gastos primero para configurar presupuestos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Presupuestos</h2>
          <p className="text-slate-600">Controla tus gastos por categoría</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo presupuesto</span>
        </button>
      </div>

      {/* Lista de presupuestos */}
      <div className="grid gap-4">
        {budgetAnalysis.map(budget => (
          <div key={budget.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(budget.status)}
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {categories[budget.category]?.emoji} {categories[budget.category]?.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Presupuesto {budget.period === 'monthly' ? 'mensual' : budget.period}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditBudget(budget)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => handleDeleteBudget(budget.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Barra de progreso */}
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getStatusColor(budget.status)}`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                ></div>
              </div>

              {/* Estadísticas */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-slate-600">
                    Gastado: <span className="font-medium text-slate-900">{formatCurrency(budget.spent)}</span>
                  </span>
                  <span className="text-slate-600">
                    Límite: <span className="font-medium text-slate-900">{formatCurrency(budget.limit)}</span>
                  </span>
                </div>
                <div className={`font-medium ${budget.overBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {budget.overBudget ? 'Excedido por ' : 'Restante: '}
                  {formatCurrency(Math.abs(budget.remaining))}
                </div>
              </div>

              {/* Porcentaje */}
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  budget.status === 'danger' ? 'text-red-600' : 
                  budget.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {budget.percentage.toFixed(1)}% utilizado
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de nuevo presupuesto */}
      {(showAddForm || editingBudget) && (
        <div className="modal-backdrop" onClick={() => {
          setShowAddForm(false)
          setEditingBudget(null)
          setFormData({ category: 'food', limit: '', period: 'monthly' })
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-scale-in">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
                </h3>
                
                <form onSubmit={editingBudget ? handleUpdateBudget : handleAddBudget} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-field"
                    >
                      {Object.entries(categories).map(([key, category]) => (
                        <option key={key} value={key}>
                          {category.emoji} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Límite</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, limit: e.target.value }))}
                      placeholder="0.00"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
                    <select
                      value={formData.period}
                      onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                      className="input-field"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingBudget(null)
                        setFormData({ category: 'food', limit: '', period: 'monthly' })
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      {editingBudget ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {budgets.length === 0 && (
        <div className="card p-6">
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No hay presupuestos configurados</h3>
            <p className="text-slate-500 mb-4">Crea tu primer presupuesto para controlar tus gastos</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Crear presupuesto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetSystem