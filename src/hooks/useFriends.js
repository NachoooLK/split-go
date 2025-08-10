import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import {
  collection,
  addDoc,
  setDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
    getDocs,
    getDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'

export function useFriends(user) {
  const [friendRequests, setFriendRequests] = useState([]) // entrantes
  const [sentRequests, setSentRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [claims, setClaims] = useState([])

  // Suscripciones
  useEffect(() => {
    if (!user) return

    const unsubIncoming = onSnapshot(
      query(collection(db, 'users', user.uid, 'friendRequests'), orderBy('createdAt', 'desc')),
      snap => setFriendRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )

    const unsubSent = onSnapshot(
      query(collection(db, 'users', user.uid, 'sentFriendRequests'), orderBy('createdAt', 'desc')),
      snap => setSentRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )

    const unsubFriends = onSnapshot(
      query(collection(db, 'users', user.uid, 'friends'), orderBy('createdAt', 'desc')),
      async (snap) => {
        const base = snap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() }))
        // Enriquecer con perfil (username/displayName) si falta
        const enriched = await Promise.all(base.map(async (f) => {
          if (f.username && f.displayName) return f
          try {
            const prof = await getDoc(doc(db, 'users', f.uid))
            if (prof.exists()) {
              const data = prof.data()
              return {
                ...f,
                username: data.username || f.username,
                displayName: data.displayName || f.displayName,
              }
            }
          } catch {}
          return f
        }))
        setFriends(enriched)
      }
    )

    const unsubClaims = onSnapshot(
      query(collection(db, 'claims'), where('participants', 'array-contains', user.uid)),
      snap => {
        // Ordenamos en el cliente para evitar requerir índice compuesto
        const claimsData = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
            return bDate.getTime() - aDate.getTime() // desc order
          })
        setClaims(claimsData)
      }
    )

    return () => {
      unsubIncoming(); unsubSent(); unsubFriends(); unsubClaims()
    }
  }, [user?.uid])

  const sendFriendRequest = async (targetUid) => {
    if (!targetUid || targetUid === user.uid) return

    // evitar duplicados básicos
    const existing = await getDocs(query(collection(db, 'users', targetUid, 'friendRequests'), where('fromUid', '==', user.uid)))
    if (!existing.empty) return

    await addDoc(collection(db, 'users', targetUid, 'friendRequests'), {
      fromUid: user.uid,
      fromName: user.displayName || user.email || 'Usuario',
      fromUsername: user.username || undefined,
      createdAt: serverTimestamp(),
      status: 'pending'
    })
    await addDoc(collection(db, 'users', user.uid, 'sentFriendRequests'), {
      toUid: targetUid,
      createdAt: serverTimestamp(),
      status: 'pending'
    })
  }

  const acceptFriendRequest = async (requestId, fromUid) => {
    // leer la solicitud para recuperar el nombre del remitente
    const reqSnap = await getDocs(query(collection(db, 'users', user.uid, 'friendRequests'), where('fromUid', '==', fromUid)))
    let fromName = ''
    let fromUsername = ''
    if (!reqSnap.empty) {
      const d = reqSnap.docs[0]
      fromName = d.data()?.fromName || ''
      fromUsername = d.data()?.fromUsername || ''
    }
    // fallback: leer perfil del remitente
    if (!fromUsername || !fromName) {
      try {
        const prof = await getDoc(doc(db, 'users', fromUid))
        if (prof.exists()) {
          const data = prof.data()
          fromUsername = fromUsername || data.username || ''
          fromName = fromName || data.displayName || ''
        }
      } catch {}
    }

    // añadir en ambos lados con nombres legibles
    await setDoc(doc(db, 'users', user.uid, 'friends', fromUid), {
      displayName: fromName || fromUid,
      username: fromUsername || undefined,
      createdAt: serverTimestamp()
    })
    await setDoc(doc(db, 'users', fromUid, 'friends', user.uid), {
      displayName: user.displayName || user.email || 'Usuario',
      username: user.username || undefined,
      createdAt: serverTimestamp()
    })
    // borrar request (por id directo)
    await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', requestId))
    // marcar sent en origen si existe
    const sentSnap = await getDocs(query(collection(db, 'users', fromUid, 'sentFriendRequests'), where('toUid', '==', user.uid)))
    for (const d of sentSnap.docs) {
      await updateDoc(doc(db, 'users', fromUid, 'sentFriendRequests', d.id), { status: 'accepted', resolvedAt: serverTimestamp() })
    }
  }

  const rejectFriendRequest = async (requestId, fromUid) => {
    await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', requestId))
    const sentSnap = await getDocs(query(collection(db, 'users', fromUid, 'sentFriendRequests'), where('toUid', '==', user.uid)))
    for (const d of sentSnap.docs) {
      await updateDoc(doc(db, 'users', fromUid, 'sentFriendRequests', d.id), { status: 'rejected', resolvedAt: serverTimestamp() })
    }
  }

  const removeFriend = async (friendUid) => {
    await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUid))
    await deleteDoc(doc(db, 'users', friendUid, 'friends', user.uid))
  }

  // Reclamaciones de pago
  const createClaim = async ({ toUid, amount, description }) => {
    if (!toUid || !amount) return
    await addDoc(collection(db, 'claims'), {
      fromUid: user.uid,
      toUid,
      amount: Number(amount),
      description: description || '',
      status: 'pending',
      participants: [user.uid, toUid],
      createdAt: serverTimestamp()
    })
  }

  const updateClaimStatus = async (claimId, status) => {
    await updateDoc(doc(db, 'claims', claimId), { status, resolvedAt: serverTimestamp(), resolvedBy: user.uid })
  }

  return {
    friendRequests,
    sentRequests,
    friends,
    claims,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    createClaim,
    updateClaimStatus,
  }
}


