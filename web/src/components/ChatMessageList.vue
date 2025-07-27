<template>
  <div class="flex-1 overflow-y-auto p-4 space-y-3" ref="messagesContainer">
    <div v-if="messages.length === 0" class="text-center text-muted-foreground py-8">
      <svg class="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="text-sm">No messages yet</p>
      <p class="text-xs opacity-75 mt-1">Send the first message!</p>
    </div>

    <ChatMessageBubble
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :is-own-message="message.userId === currentUserId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import ChatMessageBubble from './ChatMessageBubble.vue'
import type { ChatMessage } from '@/stores/chat'

interface Props {
  messages: ChatMessage[]
  currentUserId: string
}

const props = defineProps<Props>()

const messagesContainer = ref<HTMLElement>()

// Auto-scroll to bottom when new messages arrive
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for new messages and scroll to bottom
watch(
  () => props.messages.length,
  () => {
    scrollToBottom()
  },
  { immediate: true }
)
</script>