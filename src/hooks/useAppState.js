import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import {
  collection,
  addDoc,
  setDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore'

export function useAppState(user) {
  const [personalExpenses, setPersonalExpenses] = useState([])
  const [groups, setGroups] = useState([])
  const [groupInvites, setGroupInvites] = useState([])
  const [recurringPayments, setRecurringPayments] = useState([])
  


  const addPersonalExpense = async (expense) => {
    const payload = {
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: Timestamp.fromDate(new Date(expense.date)),
      createdAt: serverTimestamp()
    }
    await addDoc(collection(db, 'users', user.uid, 'personalExpenses'), payload)
  }

  const updatePersonalExpense = async (expenseId, updates) => {
    const payload = { ...updates }
    if (updates.date) payload.date = Timestamp.fromDate(new Date(updates.date))
    payload.updatedAt = serverTimestamp()
    await updateDoc(doc(db, 'users', user.uid, 'personalExpenses', expenseId), payload)
  }

  const deletePersonalExpense = async (expenseId) => {
    await deleteDoc(doc(db, 'users', user.uid, 'personalExpenses', expenseId))
  }

  const addGroup = async (group) => {
    // Usar username si existe en el perfil del usuario
    let username = user.displayName || 'Tú'
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        username = snap.data().username || snap.data().displayName || username
      }
    } catch {}
    
    // Support for new slot-based system or legacy members array
    const membersList = group.memberSlots 
      ? group.memberSlots.filter(slot => slot.type === 'friend' && slot.friendUid)
          .map(slot => slot.name)
      : group.members || [username]
    
    const membersUidsList = group.memberSlots
      ? group.memberSlots.filter(slot => slot.type === 'friend' && slot.friendUid)
          .map(slot => slot.friendUid)
      : [user.uid]
    
    // Always include creator
    if (!membersList.includes(username)) {
      membersList.unshift(username)
    }
    if (!membersUidsList.includes(user.uid)) {
      membersUidsList.unshift(user.uid)
    }

    const docRef = await addDoc(collection(db, 'groups'), {
      name: group.name,
      members: membersList,
      membersUids: membersUidsList,
      memberSlots: group.memberSlots || [],
      totalMembers: group.totalMembers || membersList.length,
      generalInviteToken: group.generalInviteToken,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      inviteLinks: group.memberSlots?.filter(slot => slot.type === 'pending')
        .map(slot => ({
          slotId: slot.id,
          token: slot.inviteToken,
          name: slot.name,
          inviteType: slot.inviteType || 'specific',
          expiresAt: slot.expiresAt,
          status: 'active'
        })) || []
    })
    
    // Send friend invitations for friend slots
    const friendInvites = group.memberSlots?.filter(slot => slot.type === 'friend' && slot.friendUid) || []
    for (const slot of friendInvites) {
      try {
        await addDoc(collection(db, 'groupInvites'), {
          groupId: docRef.id,
          groupName: group.name,
          inviterUid: user.uid,
          inviterName: username,
          inviteeUid: slot.friendUid,
          slotId: slot.id,
          createdAt: serverTimestamp(),
          status: 'pending'
        })
      } catch (error) {
        console.error('Error sending friend invitation:', error)
      }
    }
    
    return docRef.id
  }

  // Unirse por enlace específico (para una persona concreta)
  const joinGroupBySpecificLink = async (joinData) => {
    const { groupId, slotId, userUid, userName, inviteToken } = joinData
    
    try {
      const groupRef = doc(db, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo no encontrado')
      }
      
      const group = groupDoc.data()
      
      // Find and verify the slot
      const targetSlot = group.memberSlots?.find(slot => 
        slot.id === slotId && 
        slot.inviteToken === inviteToken && 
        slot.status === 'unclaimed' &&
        slot.inviteType === 'specific' &&
        new Date(slot.expiresAt?.toDate?.() || slot.expiresAt) > new Date()
      )
      
      if (!targetSlot) {
        throw new Error('Enlace inválido o expirado')
      }
      
      // Update the slot as claimed
      const updatedSlots = group.memberSlots.map(slot => {
        if (slot.id === slotId) {
          return {
            ...slot,
            status: 'claimed',
            claimedBy: userUid,
            claimedAt: serverTimestamp(),
            actualName: userName
          }
        }
        return slot
      })
      
      // Add user to members lists
      const updatedMembers = [...(group.members || [])]
      const updatedMembersUids = [...(group.membersUids || [])]
      
      if (!updatedMembers.includes(targetSlot.name)) {
        updatedMembers.push(targetSlot.name)
      }
      if (!updatedMembersUids.includes(userUid)) {
        updatedMembersUids.push(userUid)
      }
      
      await updateDoc(groupRef, {
        memberSlots: updatedSlots,
        members: updatedMembers,
        membersUids: updatedMembersUids,
        updatedAt: serverTimestamp()
      })
      
      return { success: true, groupId, slotName: targetSlot.name }
    } catch (error) {
      console.error('Error joining group:', error)
      throw error
    }
  }

  // Unirse por enlace general (elegir entre slots disponibles)
  const joinGroupByGeneralLink = async (joinData) => {
    const { groupId, slotId, userUid, userName, generalToken } = joinData
    
    try {
      const groupRef = doc(db, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo no encontrado')
      }
      
      const group = groupDoc.data()
      
      // Verify general token
      if (group.generalInviteToken !== generalToken) {
        throw new Error('Enlace inválido')
      }
      
      // Find and verify the selected slot
      const targetSlot = group.memberSlots?.find(slot => 
        slot.id === slotId && 
        slot.status === 'unclaimed' &&
        slot.inviteType === 'general'
      )
      
      if (!targetSlot) {
        throw new Error('Slot no disponible')
      }
      
      // Update the slot as claimed
      const updatedSlots = group.memberSlots.map(slot => {
        if (slot.id === slotId) {
          return {
            ...slot,
            status: 'claimed',
            claimedBy: userUid,
            claimedAt: serverTimestamp(),
            actualName: userName,
            name: userName // Update the slot name to the user's chosen name
          }
        }
        return slot
      })
      
      // Add user to members lists
      const updatedMembers = [...(group.members || [])]
      const updatedMembersUids = [...(group.membersUids || [])]
      
      if (!updatedMembers.includes(userName)) {
        updatedMembers.push(userName)
      }
      if (!updatedMembersUids.includes(userUid)) {
        updatedMembersUids.push(userUid)
      }
      
      await updateDoc(groupRef, {
        memberSlots: updatedSlots,
        members: updatedMembers,
        membersUids: updatedMembersUids,
        updatedAt: serverTimestamp()
      })
      
      return { success: true, groupId, chosenName: userName }
    } catch (error) {
      console.error('Error joining group:', error)
      throw error
    }
  }

  // Función legacy mantenida para compatibilidad
  const joinGroupByInviteLink = joinGroupBySpecificLink

  const addGroupExpense = async (groupId, expense) => {
    const payload = {
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      paidBy: expense.paidBy,
      splitBetween: expense.splitBetween,
      settledBy: expense.settledBy || [],
      date: Timestamp.fromDate(new Date(expense.date)),
      createdAt: serverTimestamp(),
      // Agregar campos de división detallada si existen
      ...(expense.useDetailedSplit && {
        useDetailedSplit: expense.useDetailedSplit,
        items: expense.items || [],
        itemAssignments: expense.itemAssignments || {}
      })
    }

    await addDoc(collection(db, 'groups', groupId, 'expenses'), payload)
  }

  const updateGroupExpense = async (groupId, expenseId, updates) => {
    const payload = { ...updates }
    if (updates.date) payload.date = Timestamp.fromDate(new Date(updates.date))
    payload.updatedAt = serverTimestamp()
    await updateDoc(doc(db, 'groups', groupId, 'expenses', expenseId), payload)
  }

  const toggleGroupExpenseSettled = async (groupId, expenseId, member, isSettled) => {
    if (!groupId || !expenseId || !member) return
    const ref = doc(db, 'groups', groupId, 'expenses', expenseId)
    const payload = isSettled
      ? { settledBy: arrayUnion(member), updatedAt: serverTimestamp() }
      : { settledBy: arrayRemove(member), updatedAt: serverTimestamp() }
    await updateDoc(ref, payload)
  }

  const deleteGroupExpense = async (groupId, expenseId) => {
    await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId))
  }

  // Suscripciones a Firestore
  useEffect(() => {
    // Personal expenses
    if (!user) return

    const unsubPersonal = onSnapshot(
      query(collection(db, 'users', user.uid, 'personalExpenses'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const items = snapshot.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            description: data.description,
            amount: data.amount,
            category: data.category,
            date: data.date?.toDate ? data.date.toDate() : new Date(),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          }
        })
        setPersonalExpenses(items)
      }
    )

    // Grupos globales donde participa el usuario
    let groupExpenseUnsubs = []
    const unsubGroups = onSnapshot(
      // Escuchar grupos donde participa el usuario
      query(collection(db, 'groups'), where('membersUids', 'array-contains', user.uid)),
      async (snapshot) => {
        const baseGroups = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        // Orden en cliente
        baseGroups.sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
          return tb - ta
        })

        // Cancelar listeners anteriores de gastos
        groupExpenseUnsubs.forEach(fn => fn && fn())
        groupExpenseUnsubs = []

        // Inicializar con grupos sin gastos aún (evita parpadeos)
        setGroups(baseGroups.map(g => ({
          id: g.id,
          name: g.name,
          members: g.members || [],
          memberSlots: g.memberSlots || [], // AÑADIDO: incluir memberSlots
          expenses: [],
          createdAt: g.createdAt?.toDate ? g.createdAt.toDate() : new Date()
        })))

        // Crear un listener por subcolección de gastos
        baseGroups.forEach(g => {
          const unsubExp = onSnapshot(
            query(collection(db, 'groups', g.id, 'expenses'), orderBy('createdAt', 'desc')),
            (expSnap) => {
              const expenses = expSnap.docs.map(ed => {
                const e = ed.data()
                return {
                  id: ed.id,
                  description: e.description,
                  amount: e.amount,
                  category: e.category,
                  paidBy: e.paidBy,
                  splitBetween: e.splitBetween || [],
                  settledBy: e.settledBy || [],
                  date: e.date?.toDate ? e.date.toDate() : new Date(),
                  createdAt: e.createdAt?.toDate ? e.createdAt.toDate() : new Date(),
                  // Incluir campos de división detallada
                  useDetailedSplit: e.useDetailedSplit || false,
                  items: e.items || [],
                  itemAssignments: e.itemAssignments || {}
                }
              })

              // Fusionar en estado el grupo actualizado
              setGroups(prev => {
                const byId = new Map(prev.map(gr => [gr.id, gr]))
                const base = byId.get(g.id) || {
                  id: g.id,
                  name: g.name,
                  members: g.members || [],
                  memberSlots: g.memberSlots || [], // AÑADIDO: incluir memberSlots
                  createdAt: g.createdAt?.toDate ? g.createdAt.toDate() : new Date(),
                }
                byId.set(g.id, { ...base, expenses })
                const arr = Array.from(byId.values())
                arr.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0))
                return arr
              })
            }
          )
          groupExpenseUnsubs.push(unsubExp)
        })
      }
    )

    // Invitaciones pendientes
    const unsubInvites = onSnapshot(
      query(collection(db, 'users', user.uid, 'groupInvites'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setGroupInvites(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    )

    // Pagos recurrentes
    const unsubRecurring = onSnapshot(
      query(collection(db, 'users', user.uid, 'recurringPayments'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const items = snapshot.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            description: data.description,
            amount: Number(data.amount || 0),
            category: data.category || 'other',
            frequency: data.frequency || 'monthly', // 'monthly' | 'weekly'
            nextDate: data.nextDate?.toDate ? data.nextDate.toDate() : null,
            active: data.active !== false,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          }
        })
        setRecurringPayments(items)
      }
    )

    return () => {
      unsubPersonal()
      unsubGroups()
      groupExpenseUnsubs.forEach(fn => fn && fn())
      unsubInvites()
      unsubRecurring()
    }
  }, [user?.uid])



  const acceptGroupInvite = async (inviteId, groupId) => {
    let username = user.displayName || 'Miembro'
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) username = snap.data().username || snap.data().displayName || username
    } catch {}
    await updateDoc(doc(db, 'groups', groupId), {
      membersUids: arrayUnion(user.uid),
      members: arrayUnion(username)
    })
    await deleteDoc(doc(db, 'users', user.uid, 'groupInvites', inviteId))
  }

  // Unirse a un grupo por ID (para enlaces/códigos)
  const joinGroupById = async (groupId) => {
    if (!groupId) return
    let username = user.displayName || 'Miembro'
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) username = snap.data().username || snap.data().displayName || username
    } catch {}
    await updateDoc(doc(db, 'groups', groupId), {
      membersUids: arrayUnion(user.uid),
      members: arrayUnion(username)
    })
  }

  const getPersonalStats = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const validExpenses = personalExpenses.filter(expense => expense.amount > 0)
    const total = validExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const monthlyExpenses = validExpenses.filter(expense => 
      expense.date >= startOfMonth
    )
    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const average = validExpenses.length > 0 ? total / validExpenses.length : 0
    
    return {
      total: total.toFixed(2),
      monthly: monthlyTotal.toFixed(2),
      count: validExpenses.length,
      average: average.toFixed(2)
    }
  }

  const getGroupBalance = (groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return {}
    
    const balances = {}
    
    // Inicializar balances
    group.members.forEach(member => {
      balances[member] = 0
    })
    
    // Calcular balances por cada gasto (ignorar gastos con coste 0)
    group.expenses.filter(expense => expense.amount > 0).forEach(expense => {
      // El que pagó recibe crédito
      balances[expense.paidBy] += expense.amount
      
      if (expense.useDetailedSplit && expense.items && expense.itemAssignments) {
        // División detallada: calcular basado en items específicos
        expense.items.forEach((item, index) => {
          const assignedMembers = expense.itemAssignments[index] || []
          if (assignedMembers.length > 0) {
            const sharePerMember = item.price / assignedMembers.length
            assignedMembers.forEach(member => {
              balances[member] -= sharePerMember
            })
          }
        })
      } else {
        // División rápida tradicional
        const sharePerPerson = expense.amount / expense.splitBetween.length
        expense.splitBetween.forEach(member => {
          balances[member] -= sharePerPerson
        })
      }

      // Ajustar por partes ya saldadas
      const settled = Array.isArray(expense.settledBy) ? expense.settledBy : []
      settled.forEach(member => {
        if (expense.useDetailedSplit && expense.items && expense.itemAssignments) {
          // Para división detallada, calcular qué cantidad debe este miembro
          let memberDebt = 0
          expense.items.forEach((item, index) => {
            const assignedMembers = expense.itemAssignments[index] || []
            if (assignedMembers.includes(member)) {
              memberDebt += item.price / assignedMembers.length
            }
          })
          balances[member] += memberDebt
          balances[expense.paidBy] -= memberDebt
        } else {
          // División rápida tradicional
          const sharePerPerson = expense.amount / expense.splitBetween.length
          if (expense.splitBetween.includes(member)) {
            balances[member] += sharePerPerson
            balances[expense.paidBy] -= sharePerPerson
          }
        }
      })
    })
    
    return balances
  }

  const getMinimalTransfers = (groupId) => {
    const balances = getGroupBalance(groupId)
    const transfers = []
    
    // Separar deudores y acreedores
    const creditors = []
    const debtors = []
    
    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0.01) {
        creditors.push({ person, amount: balance })
      } else if (balance < -0.01) {
        debtors.push({ person, amount: Math.abs(balance) })
      }
    })
    
    // Algoritmo de transferencias mínimas
    let i = 0, j = 0
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]
      
      const transferAmount = Math.min(creditor.amount, debtor.amount)
      
      if (transferAmount > 0.01) {
        transfers.push({
          from: debtor.person,
          to: creditor.person,
          amount: transferAmount
        })
      }
      
      creditor.amount -= transferAmount
      debtor.amount -= transferAmount
      
      if (creditor.amount < 0.01) i++
      if (debtor.amount < 0.01) j++
    }
    
    return transfers
  }

  const isMeName = (name) => {
    if (!name) return false
    const candidates = [
      (user?.displayName || '').toLowerCase(),
      (user?.email || '').toLowerCase(),
      'yo', 'tú', 'tu', 'you'
    ].filter(Boolean)
    const n = String(name).toLowerCase()
    return candidates.includes(n)
  }

  // Combina gastos personales con tu parte proporcional de los gastos de grupo
  const getUnifiedExpenses = () => {
    const unified = [...personalExpenses]
    for (const g of groups) {
      for (const e of g.expenses.filter(expense => expense.amount > 0)) {
        const split = Array.isArray(e.splitBetween) ? e.splitBetween : []
        if (split.some(isMeName)) {
          const share = Number(e.amount) / Math.max(1, split.length)
          unified.push({
            id: `${g.id}_${e.id}_share`,
            description: `[${g.name}] ${e.description}`,
            amount: share,
            category: e.category,
            date: e.date,
            source: 'groupShare',
            groupId: g.id,
            groupName: g.name,
          })
        }
      }
    }
    // ordenar por fecha desc
    return unified.sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0))
  }

  // Resumen de cobros esperados: otros que te deben
  const getReceivablesSummary = () => {
    const perPerson = {}
    for (const g of groups) {
      for (const e of g.expenses.filter(expense => expense.amount > 0)) {
        if (isMeName(e.paidBy)) {
          const split = Array.isArray(e.splitBetween) ? e.splitBetween : []
          const share = Number(e.amount) / Math.max(1, split.length)
          for (const person of split) {
            if (isMeName(person)) continue
            perPerson[person] = (perPerson[person] || 0) + share
          }
        }
      }
    }
    const list = Object.entries(perPerson).map(([person, amount]) => ({ person, amount }))
    const total = list.reduce((s, i) => s + i.amount, 0)
    return { total, list, peopleCount: list.length }
  }

  // Resumen de pagos pendientes: lo que debes a otros
  const getPayablesSummary = () => {
    const perPerson = {}
    for (const g of groups) {
      for (const e of g.expenses.filter(expense => expense.amount > 0)) {
        const split = Array.isArray(e.splitBetween) ? e.splitBetween : []
        if (!isMeName(e.paidBy) && split.some(isMeName)) {
          const share = Number(e.amount) / Math.max(1, split.length)
          const creditor = e.paidBy || 'alguien'
          perPerson[creditor] = (perPerson[creditor] || 0) + share
        }
      }
    }
    const list = Object.entries(perPerson).map(([person, amount]) => ({ person, amount }))
    const total = list.reduce((s, i) => s + i.amount, 0)
    return { total, list, peopleCount: list.length }
  }

  // Función para obtener datos de gráficas con filtros temporales
  const getChartData = (timeFilter = 'month', expenses = personalExpenses) => {
    const now = new Date()
    let filteredExpenses = []
    
    switch (timeFilter) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredExpenses = expenses.filter(exp => exp.date >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filteredExpenses = expenses.filter(exp => exp.date >= monthAgo)
        break
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        filteredExpenses = expenses.filter(exp => exp.date >= yearAgo)
        break
      default:
        filteredExpenses = expenses
    }
    
    // Agrupar por categoría
    const categoryData = {}
    filteredExpenses.forEach(expense => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = 0
      }
      categoryData[expense.category] += expense.amount
    })
    
    // Agrupar por día/semana/mes según el filtro
    const timeData = {}
    filteredExpenses.forEach(expense => {
      let timeKey
      switch (timeFilter) {
        case 'week':
          timeKey = expense.date.toLocaleDateString('es-ES', { weekday: 'short' })
          break
        case 'month':
          timeKey = expense.date.getDate()
          break
        case 'year':
          timeKey = expense.date.toLocaleDateString('es-ES', { month: 'short' })
          break
        default:
          timeKey = expense.date.toLocaleDateString('es-ES')
      }
      
      if (!timeData[timeKey]) {
        timeData[timeKey] = 0
      }
      timeData[timeKey] += expense.amount
    })
    
    return {
      categoryData,
      timeData,
      totalAmount: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalCount: filteredExpenses.length
    }
  }



  // Smart categorization: sugiere categoría basada en descripción
  const suggestCategory = (description) => {
    const desc = description.toLowerCase()
    
    if (desc.includes('uber') || desc.includes('taxi') || desc.includes('metro') || desc.includes('bus') || desc.includes('gasolina') || desc.includes('parking')) {
      return 'transport'
    }
    if (desc.includes('restaurante') || desc.includes('mcdonalds') || desc.includes('burger') || desc.includes('pizza') || desc.includes('comida') || desc.includes('almuerzo') || desc.includes('cena')) {
      return 'food'
    }
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('cine') || desc.includes('juego') || desc.includes('concierto') || desc.includes('bar')) {
      return 'entertainment'
    }
    if (desc.includes('amazon') || desc.includes('zara') || desc.includes('ropa') || desc.includes('tienda') || desc.includes('compra') || desc.includes('mercadona')) {
      return 'shopping'
    }
    if (desc.includes('luz') || desc.includes('agua') || desc.includes('gas') || desc.includes('internet') || desc.includes('telefono') || desc.includes('seguro') || desc.includes('alquiler')) {
      return 'bills'
    }
    
    return 'other'
  }

  // Detectar gastos recurrentes
  const detectRecurringExpenses = () => {
    const recurring = []
    const expenseGroups = {}
    
    personalExpenses.forEach(expense => {
      const key = `${expense.description.toLowerCase()}_${expense.amount}`
      if (!expenseGroups[key]) {
        expenseGroups[key] = []
      }
      expenseGroups[key].push(expense)
    })
    
    Object.entries(expenseGroups).forEach(([key, expenses]) => {
      if (expenses.length >= 3) {
        // Analizar frecuencia
        const dates = expenses.map(exp => exp.date).sort((a, b) => a - b)
        const intervals = []
        
        for (let i = 1; i < dates.length; i++) {
          const diff = Math.abs(dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24) // días
          intervals.push(diff)
        }
        
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
        
        if (avgInterval >= 25 && avgInterval <= 35) { // ~mensual
          recurring.push({
            description: expenses[0].description,
            amount: expenses[0].amount,
            category: expenses[0].category,
            frequency: 'monthly',
            lastDate: dates[dates.length - 1],
            count: expenses.length
          })
        } else if (avgInterval >= 6 && avgInterval <= 8) { // ~semanal
          recurring.push({
            description: expenses[0].description,
            amount: expenses[0].amount,
            category: expenses[0].category,
            frequency: 'weekly',
            lastDate: dates[dates.length - 1],
            count: expenses.length
          })
        }
      }
    })
    
    return recurring
  }

  const addRecurringPayment = async ({ description, amount, category, frequency, nextDate, active = true }) => {
    if (!user) return
    const payload = {
      description,
      amount: Number(amount || 0),
      category,
      frequency, // 'monthly' | 'weekly'
      nextDate: nextDate ? Timestamp.fromDate(new Date(nextDate)) : null,
      active,
      createdAt: serverTimestamp()
    }
    await addDoc(collection(db, 'users', user.uid, 'recurringPayments'), payload)
  }

  const updateRecurringPayment = async (id, updates) => {
    if (!user || !id) return
    const payload = { ...updates }
    if (updates.nextDate) payload.nextDate = Timestamp.fromDate(new Date(updates.nextDate))
    payload.updatedAt = serverTimestamp()
    await updateDoc(doc(db, 'users', user.uid, 'recurringPayments', id), payload)
  }

  const deleteRecurringPayment = async (id) => {
    if (!user || !id) return
    await deleteDoc(doc(db, 'users', user.uid, 'recurringPayments', id))
  }

  const applyRecurringPaymentNow = async (rec) => {
    if (!user || !rec) return
    await addPersonalExpense({
      description: rec.description,
      amount: rec.amount,
      category: rec.category,
      date: new Date()
    })
  }

  const getNextDateFrom = (dateOrNull, frequency) => {
    const base = dateOrNull ? new Date(dateOrNull) : new Date()
    const next = new Date(base)
    if (frequency === 'weekly') {
      next.setDate(next.getDate() + 7)
    } else {
      // monthly by default
      next.setMonth(next.getMonth() + 1)
    }
    return next
  }

  const markRecurringAsPaid = async (id) => {
    const rec = recurringPayments.find(r => r.id === id)
    if (!rec) return
    await applyRecurringPaymentNow(rec)
    const nextDate = getNextDateFrom(rec.nextDate || new Date(), rec.frequency)
    await updateRecurringPayment(id, { nextDate })
  }

  // Recurrencia para gastos de grupo
  const addGroupRecurringPayment = async (groupId, { description, amount, category, frequency, nextDate, paidBy, splitBetween, active = true }) => {
    if (!user || !groupId) return
    const payload = {
      description,
      amount: Number(amount || 0),
      category,
      frequency, // 'monthly' | 'weekly'
      nextDate: nextDate ? Timestamp.fromDate(new Date(nextDate)) : null,
      paidBy,
      splitBetween: splitBetween || [],
      active,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    }
    await addDoc(collection(db, 'groups', groupId, 'recurringPayments'), payload)
  }

  const updateGroupRecurringPayment = async (groupId, id, updates) => {
    if (!user || !groupId || !id) return
    const payload = { ...updates }
    if (updates.nextDate) payload.nextDate = Timestamp.fromDate(new Date(updates.nextDate))
    payload.updatedAt = serverTimestamp()
    await updateDoc(doc(db, 'groups', groupId, 'recurringPayments', id), payload)
  }

  const deleteGroupRecurringPayment = async (groupId, id) => {
    if (!user || !groupId || !id) return
    await deleteDoc(doc(db, 'groups', groupId, 'recurringPayments', id))
  }

  const markGroupRecurringAsPaid = async (groupId, id) => {
    if (!groupId || !id) return
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    // Nota: aquí no leemos el doc, se requiere que el caller pase los datos o que se añada una lectura previa.
    // Para simplicidad, este helper sólo avanza la fecha si el caller proporciona los datos necesarios.
  }

  return {
    personalExpenses,
    groups,
    groupInvites,
    recurringPayments,
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
    addGroup,
    joinGroupByInviteLink,
    joinGroupBySpecificLink,
    joinGroupByGeneralLink,
    addGroupExpense,
    updateGroupExpense,
    deleteGroupExpense,
    toggleGroupExpenseSettled,
    getPersonalStats,
    getGroupBalance,
    getMinimalTransfers,
    getChartData,
    suggestCategory,
    detectRecurringExpenses,
    getUnifiedExpenses,
    getReceivablesSummary,
    getPayablesSummary,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment,
    markRecurringAsPaid,
    addGroupRecurringPayment,
    updateGroupRecurringPayment,
    deleteGroupRecurringPayment,
    markGroupRecurringAsPaid,
    acceptGroupInvite,
    joinGroupById
  }
}
