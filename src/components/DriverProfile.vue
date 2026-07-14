<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDriversStore } from '@/stores/drivers'
import { Driver, ActiveDriver } from '@/models/driver'
import { motion } from 'motion-v'
import SvgIcon from '@/components/ui/SvgIcon.vue'

const route = useRoute()
const router = useRouter()
const driversStore = useDriversStore()

onMounted(() => {
  if (driversStore.driversList.length === 0) {
    driversStore.loadDrivers()
  }
})

const driverId = Number(route.params.id)
const driver = computed(() => driversStore.getDriverById(driverId))

const goBack = () => {
  router.push('/base/drivers')
}

// === Логіка редагування ===
const isEditing = ref(false)
const editName = ref('')
const editSurname = ref('')
const editPhone = ref('')
const editEmail = ref('')
const editWorkingHours = ref<number | null>(null)

// Помилки валідації
const validationErrors = ref<Record<string, string>>({})

const startEditing = () => {
  if (driver.value) {
    editName.value = driver.value.name
    editSurname.value = driver.value.surname
    editPhone.value = driver.value.phone
    editEmail.value = driver.value.email
    editWorkingHours.value = driver.value.working_hours
    validationErrors.value = {}
    isEditing.value = true
  }
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveEditing = () => {
  if (!driver.value) return

  validationErrors.value = {}

  // Оновлюємо та створюємо об'єкт для валідації
  let updatedDriver: Driver
  if (driver.value.isActive) {
    updatedDriver = new ActiveDriver(
      driver.value.id,
      editName.value,
      editSurname.value,
      editPhone.value,
      editEmail.value,
      editWorkingHours.value === null ? null : Number(editWorkingHours.value),
      driver.value.currentRoute
    )
  } else {
    updatedDriver = new Driver(
      driver.value.id,
      editName.value,
      editSurname.value,
      editPhone.value,
      editEmail.value,
      editWorkingHours.value === null ? null : Number(editWorkingHours.value)
    )
  }

  const { isValid, errors } = updatedDriver.validate()
  if (!isValid) {
    validationErrors.value = errors
    return
  }

  try {
    driversStore.updateDriver(driver.value.id, updatedDriver)
    isEditing.value = false
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
  <div class="flex-1 flex flex-col items-center pb-20 w-full max-w-4xl mx-auto px-4 mt-20">

    <div class="w-full flex justify-between items-center mb-6">
      <button
          @click="goBack"
          class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors shadow-sm bg-white px-4 py-2 rounded-full border border-gray-200"
      >
        <SvgIcon name="chevron-left" class="w-4 h-4" />
        Назад до списку
      </button>

      <button
          v-if="!isEditing"
          @click="startEditing"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all hover:scale-105"
          title="Редагувати профіль"
      >
        <SvgIcon name="pencil" class="w-4 h-4" />
      </button>
    </div>

    <motion.div
        v-if="driver"
        layout
        :transition="{ type: 'spring', stiffness: 350, damping: 35 }"
        class="w-full bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-stretch"
    >

      <!-- Ліва колонка (Профіль) -->
      <div class="flex flex-col items-center justify-center w-full md:w-1/3 md:border-r border-gray-50 md:pr-8 py-4">
        <div class="relative mb-4">
          <div class="w-[120px] h-[120px] rounded-full bg-[#EBF4FF] text-[#2563EB] flex items-center justify-center font-bold text-4xl shadow-inner border-[6px] border-white ring-1 ring-gray-100">
            {{ driver.name.charAt(0) }}{{ driver.surname.charAt(0) }}
          </div>
          <div v-if="driver.isActive" class="absolute bottom-2 right-1 w-6 h-6 bg-[#10B981] border-[4px] border-white rounded-full shadow-sm"></div>
        </div>

        <h2 class="text-2xl font-semibold text-[#1F2937] text-center mb-3">{{ driver.name }} {{ driver.surname }}</h2>

        <div class="flex flex-col items-center gap-2">
          <span class="text-[#2563EB] text-sm bg-[#EBF4FF] px-4 py-1.5 rounded-full font-medium">Водій депо</span>
          <span v-if="driver.isActive" class="text-[#10B981] text-xs bg-[#ECFDF5] px-4 py-1.5 rounded-full font-medium border border-[#D1FAE5] text-center">
            На рейсі: {{ driver.currentRoute }}
          </span>
        </div>
      </div>

      <!-- Права колонка (Деталі або Форма) -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="!isEditing" key="details" class="flex flex-col justify-center w-full md:w-2/3 space-y-4">

        <div class="flex justify-between items-center p-3.5 bg-[#F8FAFC] rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
              <SvgIcon name="driver-id" class="w-5 h-5" />
            </div>
            <span class="text-[#4B5563] font-medium">ID Водія</span>
          </div>
          <span class="text-[#111827] font-semibold pr-2">{{ driver.id }}</span>
        </div>

        <div class="flex justify-between items-center p-3.5 bg-[#F8FAFC] rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
              <SvgIcon name="phone" class="w-6 h-6 text-gray-400" />
            </div>
            <span class="text-[#4B5563] font-medium">Телефон</span>
          </div>
          <a :href="'tel:' + driver.phone" class="text-[#2563EB] font-medium pr-2">{{ driver.phone }}</a>
        </div>

        <div class="flex justify-between items-center p-3.5 bg-[#F8FAFC] rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
              <SvgIcon name="email" class="w-5 h-5" />
            </div>
            <span class="text-[#4B5563] font-medium">Email</span>
          </div>
          <a :href="'mailto:' + driver.email" class="text-[#2563EB] font-medium pr-2">{{ driver.email }}</a>
        </div>

        <div class="flex justify-between items-center p-3.5 bg-[#F8FAFC] rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
              <SvgIcon name="clock" class="w-5 h-5" />
            </div>
            <span class="text-[#4B5563] font-medium">Відпрацьовано годин за місяць</span>
          </div>
          <span class="text-[#111827] font-semibold flex items-center gap-1 pr-2">
            {{ driver.working_hours }} <span class="text-xs font-normal text-[#6B7280] mt-0.5">год.</span>
          </span>
        </div>

      </div>

      <!-- Форма редагування -->
      <form v-else key="edit" @submit.prevent="saveEditing" class="flex flex-col justify-center w-full md:w-2/3 space-y-4" novalidate>
        <h3 class="text-lg font-semibold text-gray-800 mb-2 pl-1">Редагувати інформацію</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-500 pl-1">Ім'я</label>
            <input
                v-model="editName"
                type="text"
                class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                :class="validationErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-100'"
                required
            >
            <p v-if="validationErrors.name" class="text-[11px] text-red-500 pl-1">{{ validationErrors.name }}</p>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-500 pl-1">Прізвище</label>
            <input
                v-model="editSurname"
                type="text"
                class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                :class="validationErrors.surname ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-100'"
                required
            >
            <p v-if="validationErrors.surname" class="text-[11px] text-red-500 pl-1">{{ validationErrors.surname }}</p>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-500 pl-1">Телефон</label>
          <input
              v-model="editPhone"
              type="tel"
              class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              :class="validationErrors.phone ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-100'"
              required
          >
          <p v-if="validationErrors.phone" class="text-[11px] text-red-500 pl-1">{{ validationErrors.phone }}</p>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-500 pl-1">Email</label>
          <input
              v-model="editEmail"
              type="email"
              class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              :class="validationErrors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-100'"
          >
          <p v-if="validationErrors.email" class="text-[11px] text-red-500 pl-1">{{ validationErrors.email }}</p>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-500 pl-1">Відпрацьовано годин</label>
          <div class="relative">
            <input
                v-model="editWorkingHours"
                type="number"
                min="0"
                class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                :class="validationErrors.working_hours ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-100'"
                required
            >
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">год.</span>
          </div>
          <p v-if="validationErrors.working_hours" class="text-[11px] text-red-500 pl-1">{{ validationErrors.working_hours }}</p>
        </div>

        <div class="pt-4 flex gap-3 justify-end">
          <button
              type="button"
              @click="cancelEditing"
              class="px-5 py-2.5 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors border border-gray-100 text-sm"
          >
            Скасувати
          </button>
          <button
              type="submit"
              class="px-6 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
          >
            Зберегти
          </button>
        </div>
      </form>
      </transition>

    </motion.div>

    <div v-else class="text-center mt-20">
      <h2 class="text-2xl text-gray-800 font-semibold mb-2">Водія не знайдено</h2>
      <p class="text-gray-500">Можливо, сталася помилка з ID або водія було видалено.</p>
    </div>

  </div>
</template>

<style scoped>
.fade-slide-enter-active {
  transition: opacity 0.45s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.45s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-slide-leave-active {
  transition: opacity 0.25s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: scale(0.97) translateY(12px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-12px);
}
</style>