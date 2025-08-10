import React, { useState, useMemo } from 'react'
import { Users, Plus, ArrowRight, DollarSign, Clock, CheckCircle, AlertCircle, UserPlus, Check, X, ChevronDown } from 'lucide-react'
import GroupDetails from './GroupDetails'
import { useFriends } from '../hooks/useFriends'

function GroupsView({ groups, categories, onAddGroup, onAddExpense, getGroupBalance, getMinimalTransfers, groupInvites = [], inviteUserToGroup, acceptGroupInvite, user, onDeleteExpense, joinGroupById, onEditExpense, onToggleSettled, onSettleExpense }) {
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [inviteUid, setInviteUid] = useState('')
  const [joinId, setJoinId] = useState('')
  const { friends } = useFriends(user)
  const [showFriendList, setShowFriendList] = useState(false)

  const GroupCard = ({ group }) => {
    const totalExpenses = group.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const balances = getGroupBalance(group.id)
    const hasBalances = Object.values(balances).some(balance => Math.abs(balance) > 0.01)
    
    // Determinar estado del grupo
    const isSettled = !hasBalances
    const pendingAmount = Object.values(balances)
      .filter(balance => balance < 0)
      .reduce((sum, balance) => sum + Math.abs(balance), 0)

    return (
      <div 
        className="card p-6 card-hover cursor-pointer"
        onClick={() => setSelectedGroup(group)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{group.name}</h3>
              <p className="text-sm text-slate-600">
                {group.members.length} {group.members.length === 1 ? 'miembro' : 'miembros'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSettled ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Saldado</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-amber-600">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Pendiente</span>
              </div>
            )}
          </div>
        </div>

        {/* Miembros */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm font-medium text-slate-600">Miembros:</span>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {member}
              </span>
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              €{totalExpenses.toFixed(2)}
            </div>
            <div className="text-sm text-slate-600">Total gastado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {group.expenses.length}
            </div>
            <div className="text-sm text-slate-600">Gastos</div>
          </div>
        </div>

        {/* Estado de balances */}
        {!isSettled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                €{pendingAmount.toFixed(2)} pendientes de pago
              </span>
            </div>
          </div>
        )}

        {/* Últimos gastos */}
        {group.expenses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-600">Últimos gastos:</h4>
            {group.expenses.slice(0, 2).map(expense => {
              const category = categories[expense.category]
              return (
                <div key={expense.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span>{category.emoji}</span>
                    <span className="text-slate-900">{expense.description}</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    €{expense.amount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-200">
          <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200">
            <span>Ver detalles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">👥</span>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        ¡Crea tu primer grupo!
      </h3>
      <p className="text-slate-600 mb-6">
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
        onBack={() => setSelectedGroup(null)}
        onAddExpense={onAddExpense}
        getGroupBalance={getGroupBalance}
        getMinimalTransfers={getMinimalTransfers}
        onEditExpense={(groupId, expense)=> onEditExpense && onEditExpense(groupId, expense)}
        onDeleteExpense={(groupId, expenseId)=> onDeleteExpense && onDeleteExpense(groupId, expenseId)}
        onToggleSettled={(groupId, expenseId, member, next)=> onToggleSettled && onToggleSettled(groupId, expenseId, member, next)}
        onSettleExpense={(groupId, expenseId, settledList)=> onSettleExpense && onSettleExpense(groupId, expenseId, settledList)}
        onInviteUser={(uid, groupId)=> inviteUserToGroup && inviteUserToGroup(uid, groupId)}
        friends={friends}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Grupos</h1>
          <p className="text-slate-600 mt-1">
            Gestiona gastos compartidos y divide cuentas fácilmente
          </p>
        </div>
        <button onClick={onAddGroup} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo grupo
        </button>
      </div>

      {/* Invitaciones */}
      {groupInvites.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center"><Users className="w-5 h-5 mr-2 text-indigo-600"/>Invitaciones pendientes</h3>
          <div className="space-y-3">
            {groupInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">Grupo: {inv.groupId}</div>
                  <div className="text-xs text-slate-600">Invitado por {inv.inviterUid}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-primary py-2" onClick={()=>acceptGroupInvite(inv.id, inv.groupId)}><Check className="w-4 h-4"/></button>
                  {/* Rechazo simple: eliminar documento */}
                  <button className="btn-secondary py-2" onClick={()=>acceptGroupInvite(inv.id, inv.groupId)} disabled><X className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total grupos</p>
                <p className="text-3xl font-bold text-slate-900">{groups.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total gastado</p>
                <p className="text-3xl font-bold text-slate-900">
                  €{groups.reduce((sum, group) => 
                    sum + group.expenses.reduce((expSum, exp) => expSum + exp.amount, 0), 0
                  ).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Grupos activos</p>
                <p className="text-3xl font-bold text-slate-900">
                  {groups.filter(group => {
                    const balances = getGroupBalance(group.id)
                    return Object.values(balances).some(balance => Math.abs(balance) > 0.01)
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitar por UID (o amigo) y unirse por código/ID */}
      {groups.length > 0 && (
        <div className="card p-4">
          <details>
            <summary className="list-none cursor-pointer flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-emerald-600"/>Invitar a un grupo / Unirse por código</h3>
              <ChevronDown className="w-5 h-5 text-slate-500" />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-8 gap-3 items-stretch">
            <select className="input-field md:col-span-2" defaultValue={groups[0]?.id} id="select-group-invite">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
              <div className="relative md:col-span-5">
                <input
                  className="input-field w-full"
                  placeholder="Escribe para filtrar o pega el UID"
                  value={inviteUid}
                  onChange={(e)=>setInviteUid(e.target.value)}
                  onFocus={()=>setShowFriendList(true)}
                  onBlur={()=>setTimeout(()=>setShowFriendList(false), 120)}
                />
                {showFriendList && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {(
                      (useMemo(()=>{
                        const q = (inviteUid||'').toLowerCase().trim()
                        const list = friends || []
                        const filtered = q
                          ? list.filter(f => (f.username||'').toLowerCase().includes(q) || (f.displayName||'').toLowerCase().includes(q) || (f.uid||'').toLowerCase().includes(q))
                          : list
                        return filtered.slice(0, 20)
                      }, [inviteUid, friends]))
                    ).map(f => (
                      <button
                        key={f.uid}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                        onMouseDown={(e)=>e.preventDefault()}
                        onClick={()=>{ setInviteUid(f.uid); setShowFriendList(false) }}
                      >
                        <span className="truncate mr-2">{f.username || f.displayName || f.uid}</span>
                        <span className="text-xs text-slate-500">{(f.uid||'').slice(0,6)}…</span>
                      </button>
                    ))}
                    {friends.length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500">No tienes amigos aún</div>
                    )}
                  </div>
                )}
              </div>
            <button className="btn-primary md:col-span-1" onClick={()=>{
              const gid = document.getElementById('select-group-invite').value
              inviteUserToGroup && inviteUserToGroup(inviteUid, gid)
              setInviteUid('')
            }}>Enviar invitación</button>
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 md:mt-0">
              <input className="input-field md:col-span-2" placeholder="Código/ID de grupo" value={joinId} onChange={(e)=>setJoinId(e.target.value)} />
              <button className="btn-secondary md:col-span-1" onClick={()=>{
                if (joinGroupById && joinId) { joinGroupById(joinId); setJoinId('') }
              }}>Unirme</button>
              <input className="input-field md:col-span-3" readOnly value={`${window.location.origin}/?join=${groups[0]?.id || ''}`} onFocus={(e)=>e.target.select()} />
            </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">El usuario verá la invitación en esta pantalla.</p>
          </details>
        </div>
      )}

      {/* Lista de grupos */}
      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Todos los grupos</h2>
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
