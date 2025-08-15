import React, { useEffect, useState } from 'react'
import { User, Users, Plus, BarChart3, Settings as SettingsIcon, UserPlus } from 'lucide-react'
import PersonalView from './components/PersonalView'
import GroupsView from './components/GroupsView'
import AdvancedAnalytics from './components/AdvancedAnalytics'
import AddExpenseModal from './components/AddExpenseModal'
import AddGroupModal from './components/AddGroupModal'
import SettingsModal from './components/SettingsModal'
import FriendsView from './components/FriendsView'
import MobileNav from './components/MobileNav'
import Toast from './components/Toast'
import InviteLinkHandler from './components/InviteLinkHandler'
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
    joinGroupByInviteLink,
    joinGroupBySpecificLink,
    joinGroupByGeneralLink,
    acceptGroupInvite,
    joinGroupById,
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

  // Autofill de invitación desde URL: cambiar a pestaña Amigos
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('invite') || params.has('uid') || params.has('friend')) {
        setActiveTab('friends')
      }
    } catch {}
  }, [])

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
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-gray-700/60 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <h1 className="text-2xl font-bold text-gradient dark:text-white">SplitGo</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600 dark:text-gray-300 hidden sm:inline">{user?.email || user?.displayName}</span>
              <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200" title="Ajustes">
                <SettingsIcon className="w-5 h-5 text-slate-600 dark:text-gray-300" />
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
        className="flex-1 overflow-y-auto overflow-x-hidden pb-24 sm:pb-0 pb-safe"
        onTouchStart={(e)=>{ window.__swipeX = e.touches[0].clientX; window.__swipeY = e.touches[0].clientY; }}
        onTouchEnd={(e)=>{
          const startX = window.__swipeX, startY = window.__swipeY
          if (startX == null) return
          const dx = e.changedTouches[0].clientX - startX
          const dy = e.changedTouches[0].clientY - startY
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
            const tabs = ['personal','groups','analytics','friends']
            const idx = tabs.indexOf(activeTab)
            if (dx < 0 && idx < tabs.length - 1) setActiveTab(tabs[idx+1])
            if (dx > 0 && idx > 0) setActiveTab(tabs[idx-1])
          }
          window.__swipeX = null; window.__swipeY = null
        }}
      >
        {activeTab === 'personal' && (
          <PersonalView
            expenses={(function(){ const u = getUnifiedExpenses(); return u; })()}
            categories={CATEGORIES}
            stats={(function(){
              const list = getUnifiedExpenses()
              const now = new Date()
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
              const total = list.reduce((s, e) => s + (Number(e.amount) || 0), 0)
              const monthly = list.filter(e => (e.date instanceof Date ? e.date : new Date(e.date)) >= startOfMonth)
                .reduce((s, e) => s + (Number(e.amount) || 0), 0)
              const average = list.length ? total / list.length : 0
              return { total: total.toFixed(2), monthly: monthly.toFixed(2), count: list.length, average: average.toFixed(2) }
            })()}
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
    
            acceptGroupInvite={acceptGroupInvite}
            user={user}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
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
            if (selectedGroup) {
              // Mantener el grupo seleccionado para agregar gasto al grupo
              setShowAddExpense(true)
            } else {
              setShowAddGroup(true)
            }
          } else if (activeTab === 'friends') {
            return
          }
        }}
        className={`fixed right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center z-40 hidden sm:flex ${
          activeTab === 'friends' ? 'hidden sm:hidden' : ''
        }`}
        style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
        title={selectedGroup ? `Agregar gasto a ${selectedGroup.name}` : activeTab === 'groups' ? 'Crear grupo' : 'Agregar gasto personal'}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile nav */}
      <MobileNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        language={settings.language || 'es'}
        onAddExpense={(group = null) => {
          if (group) {
            setSelectedGroup(group)
          } else if (activeTab === 'personal' || activeTab === 'analytics') {
            setSelectedGroup(null)
          }
          // Si estamos en groups y hay selectedGroup, mantenerlo
          setShowAddExpense(true)
        }}
        onAddGroup={() => setShowAddGroup(true)}
        selectedGroup={selectedGroup}
      />

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          categories={CATEGORIES}
          group={selectedGroup}
          onAdd={handleAddExpense}
          onClose={() => setShowAddExpense(false)}
          suggestCategory={suggestCategory}
          user={user}
        />
      )}

      {showAddGroup && (
        <AddGroupModal
          onAdd={handleAddGroup}
          onClose={() => setShowAddGroup(false)}
          user={user}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={()=>setShowLogoutConfirm(false)}>
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
      {/* Invite Link Handler */}
      <InviteLinkHandler 
        user={user}
        onJoinSuccess={async (joinData, inviteType) => {
          try {
            if (inviteType === 'general') {
              await joinGroupByGeneralLink(joinData)
              setToast({ message: `¡Te has unido al grupo como "${joinData.userName}"!`, type: 'success' })
            } else {
              await joinGroupBySpecificLink(joinData)
              setToast({ message: '¡Te has unido al grupo exitosamente!', type: 'success' })
            }
            // Switch to groups tab to show the new group
            setActiveTab('groups')
          } catch (error) {
            console.error('Join error:', error)
            setToast({ message: 'Error al unirse al grupo', type: 'error' })
          }
        }}
      />

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
