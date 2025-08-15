import React, { useEffect, useState } from 'react'
import { t } from '../lib/i18n'
import { User, Users, BarChart3, UserPlus, Plus } from 'lucide-react'

function MobileNav({ 
  activeTab, 
  setActiveTab, 
  language = 'es',
  onAddExpense,
  onAddGroup,
  selectedGroup
}) {
  const [labels, setLabels] = useState({ personal: 'Personal', groups: 'Grupos', analytics: 'Analytics', friends: 'Amigos' })

  useEffect(() => {
    setLabels({
      personal: t(language, 'nav.personal'),
      groups: t(language, 'nav.groups'),
      analytics: t(language, 'nav.analytics'),
      friends: t(language, 'nav.friends'),
    })
  }, [language])
  const Item = ({ tab, label, Icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors duration-200 ${
        activeTab === tab ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-gray-400'
      }`}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[11px] mt-1">{label}</span>
    </button>
  )

  const handleAddAction = () => {
    if (activeTab === 'personal' || activeTab === 'analytics') {
      onAddExpense && onAddExpense()
    } else if (activeTab === 'groups') {
      if (selectedGroup) {
        // Pasar el grupo seleccionado para mantener el contexto
        onAddExpense && onAddExpense(selectedGroup)
      } else {
        onAddGroup && onAddGroup()
      }
    }
    // En 'friends' no hay acción de agregar
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 z-50 sm:hidden mobile-nav-always-visible transition-colors duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-5 py-2 overflow-x-hidden">
        <Item tab="personal" label={labels.personal} Icon={User} />
        <Item tab="groups" label={labels.groups} Icon={Users} />
        
        {/* Botón de agregar en el centro */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleAddAction}
            disabled={activeTab === 'friends'}
            className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center relative ${
              activeTab === 'friends' 
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
            style={{ marginTop: '-1rem' }}
            aria-label={
              selectedGroup && activeTab === 'groups' 
                ? `Agregar gasto a ${selectedGroup.name}` 
                : activeTab === 'groups' 
                  ? 'Crear grupo' 
                  : 'Agregar gasto'
            }
            title={
              selectedGroup && activeTab === 'groups' 
                ? `Agregar gasto a ${selectedGroup.name}` 
                : activeTab === 'groups' 
                  ? 'Crear grupo' 
                  : 'Agregar gasto'
            }
          >
            <Plus className="w-6 h-6" />
            {/* Indicador de contexto */}
            {selectedGroup && activeTab === 'groups' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Users className="w-2 h-2 text-white" />
              </div>
            )}
          </button>
        </div>
        
        <Item tab="analytics" label={labels.analytics} Icon={BarChart3} />
        <Item tab="friends" label={labels.friends} Icon={UserPlus} />
      </div>
    </nav>
  )
}

export default MobileNav


