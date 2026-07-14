<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDriversStore } from '@/stores/drivers'
import { Driver } from '@/models/driver'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import DriversStats from '@/components/DriversStats.vue'

const router = useRouter()
const route = useRoute()
const driversStore = useDriversStore()

const { driversList: drivers, activeDrivers } = storeToRefs(driversStore)
const isDeleteMode = computed(() => driversStore.isDeleteMode)
const isAssignRouteMode = computed(() => driversStore.isAssignRouteMode)
const isAddDriverModalOpen = computed(() => driversStore.isAddDriverModalOpen)

onMounted(() => {
  if (drivers.value.length === 0) {
    driversStore.loadDrivers()
  }
})

// === Режими дій (Додати / Видалити / Призначити рейс) тепер підключені до Pinia ===

const isDeleteConfirmModalOpen = ref(false)
const selectedDriverForDelete = ref<any>(null)

const triggerDeleteConfirmation = (driver: any) => {
  selectedDriverForDelete.value = driver
  isDeleteConfirmModalOpen.value = true
}

const closeDeleteConfirmModal = () => {
  isDeleteConfirmModalOpen.value = false
  selectedDriverForDelete.value = null
}

const confirmDeleteDriver = () => {
  if (selectedDriverForDelete.value) {
    driversStore.deleteDriver(selectedDriverForDelete.value.id)
    closeDeleteConfirmModal()
  }
}

const deactivateDriver = (id: number) => {
  driversStore.deactivateDriver(id)
}

const isAssignModalOpen = ref(false)
const selectedDriver = ref<any>(null)
const inputRouteName = ref('')

const openAssignModal = (driver: any) => {
  selectedDriver.value = driver
  inputRouteName.value = ''
  isAssignModalOpen.value = true
}

const closeAssignModal = () => {
  isAssignModalOpen.value = false
  selectedDriver.value = null
}

const saveRouteAssignment = () => {
  if (selectedDriver.value && inputRouteName.value.trim()) {
    driversStore.activateDriver(selectedDriver.value.id, inputRouteName.value.trim())
    closeAssignModal()
  }
}

const selectPresetRoute = (routeStr: string) => {
  inputRouteName.value = routeStr
}

// === ЛОГІКА ДОДАВАННЯ ВОДІЯ ЧЕРЕЗ МОДАЛКУ ===
const addName = ref('')
const addSurname = ref('')
const addPhone = ref('')
const addEmail = ref('')
const addWorkingHours = ref<number | null>(null)
const addValidationErrors = ref<Record<string, string>>({})

watch(() => driversStore.isAddDriverModalOpen, (newVal) => {
  if (newVal) {
    addName.value = ''
    addSurname.value = ''
    addPhone.value = ''
    addEmail.value = ''
    addWorkingHours.value = null
    addValidationErrors.value = {}
  }
})

const closeAddDriverModal = () => {
  driversStore.isAddDriverModalOpen = false
}

const saveNewDriver = () => {
  addValidationErrors.value = {}

  // Генеруємо новий унікальний ID
  const maxId = drivers.value.length > 0
      ? Math.max(...drivers.value.map((d: any) => d.id))
      : 0
  const newId = maxId + 1

  const newDriver = new Driver(
      newId,
      addName.value,
      addSurname.value,
      addPhone.value,
      addEmail.value,
      addWorkingHours.value === null ? null : Number(addWorkingHours.value)
  )

  const { isValid, errors } = newDriver.validate()

  if (!isValid) {
    addValidationErrors.value = errors
    return
  }

  try {
    driversStore.addDriver(newDriver)
    closeAddDriverModal()
  } catch (err: any) {
    try {
      const parsedErrors = JSON.parse(err.message)
      addValidationErrors.value = parsedErrors
    } catch {
      alert(err.message)
    }
  }
}

const handleCardClick = (driver: any) => {
  if (isDeleteMode.value) {
    triggerDeleteConfirmation(driver)
    return
  }
  if (isAssignRouteMode.value) {
    if (driver.isActive) {
      deactivateDriver(driver.id)
    } else {
      openAssignModal(driver)
    }
    return
  }
  openProfile(driver.id)
}

const openProfile = (id: number) => {
  if (!isDeleteMode.value && !isAssignRouteMode.value) {
    router.push({ path: `/base/drivers/${id}`, query: route.query })
  }
}

// === ЛОГІКА ФІЛЬТРАЦІЇ ТА СОРТУВАННЯ ЧЕРЕЗ РОУТЕР ===
const currentStatus = computed(() => (route.query.status as string) || 'all')
const currentSort = computed(() => (route.query.sort as string) || 'default')

const isStatusMenuOpen = ref(false)
const isSortMenuOpen = ref(false)

const closeMenus = () => {
  isStatusMenuOpen.value = false
  isSortMenuOpen.value = false
}

// Оновлені та захищені методи для зміни URL
const setFilter = (status: string) => {
  const query = { ...route.query }
  if (status === 'all') delete query.status
  else query.status = status
  router.replace({ path: route.path, query }).catch(() => {})
  isStatusMenuOpen.value = false
}

const setSort = (sortOption: string) => {
  const query = { ...route.query }
  if (sortOption === 'default') delete query.sort
  else query.sort = sortOption
  router.replace({ path: route.path, query }).catch(() => {})
  isSortMenuOpen.value = false
}

const searchQuery = ref('')

const displayedDrivers = computed(() => {
  let result = [...drivers.value]

  // Пошук за ім'ям або прізвищем
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.surname.toLowerCase().includes(q)
    )
  }

  // Фільтрація
  if (currentStatus.value === 'active') {
    result = result.filter(d => d.isActive)
  } else if (currentStatus.value === 'inactive') {
    result = result.filter(d => !d.isActive)
  }

  // Сортування
  if (currentSort.value === 'hours-desc') {
    result.sort((a, b) => b.working_hours - a.working_hours)
  } else if (currentSort.value === 'hours-asc') {
    result.sort((a, b) => a.working_hours - b.working_hours)
  } else if (currentSort.value === 'name-asc') {
    result.sort((a, b) => a.name.localeCompare(b.name))
  }

  return result
})

const statusLabel = computed(() => {
  if (currentStatus.value === 'active') return 'На рейсі'
  if (currentStatus.value === 'inactive') return 'В депо'
  return 'Всі водії'
})

const statusDotClass = computed(() => {
  if (currentStatus.value === 'active') return 'bg-green-500'
  if (currentStatus.value === 'inactive') return 'bg-gray-400'
  return 'bg-blue-500'
})

// === Логіка для кругової діаграми була винесена в DriversStats.vue ===
</script>

<template>
  <div class="flex-1 flex flex-col items-center pb-20 h-full w-full max-w-5xl mx-auto px-4 mt-18 relative">

    <!-- Прозорий шар для закриття випадаючих меню при кліку поза ними. Він має z-40 -->
    <div v-if="isStatusMenuOpen || isSortMenuOpen" @click="closeMenus" class="fixed inset-0 z-40"></div>

    <!-- ВЕРХНЯ ПАНЕЛЬ: Віджети та Фільтри -->
    <div class="w-full flex flex-col lg:flex-row justify-between items-end gap-6 mb-1 pb-6">

      <!-- ЛІВА ЧАСТИНА: Віджети статистики (винесені в DriversStats.vue) -->
      <DriversStats :displayed-drivers="displayedDrivers" :active-drivers="activeDrivers" />

      <!-- ПРАВА ЧАСТИНА: Кнопки сортування та фільтрів. Цей блок має z-50, щоб меню були поверх overlay -->
      <div class="flex items-center gap-2 w-full lg:w-auto justify-end relative z-50">

        <!-- Кнопка сортування -->
        <div class="relative">
          <button @click="isSortMenuOpen = !isSortMenuOpen; isStatusMenuOpen = false"
                  class="w-9 h-9 rounded-full bg-white border flex items-center justify-center transition-colors shadow-sm"
                  :class="currentSort !== 'default' ? 'border-blue-300 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600'"
                  title="Сортувати">
            <SvgIcon name="sort" class="w-4 h-4" />
          </button>
          
          <transition name="menu-fade">
            <div v-show="isSortMenuOpen" class="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50">
              <div class="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Сортування</div>
              <button @click="setSort('default')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-blue-600 bg-blue-50/50': currentSort === 'default' }">
                За замовчуванням
                <span v-if="currentSort === 'default'" class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </button>
              <button @click="setSort('hours-desc')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-blue-600 bg-blue-50/50': currentSort === 'hours-desc' }">
                Години: від більшого
                <span v-if="currentSort === 'hours-desc'" class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </button>
              <button @click="setSort('hours-asc')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-blue-600 bg-blue-50/50': currentSort === 'hours-asc' }">
                Години: від меншого
                <span v-if="currentSort === 'hours-asc'" class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </button>
              <button @click="setSort('name-asc')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-blue-600 bg-blue-50/50': currentSort === 'name-asc' }">
                За ім'ям (А-Я)
                <span v-if="currentSort === 'name-asc'" class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Кнопка статусу -->
        <div class="relative">
          <button @click="isStatusMenuOpen = !isStatusMenuOpen; isSortMenuOpen = false"
                  class="h-9 px-4 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                  :class="{ 'border-blue-300 text-blue-600 bg-blue-50': currentStatus !== 'all' }">
            <div class="w-2 h-2 rounded-full transition-colors" :class="statusDotClass"></div>
            <span>{{ statusLabel }}</span>
            <SvgIcon name="chevron-down" class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="isStatusMenuOpen ? 'rotate-180' : ''" />
          </button>
          
          <transition name="menu-fade">
            <div v-show="isStatusMenuOpen" class="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50">
              <button @click="setFilter('all')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-blue-600 bg-blue-50/50': currentStatus === 'all' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6]"></div>
                  Всі водії
                </span>
                <span v-if="currentStatus === 'all'" class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </button>
              <button @click="setFilter('active')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-green-600 bg-blue-50/50': currentStatus === 'active' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]"></div>
                  На рейсі
                </span>
                <span v-if="currentStatus === 'active'" class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </button>
              <button @click="setFilter('inactive')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-gray-900 bg-blue-50/50': currentStatus === 'inactive' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                  В депо
                </span>
                <span v-if="currentStatus === 'inactive'" class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </button>
            </div>
          </transition>
        </div>

      </div>

    </div>

    <!-- РЯДОК ПОШУКУ (ПЕРЕД СІТКОЮ ВОДІЇВ) -->
    <div class="w-full mb-6 relative z-10">
      <div class="relative w-full">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Пошук водія за ім'ям або прізвищем..."
            class="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
        >
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
          <SvgIcon name="search" class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- НИЖНЯ ПАНЕЛЬ: Список (сітка) водіїв -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full relative z-10">
      <div
          v-for="driver in displayedDrivers"
          :key="driver.id"
          @click="handleCardClick(driver)"
          class="bg-white border border-gray-200 rounded-2xl p-5 transition-all duration-200 ease-in-out flex items-center gap-4 group relative overflow-hidden"
          :class="isDeleteMode ? 'cursor-pointer hover:border-red-300 shadow-[0_2px_8px_rgba(239,68,68,0.02)]' : (isAssignRouteMode ? 'cursor-pointer hover:border-blue-300 shadow-[0_2px_8px_rgba(37,99,235,0.02)]' : 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(31,38,135,0.06)]')"
      >
        <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex flex-shrink-0 items-center justify-center font-bold text-lg border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          {{ driver.name.charAt(0) }}{{ driver.surname.charAt(0) }}
        </div>

        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 transition-colors flex items-center gap-2"
              :class="isDeleteMode ? 'group-hover:text-red-600' : (isAssignRouteMode ? 'group-hover:text-blue-600' : 'group-hover:text-blue-700')">
            {{ driver.name }} {{ driver.surname }}
            <div v-if="driver.isActive" class="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_4px_#22c55e]" :title="'На рейсі: ' + driver.currentRoute"></div>
          </h3>
          <div class="flex items-center gap-3 text-sm mt-0.5">
             <span class="text-gray-500 flex items-center gap-1">
               <SvgIcon name="clock" class="w-4 h-4 text-gray-400" />
               {{ driver.working_hours }} год.
             </span>
             <span v-if="driver.isActive" class="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
               {{ driver.currentRoute }}
             </span>
          </div>
        </div>

        <!-- Іконка дії -->
        <div class="ml-auto pr-2">
          <button
              v-if="isDeleteMode"
              @click.stop="triggerDeleteConfirmation(driver)"
              class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center"
              title="Видалити водія"
          >
            <SvgIcon name="trash" class="w-5 h-5" />
          </button>

          <div v-else-if="isAssignRouteMode" class="flex gap-2">
            <button
                v-if="driver.isActive"
                @click.stop="deactivateDriver(driver.id)"
                class="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title="Зняти з рейсу"
            >
              Зняти
            </button>
            <button
                v-else
                @click.stop="openAssignModal(driver)"
                class="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                title="Призначити рейс"
            >
              Рейс
            </button>
          </div>

          <div v-else class="text-gray-300 group-hover:text-blue-500 transition-colors">
            <SvgIcon name="chevron-right" class="w-5 h-5" />
          </div>
        </div>
      </div>

      <!-- Пустий стан -->
      <div v-if="displayedDrivers.length === 0" class="col-span-1 md:col-span-2 text-center py-12 text-gray-500">
        За вказаними фільтрами водіїв не знайдено.
      </div>
    </div>

    <!-- Модальне вікно призначення маршруту -->
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isAssignModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl border border-gray-100 transform transition-all">
          <div class="flex items-start justify-between pb-6 mb-6 border-b border-gray-100 relative">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                <SvgIcon name="assign-route" class="w-7 h-7" />
              </div>
              <div>
                <h3 class="text-2xl font-semibold text-gray-800">Призначити маршрут</h3>
                <p class="text-sm text-gray-500">Водій: <span class="font-medium text-gray-700">{{ selectedDriver?.name }} {{ selectedDriver?.surname }}</span></p>
              </div>
            </div>
            <button @click="closeAssignModal" class="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50 absolute right-0 top-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-2 mb-6">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Швидкий вибір рейсу</label>
            <div class="flex flex-wrap gap-2">
              <button 
                  v-for="routeStr in ['Рейс 4B', 'Рейс 7C', 'Рейс 12A', 'Рейс 10']" 
                  :key="routeStr"
                  type="button"
                  @click="selectPresetRoute(routeStr)"
                  class="text-xs px-3 py-1.5 rounded-full border transition-all"
                  :class="inputRouteName === routeStr ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
              >
                {{ routeStr }}
              </button>
            </div>
          </div>

          <div class="space-y-1.5 mb-8">
            <label class="text-sm font-medium text-gray-700 pl-1">Або введіть назву вручну <span class="text-red-500">*</span></label>
            <input 
                v-model="inputRouteName" 
                type="text" 
                placeholder="Наприклад: Рейс 14"
                class="w-full bg-[#F8FAFC] border border-gray-200 text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                required
            >
          </div>

          <div class="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
            <button
                @click="closeAssignModal"
                class="px-6 py-3 rounded-2xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors border border-transparent hover:border-gray-200 text-sm"
            >
              Скасувати
            </button>
            <button 
                @click="saveRouteAssignment" 
                :disabled="!inputRouteName.trim()"
                class="px-8 py-3 rounded-2xl text-white bg-blue-600 hover:bg-blue-700 font-medium shadow-[0_8px_16px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(37,99,235,0.2)]"
            >
              Призначити
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Модальне вікно додавання водія -->
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isAddDriverModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl border border-gray-100 transform transition-all">
          
          <div class="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100">
                <SvgIcon name="driver-add" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-800">Додати водія</h3>
                <p class="text-xs text-gray-500">Внесіть дані нового співробітника депо</p>
              </div>
            </div>
            <button @click="closeAddDriverModal" class="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveNewDriver" class="space-y-4" novalidate>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 pl-1">Ім'я <span class="text-red-500">*</span></label>
                <input
                    v-model="addName"
                    type="text"
                    placeholder="Наприклад: John"
                    class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                    :class="addValidationErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                    required
                >
                <p v-if="addValidationErrors.name" class="text-[11px] text-red-500 pl-1">{{ addValidationErrors.name }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-700 pl-1">Прізвище <span class="text-red-500">*</span></label>
                <input
                    v-model="addSurname"
                    type="text"
                    placeholder="Наприклад: Doe"
                    class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                    :class="addValidationErrors.surname ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                    required
                >
                <p v-if="addValidationErrors.surname" class="text-[11px] text-red-500 pl-1">{{ addValidationErrors.surname }}</p>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-700 pl-1">Телефон <span class="text-red-500">*</span></label>
              <input
                  v-model="addPhone"
                  type="tel"
                  placeholder="+38 (000) 000-00-00"
                  class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                  :class="addValidationErrors.phone ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                  required
              >
              <p v-if="addValidationErrors.phone" class="text-[11px] text-red-500 pl-1">{{ addValidationErrors.phone }}</p>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-700 pl-1">Email</label>
              <input
                  v-model="addEmail"
                  type="email"
                  placeholder="info@gmail.com"
                  class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                  :class="addValidationErrors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
              >
              <p v-if="addValidationErrors.email" class="text-[11px] text-red-500 pl-1">{{ addValidationErrors.email }}</p>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-700 pl-1">Відпрацьовані години <span class="text-red-500">*</span></label>
              <div class="relative">
                <input
                    v-model="addWorkingHours"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                    :class="addValidationErrors.working_hours ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                    required
                >
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">год.</span>
              </div>
              <p v-if="addValidationErrors.working_hours" class="text-[11px] text-red-500 pl-1">{{ addValidationErrors.working_hours }}</p>
            </div>

            <div class="pt-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                  type="button"
                  @click="closeAddDriverModal"
                  class="px-5 py-2.5 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors border border-gray-100 text-sm"
              >
                Скасувати
              </button>
              <button
                  type="submit"
                  class="px-6 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors text-sm shadow-sm"
              >
                Зберегти водія
              </button>
            </div>
          </form>

        </div>
      </div>
    </transition>

    <!-- Модальне вікно підтвердження видалення водія -->
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isDeleteConfirmModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-gray-100 transform transition-all text-center">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <SvgIcon name="trash" class="w-7 h-7" />
          </div>

          <h3 class="text-xl font-bold text-gray-800 mb-2">Видалити водія?</h3>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Ви дійсно бажаєте видалити водія <span class="font-semibold text-gray-700">{{ selectedDriverForDelete?.name }} {{ selectedDriverForDelete?.surname }}</span>? Цю дію не можна буде скасувати.
          </p>

          <div class="flex gap-3 justify-center">
            <button @click="closeDeleteConfirmModal" class="px-5 py-2.5 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors text-sm flex-1">
              Скасувати
            </button>
            <button @click="confirmDeleteDriver" class="px-5 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 font-medium transition-colors text-sm flex-1 shadow-sm shadow-red-200">
              Видалити
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
ul::-webkit-scrollbar {
  width: 4px;
}
ul::-webkit-scrollbar-track {
  background: transparent;
}
ul::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 10px;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>