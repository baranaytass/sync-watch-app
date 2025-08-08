import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar: string
  message: string
  timestamp: Date
}

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const currentSessionId = ref<string | null>(null)

  // Actions
  const addMessage = (message: ChatMessage) => {
    messages.value.push(message)
  }

  const clearMessages = () => {
    messages.value = []
  }

  const loadMessages = (messageList: ChatMessage[]) => {
    messages.value = messageList
  }

  // Session-aware message management
  const initializeForSession = (sessionId: string) => {
    if (currentSessionId.value !== sessionId) {
      // Clear messages when switching to a different session
      console.log(`💬 Chat Store: Switching to session ${sessionId}, clearing previous messages`)
      clearMessages()
      currentSessionId.value = sessionId
    }
  }

  const cleanup = () => {
    console.log('💬 Chat Store: Cleaning up chat data')
    clearMessages()
    currentSessionId.value = null
  }

  return {
    // State
    messages,
    loading,
    currentSessionId,
    // Actions
    addMessage,
    clearMessages,
    loadMessages,
    initializeForSession,
    cleanup
  }
}) 