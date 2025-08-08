<template>
  <div class="h-full flex flex-col">
    <!-- Chat Header -->
    <div class="flex-shrink-0 px-4 py-3 bg-muted/30 border-b border-border">
      <h3 class="text-sm font-medium text-foreground flex items-center">
        <svg class="h-4 w-4 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Chat
      </h3>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <ChatMessageList 
        :messages="chatStore.messages"
        :current-user-id="authStore.user?.id || ''"
        class="flex-1"
      />

      <!-- Message Input -->
      <ChatMessageInput 
        @send-message="handleSendMessage"
        :disabled="!connected"
        class="flex-shrink-0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import ChatMessageList from './ChatMessageList.vue'
import ChatMessageInput from './ChatMessageInput.vue'

interface Props {
  connected: boolean
}

interface Emits {
  (e: 'send-message', message: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const chatStore = useChatStore()
const authStore = useAuthStore()

const handleSendMessage = (message: string) => {
  console.log(`💬 ChatPanel: Sending message: "${message}"`)
  emit('send-message', message)
}
</script>