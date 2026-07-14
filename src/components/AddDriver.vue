<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDriversStore } from '@/stores/drivers'
import { Driver } from '@/models/driver'
import SvgIcon from '@/components/ui/SvgIcon.vue'

const router = useRouter()
const driversStore = useDriversStore()

// Реактивний стан полів форми
const name = ref('')
const surname = ref('')
const phone = ref('')
const email = ref('')
const workingHours = ref<number | null>(null)

// Помилки валідації
const validationErrors = ref<Record<string, string>>({})

// Повернення назад
const goBack = () => {
  router.push('/base/drivers')
}

// Обробка відправки форми
const submitForm = () => {
  validationErrors.value = {}

  // Генеруємо новий унікальний ID (тимчасовий або фінальний)
  const maxId = driversStore.driversList.length > 0
      ? Math.max(...driversStore.driversList.map(d => d.id))
      : 0
  const newId = maxId + 1

  // Створюємо новий об'єкт водія для перевірки валідації
  const newDriver = new Driver(
      newId,
      name.value,
      surname.value,
      phone.value,
      email.value,
      workingHours.value === null ? null : Number(workingHours.value)
  )

  const { isValid, errors } = newDriver.validate()

  if (!isValid) {
    validationErrors.value = errors
    return
  }

  try {
    driversStore.addDriver(newDriver)
    router.push('/base/drivers')
  } catch (err: any) {
    try {
      const parsedErrors = JSON.parse(err.message)
      validationErrors.value = parsedErrors
    } catch {
      alert(err.message)
    }
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center pb-20 w-full max-w-2xl mx-auto px-4 mt-20">

    <!-- Кнопка повернення назад -->
    <div class="w-full flex justify-start mb-6">
      <button
          @click="goBack"
          class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200"
      >
        <SvgIcon name="chevron-left" class="w-4 h-4" />
        Скасувати
      </button>
    </div>

    <!-- Картка форми -->
    <div class="w-full bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">

      <!-- Заголовок -->
      <div class="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div class="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100">
          <SvgIcon name="driver-add" class="w-7 h-7" />
        </div>
        <div>
          <h2 class="text-2xl font-semibold text-gray-800">Додати водія</h2>
          <p class="text-sm text-gray-500">Внесіть дані нового співробітника депо</p>
        </div>
      </div>

      <!-- Форма -->
      <form @submit.prevent="submitForm" class="space-y-5" novalidate>

        <!-- Ім'я та Прізвище (у два стовпці) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700 pl-1">Ім'я <span class="text-red-500">*</span></label>
            <input
                v-model="name"
                type="text"
                required
                placeholder="Наприклад: John"
                class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                :class="validationErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
            >
            <p v-if="validationErrors.name" class="text-xs text-red-500 pl-1 mt-1">{{ validationErrors.name }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700 pl-1">Прізвище <span class="text-red-500">*</span></label>
            <input
                v-model="surname"
                type="text"
                required
                placeholder="Наприклад: Doe"
                class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                :class="validationErrors.surname ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
            >
            <p v-if="validationErrors.surname" class="text-xs text-red-500 pl-1 mt-1">{{ validationErrors.surname }}</p>
          </div>
        </div>

        <!-- Телефон -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 pl-1">Телефон <span class="text-red-500">*</span></label>
          <input
              v-model="phone"
              type="tel"
              required
              placeholder="+38 (000) 000-00-00"
              class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              :class="validationErrors.phone ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
          >
          <p v-if="validationErrors.phone" class="text-xs text-red-500 pl-1 mt-1">{{ validationErrors.phone }}</p>
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 pl-1">Email</label>
          <input
              v-model="email"
              type="email"
              placeholder="info@gmail.com"
              class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              :class="validationErrors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
          >
          <p v-if="validationErrors.email" class="text-xs text-red-500 pl-1 mt-1">{{ validationErrors.email }}</p>
        </div>

        <!-- Робочі години -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 pl-1">Відпрацьовані години <span class="text-red-500">*</span></label>
          <div class="relative">
            <input
                v-model="workingHours"
                type="number"
                min="0"
                required
                placeholder="0"
                class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                :class="validationErrors.working_hours ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
            >
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">год.</span>
          </div>
          <p v-if="validationErrors.working_hours" class="text-xs text-red-500 pl-1 mt-1">{{ validationErrors.working_hours }}</p>
        </div>

        <!-- Кнопки керування -->
        <div class="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
          <button
              type="button"
              @click="goBack"
              class="px-6 py-3 rounded-2xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors border border-transparent hover:border-gray-200"
          >
            Відмінити
          </button>
          <button
              type="submit"
              class="px-8 py-3 rounded-2xl text-white bg-blue-600 hover:bg-blue-700 font-medium shadow-[0_8px_16px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Зберегти водія
          </button>
        </div>

      </form>
    </div>

  </div>
</template>