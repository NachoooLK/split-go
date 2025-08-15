import React, { useState, useMemo } from 'react'
import { Search, Filter, Plus, TrendingUp, DollarSign, Hash, BarChart3, Pencil, Trash2, Save, X, Tag, Calendar } from 'lucide-react'
import Charts from './Charts'
import { useAppState } from '../hooks/useAppState'

function PersonalView({ expenses, categories, stats, onAddExpense, onEditExpense, onDeleteExpense, formatCurrency }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCharts, setShowCharts] = useState(false)
  const [showExpensesModal, setShowExpensesModal] = useState(false)
  const [chartTimeFilter, setChartTimeFilter] = useState('month')
  const itemsPerPage = 5
  
  const { getChartData } = useAppState()

  // Filtros combinados
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por categoría (en este panel sí debe aplicarse)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory)
    }

    // Filtro de fecha
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date)
        switch (dateFilter) {
          case 'today':
            return expenseDate >= today
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return expenseDate >= weekAgo
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            return expenseDate >= monthAgo
          default:
            return true
        }
      })
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, searchTerm, selectedCategory, dateFilter])

  // Datos para gráficas
  const chartData = useMemo(() => {
    return getChartData(chartTimeFilter, filteredExpenses)
  }, [getChartData, chartTimeFilter, filteredExpenses])

  // Paginación
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage)

  // Análisis por categoría
  const categoryAnalysis = useMemo(() => {
    const categoryTotals = {}
    const total = filteredExpenses.reduce((sum, expense) => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0
      }
      categoryTotals[expense.category] += expense.amount
      return sum + expense.amount
    }, 0)

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredExpenses])

  const StatCard = ({ title, value, icon: Icon, gradient }) => (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )

  const ExpenseItem = ({ expense, index }) => {
    const category = categories[expense.category]
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({ description: expense.description, amount: expense.amount.toString(), category: expense.category, date: new Date(expense.date).toISOString().split('T')[0] })
    const isGroupShare = expense.source === 'groupShare'
    const colorClasses = {
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const saveEdit = () => {
      const payload = {
        description: editData.description,
        amount: parseFloat(editData.amount),
        category: editData.category,
        date: new Date(editData.date)
      }
      onEditExpense(expense.id, payload)
      setIsEditing(false)
    }

    return (
      <div 
        className="card p-3 sm:p-4 card-hover animate-fade-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">{category.emoji}</span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input className="input-field" value={editData.description} onChange={(e)=>setEditData({...editData, description:e.target.value})} />
                <div className="flex space-x-2">
                  <input className="input-field" inputMode="decimal" value={editData.amount} onChange={(e)=>setEditData({...editData, amount:e.target.value})} />
                  <select className="input-field" value={editData.category} onChange={(e)=>setEditData({...editData, category:e.target.value})}>
                    {Object.entries(categories).map(([k,c])=> <option key={k} value={k}>{c.emoji} {c.name}</option>)}
                  </select>
                  <input type="date" className="input-field" value={editData.date} onChange={(e)=>setEditData({...editData, date:e.target.value})} />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-gray-100 truncate max-w-[180px] sm:max-w-none">{expense.description}</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  {expense.date.toLocaleDateString('es-ES', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <button onClick={saveEdit} className="btn-primary py-2"><Save className="w-4 h-4" /></button>
                <button onClick={()=>setIsEditing(false)} className="btn-secondary py-2"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">{formatCurrency ? formatCurrency(expense.amount) : `€${expense.amount.toFixed(2)}`}</p>
                <div className="flex items-center justify-end space-x-2 mt-1 sm:mt-2">
                  {!isGroupShare ? (
                    <>
                      <button onClick={()=>setIsEditing(true)} className="p-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>onDeleteExpense(expense.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"><Trash2 className="w-4 h-4"/></button>
                    </>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-600">De grupo</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[category.color]}`}>
                    {category.name}
                  </span>
                  {isGroupShare && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">Tu parte</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">💸</span>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
        {searchTerm || selectedCategory !== 'all' || dateFilter !== 'all' 
          ? 'No se encontraron gastos' 
          : '¡Empieza a trackear tus gastos!'
        }
      </h3>
      <p className="text-slate-600 dark:text-gray-400 mb-6">
        {searchTerm || selectedCategory !== 'all' || dateFilter !== 'all'
          ? 'Prueba con otros filtros o busca algo diferente'
          : 'Añade tu primer gasto y comienza a tener control sobre tus finanzas'
        }
      </p>
      <button onClick={onAddExpense} className="btn-primary">
        <Plus className="w-5 h-5 mr-2" />
        Añadir gasto
      </button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header con acciones compactas */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Dashboard Personal</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpensesModal(true)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 flex items-center gap-2 transition-colors duration-200"
            aria-label="Buscar y ver gastos"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Buscar y Gastos</span>
          </button>
        </div>
      </div>

      {/* Gráficas */}
      {showCharts && (
        <Charts
          chartData={chartData}
          categories={categories}
          timeFilter={chartTimeFilter}
          onTimeFilterChange={setChartTimeFilter}
        />
      )}

      {/* Estadísticas (compactas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total gastado"
          value={formatCurrency ? formatCurrency(parseFloat(stats.total)) : `€${stats.total}`}
          icon={DollarSign}
          gradient="from-green-500 to-emerald-600"
        />
        <StatCard
          title="Gastos del mes"
          value={formatCurrency ? formatCurrency(parseFloat(stats.monthly)) : `€${stats.monthly}`}
          icon={TrendingUp}
          gradient="from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Número de gastos"
          value={stats.count}
          icon={Hash}
          gradient="from-purple-500 to-violet-600"
        />
        <StatCard
          title="Promedio por gasto"
          value={formatCurrency ? formatCurrency(parseFloat(stats.average)) : `€${stats.average}`}
          icon={BarChart3}
          gradient="from-pink-500 to-rose-600"
        />
      </div>

      {/* Análisis por categoría */}
      {categoryAnalysis.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Gastos por Categoría
          </h2>
          <div className="space-y-4">
            {categoryAnalysis.map(({ category, amount, percentage }) => {
              const categoryInfo = categories[category]
              const colorClasses = {
                orange: 'from-orange-400 to-orange-600',
                blue: 'from-blue-400 to-blue-600',
                purple: 'from-purple-400 to-purple-600',
                pink: 'from-pink-400 to-pink-600',
                red: 'from-red-400 to-red-600',
                gray: 'from-gray-400 to-gray-600'
              }
              
              return (
                <div key={category} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-2xl">{categoryInfo.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 dark:text-gray-100">{categoryInfo.name}</span>
                        <span className="text-sm text-slate-600 dark:text-gray-400">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-gray-600 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full bg-gradient-to-r ${colorClasses[categoryInfo.color]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900 dark:text-gray-100">
                      {formatCurrency ? formatCurrency(amount) : `€${amount.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros movidos a modal (no visibles por defecto) */}


      {/* Modal combinado: filtros + resultados */}
      {showExpensesModal && (
        <div className="modal-backdrop z-[55]" onClick={()=>setShowExpensesModal(false)}>
          <div className="modal-content z-[55]" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto animate-scale-in p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Buscar y filtrar gastos</h3>
                <button className="btn-secondary py-2" onClick={()=>setShowExpensesModal(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Filtros de búsqueda */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar por descripción..." 
                        value={searchTerm} 
                        onChange={(e)=>setSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-3 h-12 text-[15px] bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-slate-400" 
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Categoría</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        value={selectedCategory} 
                        onChange={(e)=>setSelectedCategory(e.target.value)} 
                        className="w-full pl-9 pr-10 py-3 h-12 text-[15px] bg-white border border-slate-300 rounded-xl shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="all">Todas las categorías</option>
                        {Object.entries(categories).map(([key, category]) => (
                          <option key={key} value={key}>{category.emoji} {category.name}</option>
                        ))}
                      </select>
                      {/* Flecha personalizada para el select */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Fecha</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        value={dateFilter} 
                        onChange={(e)=>setDateFilter(e.target.value)} 
                        className="w-full pl-9 pr-10 py-3 h-12 text-[15px] bg-white border border-slate-300 rounded-xl shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="all">Todas las fechas</option>
                        <option value="today">Hoy</option>
                        <option value="week">Última semana</option>
                        <option value="month">Último mes</option>
                      </select>
                      {/* Flecha personalizada para el select */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Resumen de filtros */}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    Mostrando {filteredExpenses.length} de {expenses.length} gastos
                  </span>
                  {(searchTerm || selectedCategory !== 'all' || dateFilter !== 'all') && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory('all')
                        setDateFilter('all')
                        setCurrentPage(1)
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {paginatedExpenses.map((expense, index) => (
                      <div key={expense.id}>
                        <ExpenseItem expense={expense} index={index} />
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 pt-4">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium ${currentPage===page? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>{page}</button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalView
