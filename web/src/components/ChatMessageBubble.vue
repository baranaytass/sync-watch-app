<template>
  <div :class="[
    'flex',
    isOwnMessage ? 'justify-end' : 'justify-start'
  ]">
    <div :class="[
      'flex max-w-xs lg:max-w-md',
      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
    ]">
      <!-- User Avatar -->
      <div class="flex-shrink-0">
        <img
          :src="message.userAvatar || fallbackAvatar"
          :alt="message.userName"
          class="h-8 w-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
          @error="$event.target.src = fallbackAvatar"
        />
      </div>

      <!-- Message Content -->
      <div :class="[
        'mx-2 flex flex-col',
        isOwnMessage ? 'items-end' : 'items-start'
      ]">
        <!-- User Name & Time -->
        <div :class="[
          'flex items-center mb-1 text-xs text-gray-500 dark:text-gray-400',
          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
        ]">
          <span class="font-medium">{{ message.userName }}</span>
          <span :class="[
            'text-xs',
            isOwnMessage ? 'mr-2' : 'ml-2'
          ]">
            {{ formatTime(message.timestamp) }}
          </span>
        </div>

        <!-- Message Bubble -->
        <div :class="[
          'px-3 py-2 rounded-lg max-w-full break-words',
          isOwnMessage 
            ? 'bg-blue-500 text-white rounded-br-sm' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
        ]">
          <p class="text-sm leading-relaxed">{{ message.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '@/stores/chat'

interface Props {
  message: ChatMessage
  isOwnMessage: boolean
}

const props = defineProps<Props>()

// Fallback avatar using ui-avatars.com
const fallbackAvatar = computed(() => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(props.message.userName)}&background=6366f1&color=ffffff&rounded=true&size=32`
)

// Format timestamp for display
const formatTime = (timestamp: Date) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMinutes < 1) {
    return 'şimdi'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}dk önce`
  } else if (diffHours < 24) {
    return `${diffHours}sa önce`
  } else {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
</script>