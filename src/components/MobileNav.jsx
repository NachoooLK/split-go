import React, { useEffect, useState } from 'react'
import { t } from '../lib/i18n'
import { User, Users, BarChart3, Target, UserPlus } from 'lucide-react'

function MobileNav({ activeTab, setActiveTab, language = 'es' }) {
  const [labels, setLabels] = useState({ personal: 'Personal', groups: 'Grupos', analytics: 'Analytics', budgets: 'Presupuestos', friends: 'Amigos' })

  useEffect(() => {
    setLabels({
      personal: t(language, 'nav.personal'),
      groups: t(language, 'nav.groups'),
      analytics: t(language, 'nav.analytics'),
      budgets: t(language, 'nav.budgets'),
      friends: t(language, 'nav.friends'),
    })
  }, [language])
  const Item = ({ tab, label, Icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex flex-col items-center justify-center py-2 ${activeTab === tab ? 'text-indigo-600' : 'text-slate-500'}`}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[11px] mt-1">{label}</span>
    </button>
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-30 sm:hidden pb-safe">
      <div className="max-w-7xl mx-auto grid grid-cols-5">
        <Item tab="personal" label={labels.personal} Icon={User} />
        <Item tab="groups" label={labels.groups} Icon={Users} />
        <Item tab="analytics" label={labels.analytics} Icon={BarChart3} />
        <Item tab="budgets" label={labels.budgets} Icon={Target} />
        <Item tab="friends" label={labels.friends} Icon={UserPlus} />
      </div>
    </nav>
  )
}

export default MobileNav


