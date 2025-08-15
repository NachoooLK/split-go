import React, { useState } from 'react'
import { Users, Plus, ArrowRight, DollarSign, Clock, CheckCircle, AlertCircle, Check, X, ChevronDown } from 'lucide-react'
import GroupDetails from './GroupDetails'

function GroupsView({ groups, categories, onAddGroup, onAddExpense, getGroupBalance, getMinimalTransfers, groupInvites = [], acceptGroupInvite, user, onDeleteExpense, joinGroupById, onEditExpense, onToggleSettled, selectedGroup, setSelectedGroup, onSettleExpense }) {
  const [joinId, setJoinId] = useState('')

  const GroupCard = ({ group }) => {
    const totalExpenses = group.expenses.filter(expense => expense.amount > 0).reduce((sum, expense) => sum + expense.amount, 0)
    const balances = getGroupBalance(group.id)
    const hasBalances = Object.values(balances).some(balance => Math.abs(balance) > 0.01)
    const isSettled = !hasBalances
    const recentExpense = group.expenses[0]

    return (
      <div 
        className="group relative card p-6 card-hover cursor-pointer overflow-hidden"
        onClick={() => setSelectedGroup(group)}
      >
        {/* Status indicator */}
        <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-lg ${
          isSettled ? 'bg-green-500' : 'bg-amber-500'
        }`}></div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                <span className="text-xs font-bold text-slate-600 dark:text-gray-300">{group.members.length}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 truncate">{group.name}</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="text-lg font-bold text-slate-900 dark:text-gray-100">
              €{totalExpenses.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-400">Total gastado</div>
          </div>
          <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="text-lg font-bold text-slate-900 dark:text-gray-100">
              {group.expenses.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-400">Gastos</div>
          </div>
        </div>

        {/* Recent activity */}
        {recentExpense && (
          <div className="flex items-center justify-between py-2 px-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="text-sm">{categories[recentExpense.category]?.emoji}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300 truncate">
                {recentExpense.description}
              </span>
            </div>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              €{recentExpense.amount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            {isSettled ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Todo saldado</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Pendientes</span>
              </>
            )}
          </div>
          <div className="flex -space-x-1">
            {group.members.slice(0, 3).map((member, index) => (
              <div 
                key={index}
                className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-medium text-white border-2 border-white dark:border-gray-800"
                title={member}
              >
                {member.charAt(0).toUpperCase()}
              </div>
            ))}
            {group.members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                +{group.members.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">👥</span>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
        ¡Crea tu primer grupo!
      </h3>
      <p className="text-slate-600 dark:text-gray-400 mb-6">
        Organiza gastos compartidos con amigos, familia o compañeros de trabajo
      </p>
      <button onClick={onAddGroup} className="btn-primary">
        <Plus className="w-5 h-5 mr-2" />
        Crear grupo
      </button>
    </div>
  )

  if (selectedGroup) {
    return (
      <GroupDetails
        group={selectedGroup}
        categories={categories}
        user={user}
        onBack={() => setSelectedGroup(null)}
        onAddExpense={onAddExpense}
        getGroupBalance={getGroupBalance}
        getMinimalTransfers={getMinimalTransfers}
        onEditExpense={(groupId, expense)=> onEditExpense && onEditExpense(groupId, expense)}
        onDeleteExpense={(groupId, expenseId)=> onDeleteExpense && onDeleteExpense(groupId, expenseId)}
        onToggleSettled={(groupId, expenseId, member, next)=> onToggleSettled && onToggleSettled(groupId, expenseId, member, next)}
        onSettleExpense={(groupId, expenseId, settledList)=> onSettleExpense && onSettleExpense(groupId, expenseId, settledList)}

      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-2xl p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Mis Grupos</h1>
              <p className="text-indigo-100 text-lg">
                Gestiona gastos compartidos y divide cuentas fácilmente
              </p>
            </div>
            <button 
              onClick={onAddGroup} 
              className="ml-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
              title="Crear nuevo grupo"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Elementos decorativos */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* Invitaciones */}
      {groupInvites.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">¡Tienes invitaciones!</h3>
                  <p className="text-emerald-100">{groupInvites.length} grupo{groupInvites.length !== 1 ? 's' : ''} te ha{groupInvites.length !== 1 ? 'n' : ''} invitado</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {groupInvites.map(inv => (
                <div key={inv.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Grupo: {inv.groupId}</div>
                      <div className="text-sm text-emerald-100">De: {inv.inviterUid}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="bg-white text-emerald-600 px-4 py-2 rounded-lg hover:bg-white/90 transition-colors duration-200 font-medium"
                        onClick={()=>acceptGroupInvite(inv.id, inv.groupId)}
                      >
                        Unirme
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full"></div>
        </div>
      )}

      {/* Quick overview */}
      {groups.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">{groups.length}</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Grupos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                  €{groups.reduce((sum, group) => 
                    sum + group.expenses.filter(exp => exp.amount > 0).reduce((expSum, exp) => expSum + exp.amount, 0), 0
                  ).toFixed(2)}
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                  {groups.filter(group => {
                    const balances = getGroupBalance(group.id)
                    return Object.values(balances).some(balance => Math.abs(balance) > 0.01)
                  }).length}
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Activos</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-gray-400">Tus grupos</span>
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          <div className="card p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-slate-900 dark:text-gray-100">Unirse a grupo</h3>
            </div>
            <div className="space-y-3">
              <input 
                className="input-field w-full" 
                placeholder="Código o ID de grupo" 
                value={joinId} 
                onChange={(e)=>setJoinId(e.target.value)} 
              />
              <button 
                className="btn-secondary w-full" 
                onClick={()=>{
                  if (joinGroupById && joinId) { joinGroupById(joinId); setJoinId('') }
                }}
                disabled={!joinId.trim()}
              >
                Unirme al grupo
              </button>
              <div className="text-xs text-slate-500 dark:text-gray-400 text-center">
                Pide el código al administrador del grupo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de grupos */}
      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">Todos los grupos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupsView
