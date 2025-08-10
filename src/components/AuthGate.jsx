import React, { useEffect, useState } from 'react'
import { auth } from '../lib/firebase'
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

function AuthGate({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    const password = form.get('password')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        throw err
      }
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600">Cargando…</div>
    )
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center space-y-6">
          <div>
            <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Inicia sesión</h1>
            <p className="text-slate-600">Accede para guardar tus gastos en tu cuenta</p>
          </div>
          <button onClick={signInWithGoogle} className="btn-primary w-full">Continuar con Google</button>
          <div className="text-xs text-slate-500">o usa email</div>
          <form onSubmit={handleEmail} className="space-y-3 text-left">
            <input name="email" type="email" placeholder="Email" className="input-field w-full" required />
            <input name="password" type="password" placeholder="Contraseña" className="input-field w-full" required />
            <button className="btn-secondary w-full" type="submit">Entrar / Registrar</button>
          </form>
        </div>
      </div>
    )
  }

  return typeof children === 'function' ? children({ user, logout: () => signOut(auth) }) : children
}

export default AuthGate



