import { useVideoSyncStore } from '@/stores/videoSync'

export const useVideoSyncHandlers = () => {
  const videoSyncStore = useVideoSyncStore()

  const handleVideoSync = (data: any) => {
    console.log(`🎥 VideoSync: Client sync - ${data.action} at ${data.time}s`)
    videoSyncStore.syncVideo({
      action: data.action,
      time: data.time,
      timestamp: new Date(data.timestamp)
    })
  }

  const handleVideoSyncAuthoritative = (data: any) => {
    console.log(`🎯 VideoSync: Server authoritative - ${data.action} at ${data.time}s (source: ${data.sourceUserId || 'server'})`)
    
    // CRITICAL DEBUG: Log when this happens
    if (!data.sourceUserId) {
      console.log(`🚨 INITIAL SYNC: New user joining, should only affect that user`)
    } else {
      console.log(`📡 USER ACTION SYNC: From user ${data.sourceUserId}, should affect all users`)
    }
    
    // FIXED: Use direct event dispatch instead of global store
    // This prevents new user joins from affecting existing users
    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    
    // Dispatch custom event for direct video sync
    window.dispatchEvent(new CustomEvent('video-sync-direct', {
      detail: {
        action: data.action,
        time: data.time,
        timestamp: data.timestamp,
        messageId: messageId,
        sourceUserId: data.sourceUserId,
        isInitialSync: !data.sourceUserId
      }
    }))
    
    // TEMPORARILY DISABLE STORE UPDATE TO TEST
    // Still update store for compatibility but with unique timestamp
    // videoSyncStore.syncVideoAuthoritative({
    //   action: data.action,
    //   time: data.time,
    //   timestamp: new Date(data.timestamp || Date.now())
    // })
  }

  return {
    handleVideoSync,
    handleVideoSyncAuthoritative
  }
}