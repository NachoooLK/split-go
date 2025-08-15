import React, { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Users, DollarSign, ArrowRight, CheckCircle, XCircle, CreditCard, AlertTriangle, Link, BarChart3 } from 'lucide-react'
import GroupInviteDisplay from './GroupInviteDisplay'

function GroupDetails({ group, categories, user, onBack, onAddExpense, getGroupBalance, getMinimalTransfers, onEditExpense, onDeleteExpense, onToggleSettled, onSettleExpense }) {
  const [activeTab, setActiveTab] = useState('expenses')
  const [settleForExpense, setSettleForExpense] = useState(null)
  const [selectedSettled, setSelectedSettled] = useState([])
  
  const balances = getGroupBalance(group.id)
  const transfers = getMinimalTransfers(group.id)
  const totalExpenses = group.expenses.filter(expense => expense.amount > 0).reduce((sum, expense) => sum + expense.amount, 0)
  const isSettled = Object.values(balances).every(balance => Math.abs(balance) < 0.01)

  // Calcular métricas del usuario actual
  const userMetrics = useMemo(() => {
    if (!user) return { paid: 0, owes: 0, memberName: '' }
    
    // Buscar el nombre del usuario en el grupo usando múltiples estrategias
    let memberName = ''
    
    // Estrategia 1: Si el grupo tiene membersUids, buscar por UID
    if (group.membersUids && group.membersUids.includes(user.uid)) {
      const userIndex = group.membersUids.indexOf(user.uid)
      if (userIndex !== -1 && group.members && group.members[userIndex]) {
        memberName = group.members[userIndex]
      }
    }
    
    // Estrategia 2: Buscar por coincidencia de nombre
    if (!memberName) {
      const possibleNames = [
        user.displayName,
        user.email,
        user.uid,
        'Tú'
      ].filter(Boolean)
      
      for (const name of possibleNames) {
        if (group.members && group.members.includes(name)) {
          memberName = name
          break
        }
      }
    }
    
    // Estrategia 3: Buscar en los balances (por si el usuario está en el grupo pero con otro nombre)
    if (!memberName && Object.keys(balances).length > 0) {
      // Si solo hay un balance, probablemente es el usuario
      const balanceKeys = Object.keys(balances)
      if (balanceKeys.length === 1) {
        memberName = balanceKeys[0]
      } else {
        // Buscar por nombres similares
        for (const balanceKey of balanceKeys) {
          if (user.displayName && balanceKey.toLowerCase().includes(user.displayName.toLowerCase())) {
            memberName = balanceKey
            break
          }
        }
      }
    }
    
    // Fallback: usar el primer miembro si no encontramos coincidencia
    if (!memberName && group.members && group.members.length > 0) {
      memberName = group.members[0]
    }
    
    // Calcular lo que he pagado
    const paidByMe = group.expenses
      .filter(expense => expense.paidBy === memberName && expense.amount > 0)
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    // Calcular lo que me queda por pagar (si mi balance es negativo)
    const myBalance = balances[memberName] || 0
    const owes = myBalance < 0 ? Math.abs(myBalance) : 0
    
    return {
      paid: paidByMe,
      owes: owes,
      memberName: memberName
    }
  }, [group.expenses, group.members, group.membersUids, balances, user])

  const ExpensesList = () => (
    <div className="space-y-4">
      {group.expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay gastos aún
          </h3>
          <p className="text-slate-600 mb-4">
            Añade el primer gasto del grupo para empezar
          </p>
          <button 
            onClick={() => onAddExpense(group)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir gasto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {group.expenses.map((expense, index) => {
            const category = categories[expense.category]
            const sharePerPerson = expense.amount / expense.splitBetween.length
            const settledBy = Array.isArray(expense.settledBy) ? expense.settledBy : []
            
            return (
              <div
                key={expense.id}
                onTouchStart={(e)=>{ e.currentTarget.__sx = e.touches[0].clientX }}
                onTouchEnd={(e)=>{
                  const sx = e.currentTarget.__sx; if (sx==null) return
                  const dx = e.changedTouches[0].clientX - sx
                  if (Math.abs(dx)>60) {
                    if (dx < 0) onDeleteExpense && onDeleteExpense(group.id, expense.id)
                     if (dx > 0) onEditExpense && onEditExpense(group.id, expense)
                  }
                  e.currentTarget.__sx = null
                }}
                className="card p-3 sm:p-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">{category.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1 truncate">
                        {expense.description}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">
                        Pagado por <span className="font-medium">{expense.paidBy}</span> • {' '}
                        {expense.date.toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {expense.splitBetween.map((member, idx) => {
                          const isSettled = settledBy.includes(member)
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${isSettled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                            >
                              {member} (€{sharePerPerson.toFixed(2)})
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">
                      €{expense.amount.toFixed(2)}
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      category.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      category.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      category.color === 'pink' ? 'bg-pink-100 text-pink-800' :
                      category.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {category.name}
                    </div>
                    <div className="mt-2">
                      <button
                        className="btn-secondary py-1 px-2 text-xs"
                        onClick={() => {
                          setSettleForExpense(expense)
                          setSelectedSettled(Array.isArray(expense.settledBy) ? [...expense.settledBy] : [])
                        }}
                      >
                        Registrar pago
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const MembersTab = () => (
    <div className="space-y-6">
      {/* Lista de miembros */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Users className="w-6 h-6 text-indigo-600 mr-2" />
          Miembros del grupo ({group.members.length})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.members.map((member, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">{member}</h4>
                <p className="text-sm text-slate-600">
                  {member === userMetrics.memberName ? 'Tú' : 'Miembro'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información del grupo */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Link className="w-6 h-6 text-indigo-600 mr-2" />
          Información del grupo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Nombre del grupo:</span>
              <span className="font-medium text-slate-900">{group.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total de miembros:</span>
              <span className="font-medium text-slate-900">{group.members.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total de gastos:</span>
              <span className="font-medium text-slate-900">{group.expenses.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total gastado:</span>
              <span className="font-medium text-slate-900">€{totalExpenses.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Promedio por persona:</span>
              <span className="font-medium text-slate-900">
                €{group.members.length > 0 ? (totalExpenses / group.members.length).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Estado del grupo:</span>
              <span className={`font-medium ${isSettled ? 'text-green-600' : 'text-amber-600'}`}>
                {isSettled ? 'Saldado' : 'Pendiente'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Fecha de creación:</span>
              <span className="font-medium text-slate-900">
                {group.createdAt ? new Date(group.createdAt.toDate ? group.createdAt.toDate() : group.createdAt).toLocaleDateString('es-ES') : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const AnalyticsTab = () => {
    // Calcular deudas específicas para el usuario actual
    const currentUserName = userMetrics.userName
    const userDebts = []
    const userCredits = []
    
    Object.entries(balances).forEach(([member, balance]) => {
      if (member === currentUserName) {
        if (balance < -0.01) {
          // El usuario debe dinero
          userDebts.push({
            to: member,
            amount: Math.abs(balance)
          })
        } else if (balance > 0.01) {
          // Le deben dinero al usuario
          userCredits.push({
            from: member,
            amount: balance
          })
        }
      }
    })

    // Calcular deudas específicas entre miembros
    const debtDetails = []
    group.expenses.filter(expense => expense.amount > 0).forEach(expense => {
      if (expense.paidBy === currentUserName && expense.splitBetween) {
        const sharePerPerson = expense.amount / expense.splitBetween.length
        expense.splitBetween.forEach(member => {
          if (member !== currentUserName) {
            const existingDebt = debtDetails.find(d => d.to === member)
            if (existingDebt) {
              existingDebt.amount += sharePerPerson
            } else {
              debtDetails.push({
                to: member,
                amount: sharePerPerson,
                expense: expense.description
              })
            }
          }
        })
      }
    })

    return (
      <div className="space-y-6">
        {/* Estado general del grupo */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 flex items-center">
            {isSettled ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                Grupo saldado
              </>
            ) : (
              <>
                <DollarSign className="w-6 h-6 text-amber-600 mr-2" />
                Balances pendientes
              </>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(balances).map(([member, balance]) => (
              <div key={member} className={`text-center p-4 rounded-xl border ${
                member === currentUserName 
                  ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700' 
                  : 'bg-slate-50 border-slate-200 dark:bg-gray-800 dark:border-gray-700'
              }`}>
                <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">👤</span>
                </div>
                <h4 className={`font-semibold mb-1 ${
                  member === currentUserName 
                    ? 'text-indigo-900 dark:text-indigo-100' 
                    : 'text-slate-900 dark:text-gray-100'
                }`}>
                  {member === currentUserName ? 'Tú' : member}
                </h4>
                <div className={`text-lg font-bold ${
                  balance > 0.01 ? 'text-green-600 dark:text-green-400' : 
                  balance < -0.01 ? 'text-red-600 dark:text-red-400' : 
                  'text-slate-500 dark:text-gray-400'
                }`}>
                  {balance > 0.01 ? '+' : ''}€{balance.toFixed(2)}
                </div>
                <div className="text-xs text-slate-600 dark:text-gray-400">
                  {balance > 0.01 ? 'Le deben' : 
                   balance < -0.01 ? 'Debe' : 
                   'Saldado'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Análisis personalizado para el usuario actual */}
        {!isSettled && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 text-indigo-600 mr-2" />
              Tu situación en el grupo
            </h3>
            
            <div className="space-y-4">
              {/* Lo que debes */}
              {userMetrics.owes > 0.01 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Te quedan por pagar: €{userMetrics.owes.toFixed(2)}
                  </h4>
                  <div className="space-y-2">
                    {debtDetails.map((debt, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-red-700 dark:text-red-300">
                          A {debt.to}: €{debt.amount.toFixed(2)}
                        </span>
                        <span className="text-red-600 dark:text-red-400 text-xs">
                          {debt.expense}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lo que te deben */}
              {userMetrics.paid > (totalExpenses / group.members.length) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Te deben: €{(userMetrics.paid - (totalExpenses / group.members.length)).toFixed(2)}
                  </h4>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Has pagado más de tu parte justa
                  </div>
                </div>
              )}

              {/* Estado neutral */}
              {userMetrics.owes <= 0.01 && userMetrics.paid <= (totalExpenses / group.members.length) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Estás al día
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    No debes ni te deben dinero
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transferencias necesarias */}
        {transfers.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 flex items-center">
              <ArrowRight className="w-6 h-6 text-indigo-600 mr-2" />
              Transferencias para saldar
            </h3>
            <div className="space-y-3">
              {transfers.map((transfer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-600 dark:to-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-gray-100">
                        {transfer.from}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-gray-400">
                        paga a {transfer.to}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-xl font-bold text-slate-900 dark:text-gray-100">
                      €{transfer.amount.toFixed(2)}
                    </div>
                    <ArrowRight className="w-5 h-5 text-indigo-600" />
                    <div className="w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-600 dark:to-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="text-sm text-indigo-800 dark:text-indigo-200">
                💡 <strong>Tip:</strong> Estas son las transferencias mínimas necesarias para saldar todas las cuentas del grupo.
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas por categoría */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 flex items-center">
            <BarChart3 className="w-6 h-6 text-indigo-600 mr-2" />
            Gastos por categoría
          </h3>
          
          {(() => {
            const categoryStats = {}
            group.expenses.filter(expense => expense.amount > 0).forEach(expense => {
              const category = categories[expense.category] || { name: 'Otros', emoji: '📦' }
              if (!categoryStats[expense.category]) {
                categoryStats[expense.category] = {
                  name: category.name,
                  emoji: category.emoji,
                  total: 0,
                  count: 0
                }
              }
              categoryStats[expense.category].total += expense.amount
              categoryStats[expense.category].count += 1
            })
            
            const sortedCategories = Object.entries(categoryStats)
              .sort(([,a], [,b]) => b.total - a.total)
            
            return (
              <div className="space-y-3">
                {sortedCategories.map(([categoryKey, stats]) => (
                  <div key={categoryKey} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
                        <span className="text-lg">{stats.emoji}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-gray-100">{stats.name}</div>
                        <div className="text-sm text-slate-600 dark:text-gray-400">{stats.count} gasto{stats.count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-gray-100">€{stats.total.toFixed(2)}</div>
                      <div className="text-sm text-slate-600 dark:text-gray-400">
                        {((stats.total / totalExpenses) * 100).toFixed(1)}% del total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {/* Estadísticas por miembro */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 flex items-center">
            <Users className="w-6 h-6 text-indigo-600 mr-2" />
            Gastos por miembro
          </h3>
          
          {(() => {
            const memberStats = {}
            group.members.forEach(member => {
              memberStats[member] = {
                paid: 0,
                count: 0
              }
            })
            
            group.expenses.filter(expense => expense.amount > 0).forEach(expense => {
              if (memberStats[expense.paidBy]) {
                memberStats[expense.paidBy].paid += expense.amount
                memberStats[expense.paidBy].count += 1
              }
            })
            
            const sortedMembers = Object.entries(memberStats)
              .sort(([,a], [,b]) => b.paid - a.paid)
            
            return (
              <div className="space-y-3">
                {sortedMembers.map(([member, stats]) => (
                  <div key={member} className={`flex items-center justify-between p-4 rounded-xl border ${
                    member === currentUserName 
                      ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700' 
                      : 'bg-slate-50 border-slate-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <div className={`font-medium ${
                          member === currentUserName 
                            ? 'text-indigo-900 dark:text-indigo-100' 
                            : 'text-slate-900 dark:text-gray-100'
                        }`}>
                          {member === currentUserName ? 'Tú' : member}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-gray-400">{stats.count} gasto{stats.count !== 1 ? 's' : ''} pagado{stats.count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        member === currentUserName 
                          ? 'text-indigo-900 dark:text-indigo-100' 
                          : 'text-slate-900 dark:text-gray-100'
                      }`}>€{stats.paid.toFixed(2)}</div>
                      <div className="text-sm text-slate-600 dark:text-gray-400">
                        {((stats.paid / totalExpenses) * 100).toFixed(1)}% del total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>
    )
  }



  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{group.name}</h1>
              <p className="text-sm sm:text-base text-slate-600">
                {group.members.length} miembros • {group.expenses.length} gastos
              </p>
            </div>
          </div>
        </div>
        

      </div>





      {/* Estadísticas del grupo - Mis gastos y totales */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 dark:text-gray-100">€{totalExpenses.toFixed(2)}</span>
              <span className="text-xs text-slate-500 dark:text-gray-400">Gastos totales</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-3 h-3 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 dark:text-gray-100">€{userMetrics.paid.toFixed(2)}</span>
              <span className="text-xs text-slate-500 dark:text-gray-400">Mis gastos</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 dark:text-gray-100">
                €{group.members.length > 0 ? (totalExpenses / group.members.length).toFixed(2) : '0.00'}
              </span>
              <span className="text-xs text-slate-500 dark:text-gray-400">Por persona</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-red-600 dark:text-red-400">€{userMetrics.owes.toFixed(2)}</span>
              <span className="text-xs text-slate-500 dark:text-gray-400">Me queda por pagar</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${
              isSettled 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-amber-500 to-orange-600'
            }`}>
              {isSettled ? (
                <CheckCircle className="w-3 h-3 text-white" />
              ) : (
                <XCircle className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <span className={`font-medium ${isSettled ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isSettled ? 'Saldado' : 'Pendiente'}
              </span>
              <span className="text-xs text-slate-500 dark:text-gray-400">Estado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'expenses'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600'
            }`}
          >
            Gastos ({group.expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600'
            }`}
          >
            Análisis
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600'
            }`}
          >
            Miembros ({group.members.length})
          </button>
          {group.memberSlots && group.memberSlots.length > 0 && (
            <button
              onClick={() => setActiveTab('invites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'invites'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600'
              }`}
            >
              Invitaciones
            </button>
          )}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className="animate-fade-in">
        {activeTab === 'expenses' && <ExpensesList />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'members' && <MembersTab />}
        {activeTab === 'invites' && <GroupInviteDisplay group={group} />}
      </div>

      {/* Modal: Registrar pago */}
      {settleForExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={()=>setSettleForExpense(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Registrar pago</h3>
            <p className="text-sm text-slate-600 mb-4">Selecciona quién ya ha saldado su parte.</p>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-500">{selectedSettled.length}/{(settleForExpense.splitBetween || []).length} saldados</div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={()=>setSelectedSettled(settleForExpense.splitBetween || [])}>Todos</button>
                <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={()=>setSelectedSettled([])}>Ninguno</button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(settleForExpense.splitBetween || []).map(member => {
                const checked = selectedSettled.includes(member)
                const share = (settleForExpense.amount || 0) / Math.max(1, (settleForExpense.splitBetween || []).length)
                return (
                  <label key={member} className={`flex items-center justify-between gap-3 p-2 rounded-lg border ${checked ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e)=>{
                          const next = e.target.checked
                            ? Array.from(new Set([...selectedSettled, member]))
                            : selectedSettled.filter(m => m !== member)
                          setSelectedSettled(next)
                        }}
                        className="w-5 h-5 text-indigo-600 border-slate-300 rounded"
                      />
                      <span className="text-slate-800">{member}</span>
                    </div>
                    <div className={`text-sm font-medium ${checked ? 'text-green-700' : 'text-slate-700'}`}>€{share.toFixed(2)}</div>
                  </label>
                )
              })}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-secondary" onClick={()=>setSettleForExpense(null)}>Cancelar</button>
              <button className="btn-primary disabled:opacity-60" disabled={(function(){ const orig = Array.isArray(settleForExpense.settledBy) ? settleForExpense.settledBy : []; if (orig.length !== selectedSettled.length) return false; const a=[...orig].sort().join('|'); const b=[...selectedSettled].sort().join('|'); return a===b; })()} onClick={()=>{
                if (onSettleExpense) {
                  onSettleExpense(group.id, settleForExpense.id, selectedSettled)
                } else {
                  const original = Array.isArray(settleForExpense.settledBy) ? settleForExpense.settledBy : []
                  const toAdd = selectedSettled.filter(m => !original.includes(m))
                  const toRemove = original.filter(m => !selectedSettled.includes(m))
                  toAdd.forEach(m => onToggleSettled && onToggleSettled(group.id, settleForExpense.id, m, true))
                  toRemove.forEach(m => onToggleSettled && onToggleSettled(group.id, settleForExpense.id, m, false))
                }
                setSettleForExpense(null)
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupDetails
