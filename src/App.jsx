import React, { useState } from 'react'
import { User, Users, Plus, BarChart3, Target, Settings as SettingsIcon, UserPlus } from 'lucide-react'
import PersonalView from './components/PersonalView'
import GroupsView from './components/GroupsView'
import AdvancedAnalytics from './components/AdvancedAnalytics'
import BudgetSystem from './components/BudgetSystem'
import AddExpenseModal from './components/AddExpenseModal'
import AddGroupModal from './components/AddGroupModal'
import SettingsModal from './components/SettingsModal'
import FriendsView from './components/FriendsView'
import MobileNav from './components/MobileNav'
import Toast from './components/Toast'
import { useAppState } from './hooks/useAppState'
import { useUserSettings } from './hooks/useUserSettings'

const CATEGORIES = {
  food: { name: 'Comida', emoji: '🍕', color: 'orange' },
  transport: { name: 'Transporte', emoji: '🚗', color: 'blue' },
  entertainment: { name: 'Ocio', emoji: '🎮', color: 'purple' },
  shopping: { name: 'Compras', emoji: '🛍️', color: 'pink' },
  bills: { name: 'Facturas', emoji: '💡', color: 'red' },
  other: { name: 'Otros', emoji: '📦', color: 'gray' }
}

function App({ user, logout }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [toast, setToast] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  
  const {
    personalExpenses,
    groups,
    budgets,
    groupInvites,
    recurringPayments,
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
    addGroup,
    addGroupExpense,
    updateGroupExpense,
    deleteGroupExpense,
    getPersonalStats,
    getGroupBalance,
    getMinimalTransfers,
    inviteUserToGroup,
    acceptGroupInvite,
    joinGroupById,
    setBudget,
    suggestCategory,
    detectRecurringExpenses,
    addRecurringPayment,
    deleteRecurringPayment,
    markRecurringAsPaid,
    getUnifiedExpenses,
    getReceivablesSummary,
    getPayablesSummary
  } = useAppState(user)

  const { settings, saveSettings, formatCurrency } = useUserSettings(user)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAddExpense = async (expense) => {
    try {
      if (selectedGroup) {
        await addGroupExpense(selectedGroup.id, expense)
        showToast('Gasto grupal añadido correctamente')
      } else {
        await addPersonalExpense(expense)
        showToast('Gasto personal añadido correctamente')
      }

      // Si es recurrente, guardar configuración de pago recurrente
      if (expense.isRecurring) {
        try {
          if (selectedGroup) {
            await addGroupRecurringPayment(selectedGroup.id, {
              description: expense.description,
              amount: expense.amount,
              category: expense.category,
              frequency: expense.recurringFrequency || 'monthly',
              nextDate: expense.recurringNextDate || expense.date,
              paidBy: expense.paidBy,
              splitBetween: expense.splitBetween,
              active: true,
            })
          } else {
            await addRecurringPayment({
              description: expense.description,
              amount: expense.amount,
              category: expense.category,
              frequency: expense.recurringFrequency || 'monthly',
              nextDate: expense.recurringNextDate || expense.date,
              active: true,
            })
          }
          showToast('Pago recurrente guardado')
        } catch (e) {
          console.error('Error al guardar pago recurrente', e)
          showToast('No se pudo guardar el pago recurrente', 'error')
        }
      }
      setShowAddExpense(false)
    } catch (err) {
      console.error('Error al añadir gasto', err)
      showToast('Error al añadir el gasto. Revisa las reglas de Firestore.', 'error')
    }
  }

  const handleAddGroup = async (group) => {
    try {
      await addGroup(group)
      showToast('Grupo creado correctamente')
      setShowAddGroup(false)
    } catch (err) {
      console.error('Error al crear grupo', err)
      showToast('Error al crear el grupo. Revisa las reglas de Firestore.', 'error')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <h1 className="text-2xl font-bold text-gradient">SplitGo</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600 hidden sm:inline">{user?.email || user?.displayName}</span>
              <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-100 rounded-lg" title="Ajustes">
                <SettingsIcon className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => setShowLogoutConfirm(true)} className="btn-secondary py-2">Salir</button>
            </div>
            
            <nav className="hidden sm:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('personal')}
                className={`nav-tab ${activeTab === 'personal' ? 'active' : ''}`}
              >
                <User className="w-5 h-5 mr-2" />
                Personal
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`nav-tab ${activeTab === 'groups' ? 'active' : ''}`}
              >
                <Users className="w-5 h-5 mr-2" />
                Grupos
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`nav-tab ${activeTab === 'budgets' ? 'active' : ''}`}
              >
                <Target className="w-5 h-5 mr-2" />
                Presupuestos
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`nav-tab ${activeTab === 'friends' ? 'active' : ''}`}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Amigos
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto pb-24 sm:pb-0 pb-safe"
        onTouchStart={(e)=>{ window.__swipeX = e.touches[0].clientX; window.__swipeY = e.touches[0].clientY; }}
        onTouchEnd={(e)=>{
          const startX = window.__swipeX, startY = window.__swipeY
          if (startX == null) return
          const dx = e.changedTouches[0].clientX - startX
          const dy = e.changedTouches[0].clientY - startY
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
            const tabs = ['personal','groups','analytics','budgets','friends']
            const idx = tabs.indexOf(activeTab)
            if (dx < 0 && idx < tabs.length - 1) setActiveTab(tabs[idx+1])
            if (dx > 0 && idx > 0) setActiveTab(tabs[idx-1])
          }
          window.__swipeX = null; window.__swipeY = null
        }}
      >
        {activeTab === 'personal' && (
          <PersonalView
            expenses={personalExpenses}
            categories={CATEGORIES}
            stats={getPersonalStats()}
            onAddExpense={() => {
              setSelectedGroup(null)
              setShowAddExpense(true)
            }}
            onEditExpense={async (id, updates) => {
              try {
                await updatePersonalExpense(id, updates)
                showToast('Gasto actualizado')
              } catch (e) { showToast('Error al actualizar', 'error') }
            }}
            onDeleteExpense={async (id) => {
              try {
                await deletePersonalExpense(id)
                showToast('Gasto eliminado')
              } catch (e) { showToast('Error al eliminar', 'error') }
            }}
            formatCurrency={formatCurrency}
            unifiedExpenses={getUnifiedExpenses()}
            receivables={getReceivablesSummary()}
            payables={getPayablesSummary()}
          />
        )}
        
        {activeTab === 'groups' && (
          <GroupsView
            groups={groups}
            categories={CATEGORIES}
            onAddGroup={() => setShowAddGroup(true)}
            onAddExpense={(group) => {
              setSelectedGroup(group)
              setShowAddExpense(true)
            }}
            getGroupBalance={getGroupBalance}
            getMinimalTransfers={getMinimalTransfers}
            formatCurrency={formatCurrency}
            groupInvites={groupInvites}
            inviteUserToGroup={inviteUserToGroup}
            acceptGroupInvite={acceptGroupInvite}
            user={user}
            onDeleteExpense={async (groupId, expenseId)=>{
              try { await deleteGroupExpense(groupId, expenseId); showToast('Gasto eliminado') } catch { showToast('Error al eliminar', 'error') }
            }}
            onEditExpense={(groupId, expense)=>{
              setSelectedGroup(groups.find(g => g.id === groupId) || null)
              setShowAddExpense(true)
            }}
            onToggleSettled={async (groupId, expenseId, member, nextState)=>{
              try {
                const group = groups.find(g => g.id === groupId)
                const expense = group?.expenses.find(e => e.id === expenseId)
                if (!expense) return
                const current = Array.isArray(expense.settledBy) ? expense.settledBy : []
                const updated = nextState ? Array.from(new Set([...current, member])) : current.filter(m => m !== member)
                await updateGroupExpense(groupId, expenseId, { settledBy: updated })
              } catch (e) {
                console.error(e)
                showToast('No se pudo actualizar el estado', 'error')
              }
            }}
            onSettleExpense={async (groupId, expenseId, settledList)=>{
              try {
                await updateGroupExpense(groupId, expenseId, { settledBy: settledList })
                showToast('Pagos registrados')
              } catch (e) {
                console.error(e)
                showToast('No se pudo registrar el pago', 'error')
              }
            }}
            joinGroupById={joinGroupById}
          />
        )}
        
        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdvancedAnalytics
              expenses={personalExpenses}
              categories={CATEGORIES}
              formatCurrency={formatCurrency}
              recurringExpenses={detectRecurringExpenses()}
              configuredRecurring={recurringPayments}
              onAddRecurring={addRecurringPayment}
              onDeleteRecurring={deleteRecurringPayment}
              onMarkPaid={markRecurringAsPaid}
            />
          </div>
        )}
        
        {activeTab === 'budgets' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <BudgetSystem
              expenses={personalExpenses}
              categories={CATEGORIES}
              formatCurrency={formatCurrency}
              budgets={budgets}
              onSetBudget={setBudget}
            />
          </div>
        )}

        {activeTab === 'friends' && (
          <FriendsView user={user} formatCurrency={formatCurrency} showToast={showToast} />
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          if (activeTab === 'personal' || activeTab === 'analytics') {
            setSelectedGroup(null)
            setShowAddExpense(true)
          } else if (activeTab === 'groups') {
            setShowAddGroup(true)
          } else if (activeTab === 'budgets') {
            // En presupuestos no hay FAB específico, se manejan desde el componente
            return
          } else if (activeTab === 'friends') {
            return
          }
        }}
        className={`fixed bottom-6 sm:bottom-6 bottom-24 right-6 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 flex items-center justify-center z-20 ${
          (activeTab === 'budgets' || activeTab === 'friends') ? 'hidden' : ''
        }`}
        style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Mobile nav */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} language={settings.language || 'es'} />

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          categories={CATEGORIES}
          group={selectedGroup}
          onAdd={handleAddExpense}
          onClose={() => setShowAddExpense(false)}
          suggestCategory={suggestCategory}
        />
      )}

      {showAddGroup && (
        <AddGroupModal
          onAdd={handleAddGroup}
          onClose={() => setShowAddGroup(false)}
        />
      )}

      {/* Settings */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Confirmación de salida */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={()=>setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e)=>e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">¿Cerrar sesión?</h2>
            <p className="text-sm text-slate-600 mb-4">Tendrás que iniciar sesión de nuevo para acceder a tus datos.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={()=>setShowLogoutConfirm(false)}>Cancelar</button>
              <button className="btn-danger" onClick={()=>{ setShowLogoutConfirm(false); logout(); }}>Salir</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
