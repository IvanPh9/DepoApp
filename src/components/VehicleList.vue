<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useVehiclesStore } from '@/stores/vehicles'
import { Vehicle, ActiveVehicle } from '@/models/vehicle'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import VehiclesStats from '@/components/VehiclesStats.vue'

const router = useRouter()
const route = useRoute()
const vehiclesStore = useVehiclesStore()

const { vehiclesList: vehicles, activeVehicles } = storeToRefs(vehiclesStore)

const isDeleteMode = computed(() => vehiclesStore.isDeleteMode)
const isAssignRouteMode = computed(() => vehiclesStore.isAssignRouteMode)
const isAddVehicleModalOpen = computed(() => vehiclesStore.isAddVehicleModalOpen)

onMounted(() => {
  if (vehicles.value.length === 0) {
    vehiclesStore.loadVehicles()
  }
})

// === Сортування та Фільтри з URL query ===
const isStatusMenuOpen = ref(false)
const isSortMenuOpen = ref(false)
const isTypeMenuOpen = ref(false)

const currentStatus = computed(() => (route.query.status as string) || 'all')
const currentSort = computed(() => (route.query.sort as string) || 'default')
const currentType = computed(() => (route.query.type as string) || 'all')

const closeMenus = () => {
  isStatusMenuOpen.value = false
  isSortMenuOpen.value = false
  isTypeMenuOpen.value = false
}

const setFilter = (status: string) => {
  const query = { ...route.query }
  if (status === 'all') delete query.status
  else query.status = status
  router.replace({ path: route.path, query }).catch(() => {})
  isStatusMenuOpen.value = false
}

const setTypeFilter = (typeStr: string) => {
  const query = { ...route.query }
  if (typeStr === 'all') delete query.type
  else query.type = typeStr
  router.replace({ path: route.path, query }).catch(() => {})
  isTypeMenuOpen.value = false
}

const setSort = (sortOption: string) => {
  const query = { ...route.query }
  if (sortOption === 'default') delete query.sort
  else query.sort = sortOption
  router.replace({ path: route.path, query }).catch(() => {})
  isSortMenuOpen.value = false
}

const searchQuery = ref('')

const displayedVehicles = computed(() => {
  let result = [...vehicles.value]

  // Пошук за моделлю або бортовим номером
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(v => 
      v.model.toLowerCase().includes(q) || 
      v.boardNumber.toLowerCase().includes(q)
    )
  }

  // Фільтрація за статусом
  if (currentStatus.value === 'active') {
    result = result.filter(v => v.isActive)
  } else if (currentStatus.value === 'inactive') {
    result = result.filter(v => !v.isActive)
  }

  // Фільтрація за типом
  if (currentType.value === 'bus') {
    result = result.filter(v => v.type === 'bus')
  } else if (currentType.value === 'trolleybus') {
    result = result.filter(v => v.type === 'trolleybus')
  }

  // Сортування
  if (currentSort.value === 'board-desc') {
    result.sort((a, b) => b.boardNumber.localeCompare(a.boardNumber))
  } else if (currentSort.value === 'board-asc') {
    result.sort((a, b) => a.boardNumber.localeCompare(b.boardNumber))
  } else if (currentSort.value === 'model-asc') {
    result.sort((a, b) => a.model.localeCompare(b.model))
  }

  return result
})

const statusLabel = computed(() => {
  if (currentStatus.value === 'active') return 'На рейсі'
  if (currentStatus.value === 'inactive') return 'В депо'
  return 'Всі статуси'
})

const statusDotClass = computed(() => {
  if (currentStatus.value === 'active') return 'bg-green-500 shadow-[0_0_4px_#22c55e]'
  if (currentStatus.value === 'inactive') return 'bg-gray-400'
  return 'bg-sky-500 shadow-[0_0_4px_#0ea5e9]'
})

const typeLabel = computed(() => {
  if (currentType.value === 'bus') return 'Автобуси'
  if (currentType.value === 'trolleybus') return 'Тролейбуси'
  return 'Всі типи'
})

const typeDotClass = computed(() => {
  if (currentType.value === 'bus') return 'bg-blue-500 shadow-[0_0_4px_#3b82f6]'
  if (currentType.value === 'trolleybus') return 'bg-amber-500 shadow-[0_0_4px_#f59e0b]'
  return 'bg-sky-500 shadow-[0_0_4px_#0ea5e9]'
})

const sortLabel = computed(() => {
  if (currentSort.value === 'board-desc') return 'Бортовий номер (я-а)'
  if (currentSort.value === 'board-asc') return 'Бортовий номер (а-я)'
  if (currentSort.value === 'model-asc') return 'Модель (а-я)'
  return 'За замовчуванням'
})

// === КЛІК НА КАРТКУ ===
const handleCardClick = (vehicle: any) => {
  if (isDeleteMode.value) {
    triggerDeleteConfirmation(vehicle)
    return
  }
  if (isAssignRouteMode.value) {
    if (vehicle.isActive) {
      deactivateVehicle(vehicle.vehicleId)
    } else {
      openAssignModal(vehicle)
    }
    return
  }
  openEditModal(vehicle)
}

// === ЛОГІКА ДЕАКТИВАЦІЇ ТЗ ===
const deactivateVehicle = (id: number) => {
  vehiclesStore.deactivateVehicle(id)
}

// === ЛОГІКА ВИДАЛЕННЯ ТЗ ЧЕРЕЗ МОДАЛКУ ===
const isDeleteConfirmModalOpen = ref(false)
const selectedVehicleForDelete = ref<any>(null)

const triggerDeleteConfirmation = (vehicle: any) => {
  selectedVehicleForDelete.value = vehicle
  isDeleteConfirmModalOpen.value = true
}

const closeDeleteConfirmModal = () => {
  isDeleteConfirmModalOpen.value = false
  selectedVehicleForDelete.value = null
}

const confirmDeleteVehicle = () => {
  if (selectedVehicleForDelete.value) {
    vehiclesStore.deleteVehicle(selectedVehicleForDelete.value.vehicleId)
    closeDeleteConfirmModal()
  }
}

// === ЛОГІКА ПРИЗНАЧЕННЯ РЕЙСУ ТЗ ===
const isAssignModalOpen = ref(false)
const selectedVehicle = ref<any>(null)
const inputRouteName = ref('')

const openAssignModal = (vehicle: any) => {
  selectedVehicle.value = vehicle
  inputRouteName.value = ''
  isAssignModalOpen.value = true
}

const closeAssignModal = () => {
  isAssignModalOpen.value = false
  selectedVehicle.value = null
}

const saveRouteAssignment = () => {
  if (selectedVehicle.value && inputRouteName.value.trim()) {
    vehiclesStore.activateVehicle(selectedVehicle.value.vehicleId, inputRouteName.value.trim())
    closeAssignModal()
  }
}

const selectPresetRoute = (routeStr: string) => {
  inputRouteName.value = routeStr
}

// === ЛОГІКА ДОДАВАННЯ ТЗ ЧЕРЕЗ МОДАЛКУ ===
const addBoardNumber = ref('')
const addModel = ref('')
const addType = ref('bus')
const addValidationErrors = ref<Record<string, string>>({})

watch(() => vehiclesStore.isAddVehicleModalOpen, (newVal) => {
  if (newVal) {
    addBoardNumber.value = ''
    addModel.value = ''
    addType.value = 'bus'
    addValidationErrors.value = {}
  }
})

const closeAddVehicleModal = () => {
  vehiclesStore.isAddVehicleModalOpen = false
}

const saveNewVehicle = () => {
  addValidationErrors.value = {}

  // Генеруємо новий ID
  const maxId = vehicles.value.length > 0
      ? Math.max(...vehicles.value.map((v: any) => v.vehicleId))
      : 0
  const newId = maxId + 1

  const newVehicle = new Vehicle(
      newId,
      addBoardNumber.value,
      addModel.value,
      addType.value
  )

  const { isValid, errors } = newVehicle.validate()

  if (!isValid) {
    addValidationErrors.value = errors
    return
  }

  // Перевірка унікальності бортового номера
  const isDuplicate = vehicles.value.some((v: any) => v.boardNumber === addBoardNumber.value.trim())
  if (isDuplicate) {
    addValidationErrors.value = { boardNumber: "Транспортний засіб з таким бортовим номером вже існує" }
    return
  }

  try {
    vehiclesStore.addVehicle(newVehicle)
    closeAddVehicleModal()
  } catch (err: any) {
    try {
      const parsedErrors = JSON.parse(err.message)
      addValidationErrors.value = parsedErrors
    } catch {
      alert(err.message)
    }
  }
}

// === ЛОГІКА РЕДАГУВАННЯ ТЗ ЧЕРЕЗ МОДАЛКУ ===
const isEditModalOpen = ref(false)
const editVehicleId = ref<number | null>(null)
const editBoardNumber = ref('')
const editModel = ref('')
const editType = ref('bus')
const editValidationErrors = ref<Record<string, string>>({})

const openEditModal = (vehicle: any) => {
  editVehicleId.value = vehicle.vehicleId
  editBoardNumber.value = vehicle.boardNumber
  editModel.value = vehicle.model
  editType.value = vehicle.type || 'bus'
  editValidationErrors.value = {}
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  editVehicleId.value = null
}

const saveEditedVehicle = () => {
  if (editVehicleId.value === null) return
  editValidationErrors.value = {}

  // Отримуємо існуючий об'єкт, щоб зберегти isActive/currentRoute
  const originalVehicle = vehicles.value.find((v: any) => v.vehicleId === editVehicleId.value)
  if (!originalVehicle) return

  let updatedVehicle;
  if (originalVehicle.isActive) {
    updatedVehicle = new ActiveVehicle(
      editVehicleId.value,
      editBoardNumber.value,
      editModel.value,
      editType.value,
      originalVehicle.currentRoute
    )
  } else {
    updatedVehicle = new Vehicle(
      editVehicleId.value,
      editBoardNumber.value,
      editModel.value,
      editType.value
    )
  }

  const { isValid, errors } = updatedVehicle.validate()

  if (!isValid) {
    editValidationErrors.value = errors
    return
  }

  // Перевірка унікальності бортового номера серед інших ТЗ
  const isDuplicate = vehicles.value.some((v: any) => v.vehicleId !== editVehicleId.value && v.boardNumber === editBoardNumber.value.trim())
  if (isDuplicate) {
    editValidationErrors.value = { boardNumber: "Транспортний засіб з таким бортовим номером вже існує" }
    return
  }

  try {
    vehiclesStore.updateVehicle(editVehicleId.value, updatedVehicle)
    closeEditModal()
  } catch (err: any) {
    try {
      const parsedErrors = JSON.parse(err.message)
      editValidationErrors.value = parsedErrors
    } catch {
      alert(err.message)
    }
  }
}
</script>

<template>
  <div class="flex flex-col items-center pb-20 h-full w-full max-w-5xl mx-auto px-4 mt-18 relative">

    <!-- Прозорий шар для закриття меню сортування при кліку поза ним -->
    <div v-if="isStatusMenuOpen || isSortMenuOpen || isTypeMenuOpen" @click="closeMenus" class="fixed inset-0 z-40"></div>

    <!-- ВЕРХНЯ ПАНЕЛЬ: Статистика та Фільтри -->
    <div class="w-full flex flex-col lg:flex-row justify-between items-end gap-6 mb-1 pb-6">
      
      <!-- ЛІВА ЧАСТИНА: Статистика -->
      <VehiclesStats :displayed-vehicles="displayedVehicles" :active-vehicles="activeVehicles" />

      <!-- ПРАВА ЧАСТИНА: Сортування та Фільтри -->
      <div class="flex items-center gap-2 w-full lg:w-auto justify-end relative z-50">

        <!-- Кнопка сортування -->
        <div class="relative">
          <button @click="isSortMenuOpen = !isSortMenuOpen; isStatusMenuOpen = false; isTypeMenuOpen = false"
                  class="w-9 h-9 rounded-full bg-white border flex items-center justify-center transition-colors shadow-sm"
                  :class="currentSort !== 'default' ? 'border-sky-300 text-sky-600 bg-sky-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-sky-600'"
                  title="Сортувати">
            <SvgIcon name="sort" class="w-4 h-4" />
          </button>
          
          <transition name="menu-fade">
            <div v-show="isSortMenuOpen" class="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50">
              <div class="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Сортування</div>
              <button @click="setSort('default')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-sky-600 bg-sky-50/50': currentSort === 'default' }">
                За замовчуванням
                <span v-if="currentSort === 'default'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
              <button @click="setSort('board-asc')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-sky-600 bg-sky-50/50': currentSort === 'board-asc' }">
                Бортовий номер (а-я)
                <span v-if="currentSort === 'board-asc'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
              <button @click="setSort('board-desc')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-sky-600 bg-sky-50/50': currentSort === 'board-desc' }">
                Бортовий номер (я-а)
                <span v-if="currentSort === 'board-desc'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
              <button @click="setSort('model-asc')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-sky-600 bg-sky-50/50': currentSort === 'model-asc' }">
                Модель (а-я)
                <span v-if="currentSort === 'model-asc'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Кнопка статусу -->
        <div class="relative">
          <button @click="isStatusMenuOpen = !isStatusMenuOpen; isSortMenuOpen = false; isTypeMenuOpen = false"
                  class="h-9 px-4 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                  :class="{ 'border-sky-300 text-sky-600 bg-sky-50': currentStatus !== 'all' }">
            <div class="w-2 h-2 rounded-full transition-colors" :class="statusDotClass"></div>
            <span>{{ statusLabel }}</span>
            <SvgIcon name="chevron-down" class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="isStatusMenuOpen ? 'rotate-180' : ''" />
          </button>
          
          <transition name="menu-fade">
            <div v-show="isStatusMenuOpen" class="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50">
              <button @click="setFilter('all')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-sky-600 bg-sky-50/50': currentStatus === 'all' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_4px_#0ea5e9]"></div>
                  Всі статуси
                </span>
                <span v-if="currentStatus === 'all'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
              <button @click="setFilter('active')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-green-600 bg-sky-50/50': currentStatus === 'active' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]"></div>
                  На рейсі
                </span>
                <span v-if="currentStatus === 'active'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
              <button @click="setFilter('inactive')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-gray-900 bg-sky-50/50': currentStatus === 'inactive' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                  В депо
                </span>
                <span v-if="currentStatus === 'inactive'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Кнопка типу ТЗ -->
        <div class="relative">
          <button @click="isTypeMenuOpen = !isTypeMenuOpen; isSortMenuOpen = false; isStatusMenuOpen = false"
                  class="h-9 px-4 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                  :class="{ 'border-sky-300 text-sky-600 bg-sky-50': currentType !== 'all' }">
            <div class="w-2 h-2 rounded-full transition-colors" :class="typeDotClass"></div>
            <span>{{ typeLabel }}</span>
            <SvgIcon name="chevron-down" class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="isTypeMenuOpen ? 'rotate-180' : ''" />
          </button>
          
          <transition name="menu-fade">
            <div v-show="isTypeMenuOpen" class="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50">
              <button @click="setTypeFilter('all')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-sky-600 bg-sky-50/50': currentType === 'all' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_4px_#0ea5e9]"></div>
                  Всі типи
                </span>
                <span v-if="currentType === 'all'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
              <button @click="setTypeFilter('bus')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-blue-600 bg-sky-50/50': currentType === 'bus' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6]"></div>
                  Автобуси
                </span>
                <span v-if="currentType === 'bus'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
              <button @click="setTypeFilter('trolleybus')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between" :class="{ 'font-semibold text-amber-600 bg-sky-50/50': currentType === 'trolleybus' }">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_4px_#f59e0b]"></div>
                  Тролейбуси
                </span>
                <span v-if="currentType === 'trolleybus'" class="w-1.5 h-1.5 bg-sky-600 rounded-full"></span>
              </button>
            </div>
          </transition>
        </div>

      </div>
    </div>

    <!-- РЯДОК ПОШУКУ (ПЕРЕД СІТКОЮ ТЗ) -->
    <div class="w-full mb-6 relative z-10">
      <div class="relative w-full">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Пошук ТЗ за моделлю або бортовим номером..."
            class="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all shadow-sm"
        >
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
          <SvgIcon name="search" class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- НИЖНЯ ПАНЕЛЬ: Список (сітка) транспортних засобів -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full relative z-10">
      <div
          v-for="vehicle in displayedVehicles"
          :key="vehicle.vehicleId"
          @click="handleCardClick(vehicle)"
          class="bg-white border border-gray-200 rounded-2xl p-5 transition-all duration-200 ease-in-out flex items-center gap-4 group relative overflow-hidden"
          :class="isDeleteMode ? 'cursor-pointer hover:border-red-300 shadow-[0_2px_8px_rgba(239,68,68,0.02)]' : (isAssignRouteMode ? 'cursor-pointer hover:border-sky-300 shadow-[0_2px_8px_rgba(14,165,233,0.02)]' : 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(31,38,135,0.06)]')"
      >
        <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex flex-shrink-0 items-center justify-center font-bold text-sm border border-slate-100 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
          #{{ vehicle.boardNumber }}
        </div>

        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 transition-colors flex items-center gap-2"
              :class="isDeleteMode ? 'group-hover:text-red-600' : (isAssignRouteMode ? 'group-hover:text-sky-600' : 'group-hover:text-sky-750')">
            {{ vehicle.model }}
            <span class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border leading-none flex-shrink-0"
                  :class="vehicle.type === 'trolleybus' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'">
              {{ vehicle.type === 'trolleybus' ? 'Тролейбус' : 'Автобус' }}
            </span>
            <div v-if="vehicle.isActive" class="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_4px_#22c55e]" :title="'На рейсі: ' + vehicle.currentRoute"></div>
          </h3>
          <div class="flex items-center gap-3 text-sm mt-0.5">
             <span class="text-gray-500 flex items-center gap-1">
               <SvgIcon name="vehicle" class="w-4 h-4 text-gray-400" />
               Бортовий: {{ vehicle.boardNumber }}
             </span>
             <span v-if="vehicle.isActive" class="text-xs text-sky-600 font-medium bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
               {{ vehicle.currentRoute }}
             </span>
          </div>
        </div>

        <!-- Іконка дії -->
        <div class="ml-auto pr-2">
          <button
              v-if="isDeleteMode"
              @click.stop="triggerDeleteConfirmation(vehicle)"
              class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center"
              title="Видалити ТЗ"
          >
            <SvgIcon name="trash" class="w-5 h-5" />
          </button>

          <div v-else-if="isAssignRouteMode" class="flex gap-2">
            <button
                v-if="vehicle.isActive"
                @click.stop="deactivateVehicle(vehicle.vehicleId)"
                class="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title="Зняти з рейсу"
            >
              Зняти
            </button>
            <button
                v-else
                @click.stop="openAssignModal(vehicle)"
                class="text-xs font-semibold px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-full transition-colors"
                title="Призначити рейс"
            >
              Рейс
            </button>
          </div>

          <div v-else class="text-gray-300 group-hover:text-sky-500 transition-colors">
            <!-- Edit icon as a circle -->
            <button @click.stop="openEditModal(vehicle)" class="w-8 h-8 rounded-full flex items-center justify-center hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Пустий стан -->
      <div v-if="displayedVehicles.length === 0" class="col-span-1 md:col-span-2 text-center py-12 text-gray-500">
        За вказаними фільтрами ТЗ не знайдено.
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
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800">Призначити маршрут ТЗ</h3>
            <button @click="closeAssignModal" class="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div v-if="selectedVehicle" class="mb-4">
            <p class="text-sm text-gray-500">Транспортний засіб: <span class="font-semibold text-gray-700">#{{ selectedVehicle.boardNumber }} - {{ selectedVehicle.model }}</span></p>
          </div>

          <div class="space-y-2 mb-4">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Швидкий вибір рейсу</label>
            <div class="flex flex-wrap gap-2">
              <button 
                  v-for="routeStr in ['Рейс 4B', 'Рейс 7C', 'Рейс 12A', 'Рейс 10']" 
                  :key="routeStr"
                  type="button"
                  @click="selectPresetRoute(routeStr)"
                  class="text-xs px-3 py-1.5 rounded-full border transition-all"
                  :class="inputRouteName === routeStr ? 'border-sky-500 bg-sky-50 text-sky-600 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
              >
                {{ routeStr }}
              </button>
            </div>
          </div>

          <div class="space-y-1.5 mb-6">
            <label class="text-sm font-medium text-gray-700 pl-1">Або введіть назву вручну</label>
            <input 
                v-model="inputRouteName" 
                type="text" 
                placeholder="Наприклад: Рейс 14"
                class="w-full bg-[#F8FAFC] border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
                required
            >
          </div>

          <div class="flex gap-3 justify-end">
            <button @click="closeAssignModal" class="px-5 py-2.5 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors text-sm">
              Скасувати
            </button>
            <button 
                @click="saveRouteAssignment" 
                :disabled="!inputRouteName.trim()"
                class="px-6 py-2.5 rounded-xl text-white bg-sky-600 hover:bg-sky-700 font-medium transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Зберегти
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Модальне вікно підтвердження видалення -->
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

          <h3 class="text-xl font-bold text-gray-800 mb-2">Видалити транспортний засіб?</h3>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Ви дійсно бажаєте видалити ТЗ <span class="font-semibold text-gray-700">#{{ selectedVehicleForDelete?.boardNumber }} ({{ selectedVehicleForDelete?.model }})</span>? Цю дію не можна буде скасувати.
          </p>

          <div class="flex gap-3 justify-center">
            <button @click="closeDeleteConfirmModal" class="px-5 py-2.5 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors text-sm flex-1">
              Скасувати
            </button>
            <button @click="confirmDeleteVehicle" class="px-5 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 font-medium transition-colors text-sm flex-1 shadow-sm shadow-red-200">
              Видалити
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Модальне вікно додавання нового ТЗ -->
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isAddVehicleModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl border border-gray-100 transform transition-all">
          <div class="flex items-start justify-between pb-6 mb-6 border-b border-gray-100 relative">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center border border-sky-100">
                <SvgIcon name="vehicle" class="w-7 h-7" />
              </div>
              <div>
                <h3 class="text-2xl font-semibold text-gray-800">Додати ТЗ</h3>
                <p class="text-sm text-gray-500">Внесіть дані нового транспорту депо</p>
              </div>
            </div>
            <button @click="closeAddVehicleModal" class="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50 absolute right-0 top-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveNewVehicle" class="space-y-5" novalidate>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 pl-1">Бортовий номер <span class="text-red-500">*</span></label>
              <input
                  v-model="addBoardNumber"
                  type="text"
                  placeholder="Введіть унікальний номер, наприклад: 204"
                  class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
                  :class="addValidationErrors.boardNumber ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                  required
              >
              <p v-if="addValidationErrors.boardNumber" class="text-xs text-red-500 pl-1 mt-1">{{ addValidationErrors.boardNumber }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 pl-1">Модель <span class="text-red-500">*</span></label>
              <input
                  v-model="addModel"
                  type="text"
                  placeholder="Наприклад: Bogdan T701"
                  class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
                  :class="addValidationErrors.model ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                  required
              >
              <p v-if="addValidationErrors.model" class="text-xs text-red-500 pl-1 mt-1">{{ addValidationErrors.model }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 pl-1">Тип транспортного засобу <span class="text-red-500">*</span></label>
              <div 
                @click="addType = addType === 'bus' ? 'trolleybus' : 'bus'"
                class="relative w-full h-[46px] bg-gray-100/80 border border-gray-200/50 rounded-2xl p-1 cursor-pointer flex items-center justify-between select-none overflow-hidden transition-all"
              >
                <!-- Sliding capsule slider background -->
                <div 
                  class="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm border border-gray-200/20 transition-all duration-300 ease-out"
                  :style="{ 
                    left: addType === 'bus' ? '4px' : 'calc(50% + 2px)', 
                    right: addType === 'bus' ? 'calc(50% + 2px)' : '4px' 
                  }"
                ></div>
                
                <!-- Bus side label -->
                <div class="relative z-10 w-1/2 text-center text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                     :class="addType === 'bus' ? 'text-sky-600' : 'text-gray-400'">
                  <SvgIcon name="vehicle" class="w-4 h-4" />
                  Автобус
                </div>
                
                <!-- Trolleybus side label -->
                <div class="relative z-10 w-1/2 text-center text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                     :class="addType === 'trolleybus' ? 'text-amber-600' : 'text-gray-400'">
                  <SvgIcon name="vehicle" class="w-4 h-4 text-amber-500" />
                  Тролейбус
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                  type="button"
                  @click="closeAddVehicleModal"
                  class="px-6 py-3 rounded-2xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors border border-transparent hover:border-gray-200 text-sm"
              >
                Скасувати
              </button>
              <button
                  type="submit"
                  class="px-8 py-3 rounded-2xl text-white bg-sky-600 hover:bg-sky-700 font-medium transition-all text-sm"
              >
                Створити
              </button>
            </div>

          </form>
        </div>
      </div>
    </transition>

    <!-- Модальне вікно редагування ТЗ -->
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isEditModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl border border-gray-100 transform transition-all">
          <div class="flex items-start justify-between pb-6 mb-6 border-b border-gray-100 relative">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center border border-sky-100">
                <SvgIcon name="vehicle" class="w-7 h-7" />
              </div>
              <div>
                <h3 class="text-2xl font-semibold text-gray-800">Редагувати ТЗ</h3>
                <p class="text-sm text-gray-500">Оновіть інформацію про транспортний засіб</p>
              </div>
            </div>
            <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50 absolute right-0 top-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveEditedVehicle" class="space-y-5" novalidate>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 pl-1">Бортовий номер <span class="text-red-500">*</span></label>
              <input
                  v-model="editBoardNumber"
                  type="text"
                  class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
                  :class="editValidationErrors.boardNumber ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                  required
              >
              <p v-if="editValidationErrors.boardNumber" class="text-xs text-red-500 pl-1 mt-1">{{ editValidationErrors.boardNumber }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 pl-1">Модель <span class="text-red-500">*</span></label>
              <input
                  v-model="editModel"
                  type="text"
                  class="w-full bg-[#F8FAFC] border text-gray-800 text-sm rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
                  :class="editValidationErrors.model ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-gray-200'"
                  required
              >
              <p v-if="editValidationErrors.model" class="text-xs text-red-500 pl-1 mt-1">{{ editValidationErrors.model }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 pl-1">Тип транспортного засобу <span class="text-red-500">*</span></label>
              <div 
                @click="editType = editType === 'bus' ? 'trolleybus' : 'bus'"
                class="relative w-full h-[46px] bg-gray-100/80 border border-gray-200/50 rounded-2xl p-1 cursor-pointer flex items-center justify-between select-none overflow-hidden transition-all"
              >
                <!-- Sliding capsule slider background -->
                <div 
                  class="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm border border-gray-200/20 transition-all duration-300 ease-out"
                  :style="{ 
                    left: editType === 'bus' ? '4px' : 'calc(50% + 2px)', 
                    right: editType === 'bus' ? 'calc(50% + 2px)' : '4px' 
                  }"
                ></div>
                
                <!-- Bus side label -->
                <div class="relative z-10 w-1/2 text-center text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                     :class="editType === 'bus' ? 'text-sky-600' : 'text-gray-400'">
                  <SvgIcon name="vehicle" class="w-4 h-4" />
                  Автобус
                </div>
                
                <!-- Trolleybus side label -->
                <div class="relative z-10 w-1/2 text-center text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                     :class="editType === 'trolleybus' ? 'text-amber-600' : 'text-gray-400'">
                  <SvgIcon name="vehicle" class="w-4 h-4 text-amber-500" />
                  Тролейбус
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                  type="button"
                  @click="closeEditModal"
                  class="px-6 py-3 rounded-2xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-medium transition-colors border border-transparent hover:border-gray-200 text-sm"
              >
                Скасувати
              </button>
              <button
                  type="submit"
                  class="px-8 py-3 rounded-2xl text-white bg-sky-600 hover:bg-sky-700 font-medium shadow-[0_8px_16px_rgba(14,165,233,0.2)] hover:shadow-[0_8px_20px_rgba(14,165,233,0.3)] hover:-translate-y-0.5 transition-all text-sm"
              >
                Зберегти
              </button>
            </div>

          </form>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
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