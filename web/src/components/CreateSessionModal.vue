<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background backdrop -->
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <form @submit.prevent="handleSubmit">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                  Yeni Oturum Oluştur
                </h3>
                
                <div class="space-y-4">
                  <!-- Session Title -->
                  <div>
                    <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                      Oturum Başlığı
                    </label>
                    <input
                      id="title"
                      v-model="formData.title"
                      type="text"
                      required
                      class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Örn: Film Gecesi"
                      :class="{ 'border-red-300': errors.title }"
                    />
                    <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
                  </div>
                  
                  <!-- Session Description -->
                  <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama (isteğe bağlı)
                    </label>
                    <textarea
                      id="description"
                      v-model="formData.description"
                      rows="3"
                      class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Bu oturum hakkında kısa bir açıklama..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Modal Actions -->
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Oluşturuluyor...' : 'Oturum Oluştur' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              :disabled="loading"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreateSessionRequest } from '@/stores/sessions'

interface Props {
  open: boolean
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'create-session': [data: CreateSessionRequest]
}>()

const formData = ref<CreateSessionRequest>({
  title: '',
  description: ''
})

const errors = ref<Record<string, string>>({})

// Reset form when modal opens/closes
watch(() => props.open, (newValue) => {
  if (newValue) {
    formData.value = { title: '', description: '' }
    errors.value = {}
  }
})

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!formData.value.title.trim()) {
    errors.value.title = 'Oturum başlığı gerekli'
    return false
  }
  
  if (formData.value.title.length < 3) {
    errors.value.title = 'Oturum başlığı en az 3 karakter olmalı'
    return false
  }
  
  if (formData.value.title.length > 100) {
    errors.value.title = 'Oturum başlığı en fazla 100 karakter olabilir'
    return false
  }
  
  return true
}

const handleSubmit = () => {
  if (!validateForm()) return
  
  emit('create-session', {
    title: formData.value.title.trim(),
    description: formData.value.description?.trim() || undefined
  })
}
</script> 