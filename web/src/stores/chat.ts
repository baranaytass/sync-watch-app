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

  return {
    // State
    messages,
    loading,
    // Actions
    addMessage,
    clearMessages,
    loadMessages
  }
}) 