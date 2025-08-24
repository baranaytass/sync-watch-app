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
    console.log(`🎯 VideoSync: Server authoritative - ${data.action} at ${data.time}s`)
    videoSyncStore.syncVideo({
      action: data.action,
      time: data.time,
      timestamp: new Date(data.timestamp)
    })
  }

  return {
    handleVideoSync,
    handleVideoSyncAuthoritative
  }
}