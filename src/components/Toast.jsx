import React, { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!duration) return
    const t = setTimeout(() => onClose && onClose(), duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const colorClasses = {
    success: 'border-green-200 text-green-800',
    error: 'border-red-200 text-red-800',
    info: 'border-blue-200 text-blue-800',
  }[type] || 'border-slate-200 text-slate-800'

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertTriangle : Info

  return (
    <div className={`toast ${colorClasses}`} role="alert" aria-live="assertive">
      <Icon className="w-5 h-5" />
      <div className="text-sm font-medium">{message}</div>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
    </div>
  )
}

export default Toast


