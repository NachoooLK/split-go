import React, { useMemo } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { BarChart3 } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

function Charts({ expenses, categories, formatCurrency }) {
  const chartData = useMemo(() => {
    if (!expenses?.length) return null

    // Preparar datos por categoría
    const categoryTotals = {}
    const categoryColors = {
      food: '#f97316',
      transport: '#3b82f6', 
      entertainment: '#8b5cf6',
      shopping: '#ec4899',
      bills: '#ef4444',
      other: '#6b7280'
    }

    Object.keys(categories).forEach(key => {
      categoryTotals[key] = 0
    })

    expenses.forEach(expense => {
      if (categoryTotals.hasOwnProperty(expense.category)) {
        categoryTotals[expense.category] += expense.amount
      } else {
        categoryTotals.other += expense.amount
      }
    })

    // Filtrar categorías con gasto > 0
    const filteredCategories = Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .sort(([,a], [,b]) => b - a)

    if (filteredCategories.length === 0) return null

    const labels = filteredCategories.map(([key]) => categories[key]?.name || key)
    const data = filteredCategories.map(([_, amount]) => amount)
    const backgroundColors = filteredCategories.map(([key]) => categoryColors[key] || categoryColors.other)

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    }
  }, [expenses, categories])

  const monthlyData = useMemo(() => {
    if (!expenses?.length) return null

    const now = new Date()
    const months = []
    const monthlyTotals = []

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      months.push(monthKey)

      const monthTotal = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === date.getMonth() && 
                 expenseDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum, expense) => sum + expense.amount, 0)

      monthlyTotals.push(monthTotal)
    }

    return {
      labels: months,
      datasets: [{
        label: 'Gastos mensuales',
        data: monthlyTotals,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    }
  }, [expenses])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${formatCurrency(context.parsed || context.raw)}`
          }
        }
      }
    }
  }

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value)
          }
        }
      }
    }
  }

  if (!expenses?.length) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No hay datos suficientes para mostrar gráficos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gráfico por categorías */}
      {chartData && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Gastos por categoría</h3>
          <div className="h-64">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Tendencia mensual */}
      {monthlyData && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Tendencia mensual</h3>
          <div className="h-64">
            <Bar data={monthlyData} options={barOptions} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Charts