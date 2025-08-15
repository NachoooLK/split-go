import React, { useMemo, useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Eye, EyeOff, Key } from 'lucide-react'
import { LANG_OPTIONS } from '../lib/i18n'

function SettingsModal({ open, onClose, settings, onSave, currencies = ['EUR','USD','MXN','COP','ARS','CLP'] }) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || 'AIzaSyCdECa_ugdOp-pa06hY0VRNITfIRNn0EA4')
  
  // Guardar automáticamente la API key si no existe en localStorage
  useEffect(() => {
    if (!localStorage.getItem('gemini_api_key') && geminiApiKey) {
      localStorage.setItem('gemini_api_key', geminiApiKey)
    }
  }, [geminiApiKey])
  
  if (!open) return null
  const languageCodes = ['es','en']

  const handleSaveApiKey = () => {
    if (geminiApiKey.trim()) {
      localStorage.setItem('gemini_api_key', geminiApiKey.trim())
    } else {
      localStorage.removeItem('gemini_api_key')
    }
  }

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
  const languageOptions = useMemo(() => LANG_OPTIONS.filter(o => languageCodes.includes(o.code)), [])
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

            {/* Google Generative AI API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>API Key de Google Generative AI</span>
              </label>
              <p className="text-xs text-slate-600 dark:text-gray-400 mb-3">
                Necesaria para la función de escanear tickets. 
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
                >
                  Obtén tu API key aquí
                </a>
              </p>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  onBlur={handleSaveApiKey}
                  placeholder="Ingresa tu API key de Google Generative AI"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {geminiApiKey && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ API key configurada correctamente
                </p>
              )}
              {!geminiApiKey && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  ⚠️ La función de escanear tickets no estará disponible sin API key
                </p>
              )}
              {geminiApiKey === 'AIzaSyCdECa_ugdOp-pa06hY0VRNITfIRNn0EA4' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  🎉 API key preconfigurada - ¡Lista para usar!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal


