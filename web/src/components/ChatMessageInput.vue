<template>
  <div class="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
    <form @submit.prevent="handleSubmit" class="flex space-x-2">
      <div class="flex-1 relative">
        <input
          v-model="message"
          ref="messageInput"
          type="text"
          placeholder="Mesaj yazın..."
          :disabled="disabled"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          maxlength="500"
          @keydown.enter.prevent="handleSubmit"
          @input="handleInput"
        />
        
        <!-- Character count -->
        <div 
          v-if="message.length > 400"
          class="absolute -top-6 right-0 text-xs text-gray-500 dark:text-gray-400"
        >
          {{ message.length }}/500
        </div>
      </div>

      <button
        type="submit"
        :disabled="!canSend"
        class="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 transition-colors duration-200"
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
  console.log(`🔥 ChatMessageInput: handleSubmit called - canSend: ${canSend.value}`)
  console.log(`🔥 ChatMessageInput: message value: "${message.value}"`)
  if (canSend.value) {
    const messageText = message.value.trim()
    console.log(`🔥 ChatMessageInput: Emitting send-message: "${messageText}"`)
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