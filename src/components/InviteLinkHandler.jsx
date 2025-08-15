import React, { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import GroupJoinModal from './GroupJoinModal'

function InviteLinkHandler({ user, onJoinSuccess }) {
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [groupData, setGroupData] = useState(null)
  const [inviteToken, setInviteToken] = useState(null)
  const [generalToken, setGeneralToken] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check URL for invite parameters
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('invite')
    const general = urlParams.get('general')
    const groupId = urlParams.get('group')

    if (groupId && (token || general)) {
      if (general) {
        setGeneralToken(general)
        loadGroupData(groupId, null, general)
      } else if (token) {
        setInviteToken(token)
        loadGroupData(groupId, token, null)
      }
    }
  }, [])

  const loadGroupData = async (groupId, token, general) => {
    setLoading(true)
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (groupDoc.exists()) {
        const group = { id: groupDoc.id, ...groupDoc.data() }
        
        let isValid = false
        
        if (general) {
          // Verify general token and check if there are available general slots
          if (group.generalInviteToken === general) {
            const hasAvailableGeneralSlots = group.memberSlots?.some(slot => 
              slot.type === 'pending' &&
              slot.status === 'unclaimed' &&
              slot.inviteType === 'general'
            )
            isValid = hasAvailableGeneralSlots
          }
        } else if (token) {
          // Verify specific token
          const validSlot = group.memberSlots?.find(slot => 
            slot.inviteToken === token && 
            slot.type === 'pending' &&
            slot.status === 'unclaimed' &&
            slot.inviteType === 'specific'
          )
          isValid = !!validSlot
        }

        if (isValid) {
          setGroupData(group)
          setShowJoinModal(true)
          
          // Clean URL without reloading page
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          console.error('Invalid, expired, or no available slots for invite token')
        }
      }
    } catch (error) {
      console.error('Error loading group data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (joinData, inviteType) => {
    try {
      if (onJoinSuccess) {
        await onJoinSuccess(joinData, inviteType)
      }
      setShowJoinModal(false)
    } catch (error) {
      console.error('Error joining group:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {showJoinModal && (
        <GroupJoinModal
          groupData={groupData}
          inviteToken={inviteToken}
          generalToken={generalToken}
          onJoin={handleJoinGroup}
          onClose={() => setShowJoinModal(false)}
          user={user}
        />
      )}
    </>
  )
}

export default InviteLinkHandler
