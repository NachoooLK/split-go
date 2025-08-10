import React, { useState } from 'react'
import { ArrowLeft, Plus, Users, DollarSign, ArrowRight, CheckCircle, XCircle, UserPlus } from 'lucide-react'

function GroupDetails({ group, categories, onBack, onAddExpense, getGroupBalance, getMinimalTransfers, onEditExpense, onDeleteExpense, onToggleSettled, onInviteUser, friends = [], onSettleExpense }) {
  const [activeTab, setActiveTab] = useState('expenses')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteUid, setInviteUid] = useState('')
  const [settleForExpense, setSettleForExpense] = useState(null)
  const [selectedSettled, setSelectedSettled] = useState([])
  
  const balances = getGroupBalance(group.id)
  const transfers = getMinimalTransfers(group.id)
  const totalExpenses = group.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const isSettled = Object.values(balances).every(balance => Math.abs(balance) < 0.01)

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

  const BalancesList = () => (
    <div className="space-y-6">
      {/* Resumen de balances */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(balances).map(([member, balance]) => (
            <div key={member} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">👤</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">{member}</h4>
              <div className={`text-lg font-bold ${
                balance > 0.01 ? 'text-green-600' : 
                balance < -0.01 ? 'text-red-600' : 
                'text-slate-500'
              }`}>
                {balance > 0.01 ? '+' : ''}€{balance.toFixed(2)}
              </div>
              <div className="text-xs text-slate-600">
                {balance > 0.01 ? 'Le deben' : 
                 balance < -0.01 ? 'Debe' : 
                 'Saldado'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transferencias necesarias */}
      {transfers.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <ArrowRight className="w-6 h-6 text-indigo-600 mr-2" />
            Transferencias para saldar
          </h3>
          <div className="space-y-3">
            {transfers.map((transfer, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {transfer.from}
                    </div>
                    <div className="text-sm text-slate-600">
                      paga a {transfer.to}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xl font-bold text-slate-900">
                    €{transfer.amount.toFixed(2)}
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-600" />
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="text-sm text-indigo-800">
              💡 <strong>Tip:</strong> Estas son las transferencias mínimas necesarias para saldar todas las cuentas del grupo.
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{group.name}</h1>
            <p className="text-slate-600">
              {group.members.length} miembros • {group.expenses.length} gastos
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setInviteOpen(v=>!v)}
            className="btn-secondary"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Invitar
          </button>
          <button 
            onClick={() => onAddExpense(group)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir gasto
          </button>
        </div>
      </div>

      {/* Estadísticas del grupo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total gastado</p>
              <p className="text-3xl font-bold text-slate-900">€{totalExpenses.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Por persona</p>
              <p className="text-3xl font-bold text-slate-900">
                €{group.members.length > 0 ? (totalExpenses / group.members.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Estado</p>
              <p className={`text-3xl font-bold ${isSettled ? 'text-green-600' : 'text-amber-600'}`}>
                {isSettled ? 'Saldado' : 'Pendiente'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isSettled 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-amber-500 to-orange-600'
            }`}>
              {isSettled ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <XCircle className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Miembros del grupo */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Miembros del grupo</h3>
        <div className="flex flex-wrap gap-3">
          {group.members.map((member, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <span className="font-medium text-slate-900">{member}</span>
            </div>
          ))}
        </div>

        {inviteOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-stretch">
            <input list="friends-list-in-group" className="input-field md:col-span-3" placeholder="UID del usuario o elige de tus amigos" value={inviteUid} onChange={(e)=>setInviteUid(e.target.value)} />
            <datalist id="friends-list-in-group">
              {friends.map(f => (
                <option key={f.uid} value={f.uid}>{(f.username || f.displayName || f.uid)}</option>
              ))}
            </datalist>
            <button className="btn-primary md:col-span-1" onClick={()=>{ if (onInviteUser && inviteUid) { onInviteUser(inviteUid, group.id); setInviteUid(''); } }}>Enviar invitación</button>
            <input className="input-field md:col-span-2" readOnly value={`${window.location.origin}/?join=${group.id}`} onFocus={(e)=>e.target.select()} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'expenses'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Gastos ({group.expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'balances'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Balances
          </button>
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className="animate-fade-in">
        {activeTab === 'expenses' ? <ExpensesList /> : <BalancesList />}
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
