<template>
  <div class="flex-shrink-0 p-4 border-t border-border bg-background">
    <form @submit.prevent="handleSubmit" class="flex space-x-2">
      <div class="flex-1 relative">
        <input
          v-model="message"
          ref="messageInput"
          type="text"
          placeholder="Type a message..."
          :disabled="disabled"
          class="input w-full disabled:opacity-50 disabled:cursor-not-allowed"
          maxlength="500"
          data-testid="chat-input"
          @keydown.enter.prevent="handleSubmit"
          @input="handleInput"
        />
        
        <!-- Character count -->
        <div 
          v-if="message.length > 400"
          class="absolute -top-6 right-0 text-xs text-muted-foreground"
        >
          {{ message.length }}/500
        </div>
      </div>

      <button
        type="submit"
        :disabled="!canSend"
        class="btn-primary flex-shrink-0 px-4 py-2"
        data-testid="chat-send-button"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'send-message', message: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const message = ref('')
const messageInput = ref<HTMLInputElement>()

const canSend = computed(() => {
  return message.value.trim().length > 0 && message.value.length <= 500
})

const handleSubmit = () => {
  console.log(`💬 ChatMessageInput: Submit triggered - canSend: ${canSend.value}`)
  console.log(`💬 ChatMessageInput: Message content: "${message.value}"`)
  if (canSend.value) {
    const messageText = message.value.trim()
    console.log(`💬 ChatMessageInput: Emitting send-message: "${messageText}"`)
    emit('send-message', messageText)
    message.value = ''
    
    // Focus back to input for better UX
    messageInput.value?.focus()
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // Ensure we don't exceed character limit
  if (target.value.length > 500) {
    target.value = target.value.substring(0, 500)
    message.value = target.value
  }
}
</script>