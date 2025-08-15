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
  const Item = ({ tab, label, Icon }) => {
    const isActive = activeTab === tab
    
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`relative flex-1 flex flex-col items-center justify-center py-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group ${
          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
        }`}
        aria-label={label}
      >
        {/* Indicador de fondo activo */}
        <div className={`absolute inset-x-2 inset-y-1 rounded-xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-900/30 scale-100 opacity-100' 
            : 'bg-transparent scale-95 opacity-0 group-hover:bg-slate-50 dark:group-hover:bg-gray-800 group-hover:scale-100 group-hover:opacity-100'
        }`} />
        
        {/* Indicador superior */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-600 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
          isActive 
            ? 'w-8 bg-gradient-to-r from-indigo-500 to-purple-500 scale-100 opacity-100' 
            : 'w-4 bg-slate-300 dark:bg-gray-600 scale-75 opacity-0'
        }`} />
        
        {/* Icono con animación */}
        <div className={`relative z-10 transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
          isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
        }`}>
          <Icon className={`w-5 h-5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isActive ? 'drop-shadow-sm' : 'group-hover:drop-shadow-sm'
          }`} />
          
          {/* Efecto de resplandor */}
          {isActive && (
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-20 scale-150 animate-pulse" />
          )}
        </div>
        
        {/* Texto con animación */}
        <span className={`relative z-10 text-[11px] mt-1 font-medium transition-all duration-600 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          isActive ? 'scale-105 opacity-100' : 'scale-100 opacity-75 group-hover:opacity-100'
        }`}>
          {label}
        </span>
        
        {/* Punto indicador */}
        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-800 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
          isActive 
            ? 'bg-indigo-500 scale-100 opacity-100' 
            : 'bg-slate-400 dark:bg-gray-600 scale-0 opacity-0'
        }`} />
      </button>
    )
  }

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-slate-200/50 dark:border-gray-700/50 z-50 sm:hidden mobile-nav-always-visible transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="relative max-w-7xl mx-auto grid grid-cols-5 py-2 overflow-x-hidden">
        {/* Gradiente sutil en el fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-indigo-50/5 to-transparent dark:via-indigo-900/5 pointer-events-none" />
        <Item tab="personal" label={labels.personal} Icon={User} />
        <Item tab="groups" label={labels.groups} Icon={Users} />
        
        {/* Botón de agregar en el centro */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleAddAction}
            disabled={activeTab === 'friends'}
            className={`relative w-12 h-12 rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center group ${
              activeTab === 'friends' 
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed scale-90' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:shadow-indigo-500/25 hover:scale-110 active:scale-95 hover:-translate-y-0.5'
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
            {/* Efecto de resplandor de fondo */}
            {activeTab !== 'friends' && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-md opacity-30 scale-150 group-hover:opacity-50 transition-all duration-600 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
            )}
            
            {/* Icono principal */}
            <Plus className={`relative z-10 w-6 h-6 transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
              activeTab === 'friends' ? '' : 'group-hover:rotate-90 group-active:rotate-180'
            }`} />
            
            {/* Indicador de contexto mejorado */}
            {selectedGroup && activeTab === 'groups' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md animate-bounce">
                <Users className="w-2 h-2 text-white" />
              </div>
            )}
            
            {/* Anillo de pulso para estados activos */}
            {activeTab !== 'friends' && (
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-20" />
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


