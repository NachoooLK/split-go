import React, { useMemo } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { LANG_OPTIONS } from '../lib/i18n'

function SettingsModal({ open, onClose, settings, onSave, currencies = ['EUR','USD','MXN','COP','ARS','CLP'] }) {
  
  // Mover hooks antes del return condicional para evitar violación de reglas de hooks
  const languageCodes = ['es','en']
  const languageOptions = useMemo(() => LANG_OPTIONS.filter(o => languageCodes.includes(o.code)), [])
  
  const getLanguageEndonym = (code) => {
    try {
      // Try to render the language name in its own language (endonym)
      const dn = new Intl.DisplayNames([code], { type: 'language' })
      const name = dn.of(code)
      if (name && typeof name === 'string') return name.charAt(0).toUpperCase() + name.slice(1)
    } catch {}
    try {
      // Fallback to current UI language
      const dn2 = new Intl.DisplayNames([settings.language || 'es'], { type: 'language' })
      const name2 = dn2.of(code)
      if (name2 && typeof name2 === 'string') return name2.charAt(0).toUpperCase() + name2.slice(1)
    } catch {}
    return code
  }


  
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content overflow-x-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-scale-in transition-colors duration-200 overflow-x-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Ajustes</h2>
            <button onClick={onClose} className="btn-secondary py-2">Cerrar</button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Moneda</label>
              <select value={settings.currency} onChange={(e) => onSave({ currency: e.target.value })} className="input-field">
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Separador decimal</label>
              <select value={settings.decimal} onChange={(e) => onSave({ decimal: e.target.value })} className="input-field">
                <option value="comma">Coma (1.234,56)</option>
                <option value="dot">Punto (1,234.56)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Idioma</label>
              <select value={settings.language || 'es'} onChange={(e) => onSave({ language: e.target.value })} className="input-field">
                {languageOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">Tema</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => onSave({ theme: 'light' })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    settings.theme === 'light' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                      : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 text-slate-600 dark:text-gray-400'
                  }`}
                >
                  <Sun className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Claro</span>
                </button>
                <button
                  onClick={() => onSave({ theme: 'dark' })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    settings.theme === 'dark' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                      : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 text-slate-600 dark:text-gray-400'
                  }`}
                >
                  <Moon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Oscuro</span>
                </button>
                <button
                  onClick={() => onSave({ theme: 'auto' })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    settings.theme === 'auto' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                      : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 text-slate-600 dark:text-gray-400'
                  }`}
                >
                  <Monitor className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Auto</span>
                </button>
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal


