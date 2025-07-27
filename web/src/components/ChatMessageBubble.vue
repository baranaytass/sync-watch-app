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
          class="h-8 w-8 rounded-full border-2 border-background shadow-sm"
          @error="$event.target.src = fallbackAvatar"
        />
      </div>

      <!-- Message Content -->
      <div :class="[
        'mx-2 flex flex-col',
        isOwnMessage ? 'items-end' : 'items-start'
      ]">
        <!-- User Name -->
        <div :class="[
          'flex items-center mb-1 text-xs text-muted-foreground',
          isOwnMessage ? 'justify-end' : 'justify-start'
        ]">
          <span class="font-medium">{{ message.userName }}</span>
        </div>

        <!-- Message Bubble with Tooltip -->
        <div 
          :class="[
            'px-3 py-2 rounded-lg max-w-full break-words cursor-pointer',
            isOwnMessage 
              ? 'bg-primary text-primary-foreground rounded-br-sm' 
              : 'bg-muted text-foreground rounded-bl-sm'
          ]"
          :title="formatFullTime(message.timestamp)"
        >
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

// Format timestamp for display (not used anymore, keeping for potential future use)
const formatTime = (timestamp: Date) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMinutes < 1) {
    return 'now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// Format full timestamp for tooltip
const formatFullTime = (timestamp: Date) => {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>