import React, { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { TrendingUp, Calendar, Download, Target, Brain, Zap, RefreshCcw, Plus } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler)

function AdvancedAnalytics({ expenses, categories, className = '', formatCurrency, recurringExpenses = [], configuredRecurring = [], onAddRecurring, onDeleteRecurring, onMarkPaid }) {
  const [timeRange, setTimeRange] = useState('3months')
  const [chartType, setChartType] = useState('trends')
  const [comparisonMode, setComparisonMode] = useState('previous')
  const [showAddRecurring, setShowAddRecurring] = useState(false)
  const [newRecurring, setNewRecurring] = useState({
    description: '',
    amount: '',
    category: Object.keys(categories || {})[0] || 'other',
    frequency: 'monthly',
    nextDate: ''
  })

  // Cálculos avanzados
  const analytics = useMemo(() => {
    const now = new Date()
    let startDate, endDate, comparisonStart, comparisonEnd
    
    switch (timeRange) {
      case 'week':
        startDate = subDays(now, 7)
        endDate = now
        comparisonStart = subDays(startDate, 7)
        comparisonEnd = startDate
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        comparisonStart = startOfMonth(subDays(startDate, 1))
        comparisonEnd = endOfMonth(subDays(startDate, 1))
        break
      case '3months':
        startDate = subDays(now, 90)
        endDate = now
        comparisonStart = subDays(startDate, 90)
        comparisonEnd = startDate
        break
      case 'year':
        startDate = subDays(now, 365)
        endDate = now
        comparisonStart = subDays(startDate, 365)
        comparisonEnd = startDate
        break
      default:
        startDate = subDays(now, 30)
        endDate = now
        comparisonStart = subDays(startDate, 30)
        comparisonEnd = startDate
    }

    const currentExpenses = expenses.filter(exp => exp.date >= startDate && exp.date <= endDate)
    const comparisonExpenses = expenses.filter(exp => exp.date >= comparisonStart && exp.date <= comparisonEnd)
    
    const currentTotal = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const comparisonTotal = comparisonExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    const change = comparisonTotal > 0 ? ((currentTotal - comparisonTotal) / comparisonTotal) * 100 : 0
    
    // Predicción lineal simple
    const dailyAverage = currentExpenses.length > 0 ? currentTotal / currentExpenses.length : 0
    const daysInMonth = 30
    const monthlyPrediction = dailyAverage * daysInMonth
    
    // Patrones de gasto por día de la semana
    const dayPatterns = {}
    currentExpenses.forEach(exp => {
      const day = format(exp.date, 'EEEE', { locale: es })
      if (!dayPatterns[day]) dayPatterns[day] = 0
      dayPatterns[day] += exp.amount
    })
    
    // Top categorías
    const categoryTotals = {}
    currentExpenses.forEach(exp => {
      if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0
      categoryTotals[exp.category] += exp.amount
    })
    
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    return {
      currentTotal,
      comparisonTotal,
      change,
      monthlyPrediction,
      dayPatterns,
      topCategories,
      currentExpenses,
      comparisonExpenses
    }
  }, [expenses, timeRange])

  // Datos para gráficos de tendencias
  const trendData = useMemo(() => {
    const now = new Date()
    let intervals, format_fn
    
    switch (timeRange) {
      case 'week':
        intervals = eachDayOfInterval({ start: subDays(now, 7), end: now })
        format_fn = (date) => format(date, 'EEE', { locale: es })
        break
      case 'month':
        intervals = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })
        format_fn = (date) => format(date, 'd')
        break
      case '3months':
        intervals = eachWeekOfInterval({ start: subDays(now, 90), end: now })
        format_fn = (date) => format(date, 'dd/MM', { locale: es })
        break
      case 'year':
        intervals = eachMonthOfInterval({ start: subDays(now, 365), end: now })
        format_fn = (date) => format(date, 'MMM', { locale: es })
        break
      default:
        intervals = eachDayOfInterval({ start: subDays(now, 30), end: now })
        format_fn = (date) => format(date, 'dd/MM')
    }
    
    const labels = intervals.map(format_fn)
    const data = intervals.map(interval => {
      return analytics.currentExpenses
        .filter(exp => {
          if (timeRange === 'week' || timeRange === 'month') {
            return format(exp.date, 'yyyy-MM-dd') === format(interval, 'yyyy-MM-dd')
          } else if (timeRange === '3months') {
            return format(exp.date, 'yyyy-ww') === format(interval, 'yyyy-ww')
          } else {
            return format(exp.date, 'yyyy-MM') === format(interval, 'yyyy-MM')
          }
        })
        .reduce((sum, exp) => sum + exp.amount, 0)
    })
    
    return { labels, data }
  }, [analytics.currentExpenses, timeRange])

  // Configuración de gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter',
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#475569',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        font: {
          family: 'Inter'
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter',
            weight: '500'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          font: {
            family: 'Inter',
            weight: '500'
          },
          callback: function(value) {
            return formatCurrency ? formatCurrency(value) : '€' + value.toFixed(0)
          }
        }
      }
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Fecha', 'Descripción', 'Categoría', 'Monto'],
      ...analytics.currentExpenses.map(exp => [
        format(exp.date, 'yyyy-MM-dd'),
        exp.description,
        categories[exp.category]?.name || exp.category,
        exp.amount.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `gastos_${timeRange}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderChart = () => {
    switch (chartType) {
      case 'trends':
        return (
          <div className="h-80">
            <Line
              data={{
                labels: trendData.labels,
                datasets: [
                  {
                    label: 'Gastos',
                    data: trendData.data,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                  }
                ]
              }}
              options={chartOptions}
            />
          </div>
        )
      
      case 'categories':
        const categoryData = analytics.topCategories.map(([cat, amount]) => amount)
        const categoryLabels = analytics.topCategories.map(([cat]) => categories[cat]?.name || cat)
        const categoryColors = analytics.topCategories.map(([cat]) => {
          const colorMap = {
            orange: '#fb923c',
            blue: '#60a5fa',
            purple: '#a78bfa',
            pink: '#f472b6',
            red: '#ef4444',
            gray: '#9ca3af'
          }
          return colorMap[categories[cat]?.color] || '#9ca3af'
        })
        
        return (
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={{
                labels: categoryLabels,
                datasets: [
                  {
                    data: categoryData,
                    backgroundColor: categoryColors,
                    borderWidth: 0,
                    hoverOffset: 4
                  }
                ]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'right',
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: {
                        family: 'Inter',
                        weight: '500'
                      }
                    }
                  }
                }
              }}
            />
          </div>
        )
      
      case 'patterns':
        const dayData = Object.values(analytics.dayPatterns)
        const dayLabels = Object.keys(analytics.dayPatterns)
        
        return (
          <div className="h-80">
            <Bar
              data={{
                labels: dayLabels,
                datasets: [
                  {
                    label: 'Gastos por día',
                    data: dayData,
                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                  }
                ]
              }}
              options={chartOptions}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header con controles */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100 truncate">Analytics Avanzados</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 truncate">Insights inteligentes sobre tus gastos</p>
            </div>
          </div>
        </div>
        
        {/* Controles responsivos */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Selector de rango temporal */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-field text-sm sm:text-base min-w-0"
            >
              <option value="week">Última semana</option>
              <option value="month">Este mes</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="year">Último año</option>
            </select>
            
            {/* Selector de tipo de gráfico */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="input-field text-sm sm:text-base min-w-0"
            >
              <option value="trends">Tendencias</option>
              <option value="categories">Por categorías</option>
              <option value="patterns">Patrones semanales</option>
            </select>
          </div>
          
          {/* Botón de exportar */}
          <button
            onClick={exportData}
            className="btn-secondary flex items-center justify-center space-x-2 text-sm sm:text-base whitespace-nowrap"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-gray-400 mb-1">Total período</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-gray-100 truncate">{formatCurrency ? formatCurrency(analytics.currentTotal) : `€${analytics.currentTotal.toFixed(2)}`}</p>
              <p className={`text-xs sm:text-sm mt-1 flex items-center ${
                analytics.change >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0 ${analytics.change < 0 ? 'rotate-180' : ''}`} />
                <span className="truncate">{Math.abs(analytics.change).toFixed(1)}% vs anterior</span>
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 ml-3">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-gray-400 mb-1">Predicción mensual</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-gray-100 truncate">{formatCurrency ? formatCurrency(analytics.monthlyPrediction) : `€${analytics.monthlyPrediction.toFixed(2)}`}</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1 truncate">Basado en tendencia actual</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 ml-3">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-gray-400 mb-1">Categoría principal</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-gray-100 truncate">
                {analytics.topCategories[0] ? categories[analytics.topCategories[0][0]]?.name : 'N/A'}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1 truncate">
                {analytics.topCategories[0] ? (formatCurrency ? formatCurrency(analytics.topCategories[0][1]) : `€${analytics.topCategories[0][1].toFixed(2)}`) : (formatCurrency ? formatCurrency(0) : '0.00')}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0 ml-3">
              <span className="text-lg sm:text-xl">
                {analytics.topCategories[0] ? categories[analytics.topCategories[0][0]]?.emoji : '📊'}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-gray-400 mb-1">Promedio diario</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-gray-100 truncate">
                {formatCurrency ? formatCurrency(analytics.currentExpenses.length > 0 ? (analytics.currentTotal / analytics.currentExpenses.length) : 0) : `€${analytics.currentExpenses.length > 0 ? (analytics.currentTotal / analytics.currentExpenses.length).toFixed(2) : '0.00'}`}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1 truncate">
                {analytics.currentExpenses.length} transacciones
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 ml-3">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-600 flex-shrink-0" />
          <span className="truncate">Análisis Visual</span>
        </h3>
        <div className="w-full overflow-hidden">
          {renderChart()}
        </div>
      </div>

      {/* Insights inteligentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600 flex-shrink-0" />
            <span className="truncate">Insights Inteligentes</span>
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {analytics.change > 15 && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-xs sm:text-sm">
                  ⚠️ <strong>Alerta:</strong> Tus gastos han aumentado un {analytics.change.toFixed(1)}% comparado con el período anterior.
                </p>
              </div>
            )}
            
            {analytics.change < -15 && (
              <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-xs sm:text-sm">
                  ✅ <strong>¡Excelente!</strong> Has reducido tus gastos un {Math.abs(analytics.change).toFixed(1)}% comparado con el período anterior.
                </p>
              </div>
            )}
            
            {analytics.monthlyPrediction > analytics.currentTotal * 1.5 && (
              <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-xs sm:text-sm">
                  📈 <strong>Predicción:</strong> A este ritmo, podrías gastar {formatCurrency ? formatCurrency(analytics.monthlyPrediction) : `€${analytics.monthlyPrediction.toFixed(2)}`} este mes.
                </p>
              </div>
            )}
            
            {Object.entries(analytics.dayPatterns).length > 0 && (
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-xs sm:text-sm">
                  📅 <strong>Patrón detectado:</strong> Sueles gastar más los {
                    Object.entries(analytics.dayPatterns)
                      .sort(([,a], [,b]) => b - a)[0]?.[0]?.toLowerCase()
                  }.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 mb-3 sm:mb-4">Top Categorías</h3>
          <div className="space-y-3">
            {analytics.topCategories.map(([category, amount], index) => {
              const categoryInfo = categories[category]
              const percentage = analytics.currentTotal > 0 ? (amount / analytics.currentTotal) * 100 : 0
              
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-lg sm:text-xl flex-shrink-0">{categoryInfo?.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 dark:text-gray-100 text-sm sm:text-base truncate">{categoryInfo?.name}</div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">{percentage.toFixed(1)}% del total</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-bold text-slate-900 dark:text-gray-100 text-sm sm:text-base">{formatCurrency ? formatCurrency(amount) : `€${amount.toFixed(2)}`}</div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">#{index + 1}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sección de "Gastos recurrentes detectados" retirada a petición del usuario */}

      {/* Pagos recurrentes configurados */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center">
          <RefreshCcw className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" />
          <span className="truncate">Pagos recurrentes configurados</span>
        </h3>
        {onAddRecurring && (
          <div className="mb-4">
            {!showAddRecurring ? (
              <button className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base whitespace-nowrap" onClick={() => setShowAddRecurring(true)}>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Añadir pago recurrente</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="label">Descripción</label>
                  <input className="input-field" value={newRecurring.description} onChange={(e)=>setNewRecurring(v=>({...v, description: e.target.value}))} placeholder="Google Pay" />
                </div>
                <div>
                  <label className="label">Monto</label>
                  <input type="number" step="0.01" className="input-field" value={newRecurring.amount} onChange={(e)=>setNewRecurring(v=>({...v, amount: e.target.value}))} placeholder="5" />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input-field" value={newRecurring.category} onChange={(e)=>setNewRecurring(v=>({...v, category: e.target.value}))}>
                    {Object.keys(categories||{}).map((key)=> (
                      <option key={key} value={key}>{categories[key]?.name || key}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Frecuencia</label>
                  <select className="input-field" value={newRecurring.frequency} onChange={(e)=>setNewRecurring(v=>({...v, frequency: e.target.value}))}>
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
                <div>
                  <label className="label">Próxima fecha</label>
                  <input type="date" className="input-field" value={newRecurring.nextDate} onChange={(e)=>setNewRecurring(v=>({...v, nextDate: e.target.value}))} />
                </div>
                <div className="sm:col-span-2 lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    className="btn-primary"
                    onClick={async ()=>{
                      if (!newRecurring.description || !newRecurring.amount) return
                      await onAddRecurring({
                        description: newRecurring.description,
                        amount: Number(newRecurring.amount),
                        category: newRecurring.category,
                        frequency: newRecurring.frequency,
                        nextDate: newRecurring.nextDate || undefined,
                        active: true,
                      })
                      setNewRecurring({ description: '', amount: '', category: Object.keys(categories||{})[0] || 'other', frequency: 'monthly', nextDate: '' })
                      setShowAddRecurring(false)
                    }}
                  >Guardar</button>
                  <button className="btn-secondary" onClick={()=>setShowAddRecurring(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
        {configuredRecurring.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-gray-400">Aún no has configurado pagos recurrentes.</p>
        ) : (
                      <div className="divide-y divide-slate-200 dark:divide-gray-700">
            {configuredRecurring.map((rec) => (
              <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className="text-lg sm:text-xl flex-shrink-0">{categories[rec.category]?.emoji || '🔁'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 dark:text-gray-100 text-sm sm:text-base truncate">{rec.description}</div>
                    <div className="text-xs text-slate-600 dark:text-gray-400">
                      Frecuencia: <span className="uppercase font-semibold">{rec.frequency}</span>
                      <span className="mx-2">•</span>
                      Próxima fecha: {rec.nextDate ? format(rec.nextDate, 'yyyy-MM-dd') : 'No definida'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="text-left sm:text-right">
                    <div className="font-bold text-slate-900 dark:text-gray-100 text-sm sm:text-base">{formatCurrency ? formatCurrency(rec.amount) : `€${Number(rec.amount).toFixed(2)}`}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">{categories[rec.category]?.name || rec.category}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onMarkPaid && (
                      <button className="btn-secondary text-xs sm:text-sm px-3 py-2" onClick={() => onMarkPaid(rec.id)}>Registrar pago</button>
                    )}
                    {onDeleteRecurring && (
                      <button className="btn-danger text-xs sm:text-sm px-3 py-2" onClick={() => onDeleteRecurring(rec.id)}>Eliminar</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedAnalytics
