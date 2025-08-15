import React, { useState, useMemo } from 'react'
import { Users, Plus, ArrowRight, DollarSign, Clock, CheckCircle, AlertCircle, Check, X, ChevronDown, Search } from 'lucide-react'
import GroupDetails from './GroupDetails'

function GroupsView({ groups, categories, onAddGroup, onAddExpense, getGroupBalance, getMinimalTransfers, groupInvites = [], acceptGroupInvite, user, onDeleteExpense, joinGroupById, onEditExpense, onToggleSettled, selectedGroup, setSelectedGroup, onSettleExpense, onLeaveGroup }) {
  const [joinId, setJoinId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar grupos por búsqueda
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.members.some(member => member.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [groups, searchTerm])

  const GroupCard = ({ group }) => {
    const totalExpenses = group.expenses.filter(expense => expense.amount > 0).reduce((sum, expense) => sum + expense.amount, 0)
    const balances = getGroupBalance(group.id)
    const hasBalances = Object.values(balances).some(balance => Math.abs(balance) > 0.01)
    const isSettled = !hasBalances

    return (
      <div 
        className="group relative bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
        onClick={() => setSelectedGroup(group)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-gray-100 truncate">{group.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-500 dark:text-gray-400">
                  {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs font-medium text-slate-900 dark:text-gray-100">
                  €{totalExpenses.toFixed(2)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isSettled 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {isSettled ? 'Saldado' : 'Activo'}
                </span>
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
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
        onLeaveGroup={(groupId) => onLeaveGroup && onLeaveGroup(groupId)}
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
                <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">{filteredGroups.length}</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  {searchTerm ? 'Encontrados' : 'Grupos'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                  €{filteredGroups.reduce((sum, group) => 
                    sum + group.expenses.filter(exp => exp.amount > 0).reduce((expSum, exp) => expSum + exp.amount, 0), 0
                  ).toFixed(2)}
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                  {filteredGroups.filter(group => {
                    const balances = getGroupBalance(group.id)
                    return Object.values(balances).some(balance => Math.abs(balance) > 0.01)
                  }).length}
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Activos</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-gray-400">
                {searchTerm ? `Resultados para "${searchTerm}"` : 'Tus grupos'}
              </span>
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

      {/* Campo de búsqueda */}
      {groups.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar grupos por nombre o miembro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl text-slate-900 dark:text-gray-100 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      )}

      {/* Lista de grupos */}
      {groups.length === 0 ? (
        <EmptyState />
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
            No se encontraron grupos
          </h3>
          <p className="text-slate-600 dark:text-gray-400 mb-4">
            No hay grupos que coincidan con "{searchTerm}"
          </p>
          <button 
            onClick={() => setSearchTerm('')} 
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">
              {searchTerm ? `Resultados (${filteredGroups.length})` : 'Todos los grupos'}
            </h2>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredGroups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupsView
