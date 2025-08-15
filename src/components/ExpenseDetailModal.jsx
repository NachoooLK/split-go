import React from 'react'
import { X, User, Calendar, Tag, Users, Edit2, Trash2 } from 'lucide-react'

function ExpenseDetailModal({ expense, categories, group, user, onClose, onToggleSettled, formatCurrency, onEdit, onDelete }) {
  if (!expense) return null

  const category = categories[expense.category]
  const settledBy = Array.isArray(expense.settledBy) ? expense.settledBy : []
  const isMyExpense = expense.paidBy === user?.displayName || expense.paidBy === user?.email
  const hasUnsettled = expense.splitBetween.some(member => !settledBy.includes(member))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" style={{paddingBottom: 'calc(1rem + env(safe-area-inset-bottom) + 6rem)'}} onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-8rem)] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">
            Detalles del gasto
          </h2>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(group.id, expense)
                  onClose()
                }}
                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title="Editar gasto"
              >
                <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
                    onDelete(group.id, expense.id)
                    onClose()
                  }
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Eliminar gasto"
              >
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Basic Info */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-800/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{category.emoji}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-1">
                {expense.description}
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                {isMyExpense && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                    Tu gasto
                  </span>
                )}
                {hasUnsettled && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    Pendiente
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                {formatCurrency ? formatCurrency(expense.amount || 0) : `€${(expense.amount || 0).toFixed(2)}`}
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center space-x-3">
            <Tag className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              category.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
              category.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
              category.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
              category.color === 'pink' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' :
              category.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {category.name}
            </span>
          </div>

          {/* Date and Paid By */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-slate-600 dark:text-gray-400" />
              <span className="text-slate-900 dark:text-gray-100">
                {expense.date.toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-slate-600 dark:text-gray-400" />
              <span className="text-slate-900 dark:text-gray-100">
                Pagado por <span className="font-semibold">{expense.paidBy}</span>
              </span>
            </div>
          </div>

          {/* Split Between */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Users className="w-5 h-5 text-slate-600 dark:text-gray-400" />
              <span className="font-medium text-slate-900 dark:text-gray-100">
                Dividido entre {expense.splitBetween.length} persona{expense.splitBetween.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-2">
              {expense.splitBetween.map((member, idx) => {
                const isSettled = settledBy.includes(member)
                const shareAmount = (expense.amount || 0) / (expense.splitBetween.length || 1)
                
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isSettled ? 'bg-green-500' : 'bg-amber-500'
                      }`} />
                      <span className="font-medium text-slate-900 dark:text-gray-100">
                        {member}
                      </span>
                      {member === (user?.displayName || user?.email) && (
                        <span className="text-xs text-slate-600 dark:text-gray-400">(Tú)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900 dark:text-gray-100">
                        {formatCurrency ? formatCurrency(shareAmount || 0) : `€${(shareAmount || 0).toFixed(2)}`}
                      </div>
                      {onToggleSettled && member !== expense.paidBy && (
                        <button
                          onClick={() => onToggleSettled(group.id, expense.id, member, !isSettled)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            isSettled 
                              ? 'text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30' 
                              : 'text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                          }`}
                        >
                          {isSettled ? 'Pagado' : 'Marcar como pagado'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detailed Split Items */}
          {expense.useDetailedSplit && expense.items && (
            <div>
              <h4 className="font-medium text-slate-900 dark:text-gray-100 mb-3">
                División detallada ({expense.items.length} items)
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-1 border border-slate-200 dark:border-gray-600 rounded-lg p-2">
                {expense.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-gray-700/50 rounded text-sm">
                    <span className="text-slate-900 dark:text-gray-100 flex-1 truncate pr-2">{item.name}</span>
                    <span className="font-medium text-slate-900 dark:text-gray-100 flex-shrink-0">
                      {formatCurrency ? formatCurrency(item.price || item.amount || 0) : `€${(item.price || item.amount || 0).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExpenseDetailModal
