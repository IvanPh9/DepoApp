<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { motion, AnimatePresence } from 'motion-v'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { useDriversStore } from '@/stores/drivers'
import { useVehiclesStore } from '@/stores/vehicles'

const driversStore = useDriversStore()
const vehiclesStore = useVehiclesStore()

const isDeleteMode = computed(() => {
  if (isDriversPage.value) return driversStore.isDeleteMode
  if (isVehiclesPage.value) return vehiclesStore.isDeleteMode
  return false
})
const isAssignRouteMode = computed(() => {
  if (isDriversPage.value) return driversStore.isAssignRouteMode
  if (isVehiclesPage.value) return vehiclesStore.isAssignRouteMode
  return false
})
const isAddDriverModalOpen = computed(() => driversStore.isAddDriverModalOpen)

// Розділив activeClass на activeBgClass та activeTextClass для правильного успадкування кольору іконками
const navLinks = [
  {
    path: '/base/drivers',
    label: 'Водії',
    activeBgClass: 'bg-blue-50/80 border-blue-400',
    activeTextClass: 'text-blue-700',
    icon: 'drivers'
  },
  {
    path: '/base/vehicle',
    label: 'Транспортні засоби',
    activeBgClass: 'bg-sky-50/80 border-sky-400',
    activeTextClass: 'text-sky-700',
    icon: 'vehicle'
  },
  {
    path: '/base/stops',
    label: 'Зупинки',
    activeBgClass: 'bg-teal-50/80 border-teal-400',
    activeTextClass: 'text-teal-700',
    icon: 'stops'
  },
  {
    path: '/base/route',
    label: 'Маршрути',
    activeBgClass: 'bg-slate-50/80 border-slate-400',
    activeTextClass: 'text-slate-700',
    icon: 'route'
  },
  {
    path: '/base/wmode',
    label: 'Режими роботи',
    activeBgClass: 'bg-amber-50/80 border-amber-400',
    activeTextClass: 'text-amber-700',
    icon: 'wmode'
  },
]

const route = useRoute()
const isBaseRoute = computed(() => route.path === '/base' || route.path === '/base/')
const isDriversPage = computed(() => route.path.startsWith('/base/drivers'))
const isVehiclesPage = computed(() => route.path.startsWith('/base/vehicle'))
const showActions = computed(() => isDriversPage.value || isVehiclesPage.value)

const actionButtons = [
  {
    id: 'add',
    label: 'Додати',
    activeBgClass: 'bg-green-50/80 border-green-400',
    activeTextClass: 'text-green-700',
    icon: 'plus'
  },
  {
    id: 'delete',
    label: 'Видалити',
    activeBgClass: 'bg-red-50/80 border-red-400',
    activeTextClass: 'text-red-700',
    icon: 'trash'
  },
  {
    id: 'assign-route',
    label: 'Призначити рейс',
    activeBgClass: 'bg-blue-50/80 border-blue-400',
    activeTextClass: 'text-blue-700',
    icon: 'assign-route'
  }
]

const handleAction = (btn: any) => {
  if (isDriversPage.value) {
    if (btn.id === 'add') {
      driversStore.isAddDriverModalOpen = true
    } else if (btn.id === 'delete') {
      driversStore.isDeleteMode = !driversStore.isDeleteMode
      driversStore.isAssignRouteMode = false
    } else if (btn.id === 'assign-route') {
      driversStore.isAssignRouteMode = !driversStore.isAssignRouteMode
      driversStore.isDeleteMode = false
    }
  } else if (isVehiclesPage.value) {
    if (btn.id === 'add') {
      vehiclesStore.isAddVehicleModalOpen = true
    } else if (btn.id === 'delete') {
      vehiclesStore.isDeleteMode = !vehiclesStore.isDeleteMode
      vehiclesStore.isAssignRouteMode = false
    } else if (btn.id === 'assign-route') {
      vehiclesStore.isAssignRouteMode = !vehiclesStore.isAssignRouteMode
      vehiclesStore.isDeleteMode = false
    }
  }
}

const liquidSpring = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
  mass: 0.9
}

const textSpring = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
  mass: 0.6
}
</script>

<template>
  <div class="page-container min-h-screen flex flex-col bg-gray-50/50">

    <nav class="flex flex-wrap justify-center items-center gap-3 p-4 fixed inset-x-0 z-100">

      <router-link
          to="/"
          class="flex flex-shrink-0 items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-md border border-gray-300 shadow-[0_8px_8px_rgba(31,38,135,0.04)] hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-gray-700 transition-colors"
      >
        <SvgIcon name="arrow-left" class="w-5 h-5" />
      </router-link>

      <!-- Центральна частина: основне меню навігації -->
      <motion.div
          class="flex flex-wrap items-center justify-center rounded-full backdrop-blur-xl"
          :animate="{
            marginTop: isBaseRoute ? 0 : -2,
            gap: isBaseRoute ? 24 : 4,
            padding: isBaseRoute ? 5 : 6,
            border: isBaseRoute ? '0px solid rgb(222,222,227)' : '1px solid rgb(222,222,227)',
            backgroundColor: isBaseRoute ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.55)',
            boxShadow: isBaseRoute
              ? '0 0 0 rgba(0,0,0,0)'
              : '0 8px 8px rgba(31,38,135,0.04), inset 0 1px 1px rgba(255,255,255,0.6)'
          }"
          :transition="liquidSpring"
      >
        <motion.div
            v-for="link in navLinks"
            :key="link.path"
            :while-tap="{ scale: 0.94 }"
            :transition="liquidSpring"
            :style="{
              padding: isBaseRoute ? '2px 4px' : '0 1px'
            }"
        >
          <router-link
              :to="link.path"
              class="relative flex items-center justify-center outline-none overflow-hidden backdrop-blur-md group transition duration-750 "
              :class="[
                route.path.includes(link.path)
                  ? link.activeTextClass
                  : (isBaseRoute ?'text-gray-700 hover:scale-103 shadow-[0_8px_8px_rgba(31,38,135,0.04)]' : 'text-gray-700 hover:scale-107 ' )
              ]"
              :style="{
                borderRadius: isBaseRoute ? '20px' : '9999px'
              }"
          >
            <motion.div
                class="absolute inset-0 border transition duration-600 ease-in-out"
                :class="[
                  route.path.includes(link.path)
                    ? `${link.activeBgClass} shadow-sm`
                    : (isBaseRoute
                        ? 'border-gray-300 bg-white/60 group-hover:bg-gray-200/60'
                        : 'border-transparent bg-transparent group-hover:bg-gray-200/60')
                ]"
                :animate="{ borderRadius: isBaseRoute ? 30 : 9999 }"
                :transition="liquidSpring"
            />

            <motion.div
                class="relative z-10 flex items-center"
                :animate="{
                  paddingTop: isBaseRoute ? 12 : 12,
                  paddingBottom: isBaseRoute ? 12 : 12,
                  paddingLeft: isBaseRoute ? 32 : 12,
                  paddingRight: isBaseRoute ? 32 : 12
                }"
                :transition="liquidSpring"
            >
              <div class="flex items-center justify-center w-5 h-5 flex-shrink-0">
                <SvgIcon :name="link.icon" class="w-5 h-5 flex-shrink-0" />
              </div>

              <AnimatePresence>
                <motion.span
                    v-if="isBaseRoute"
                    class="whitespace-nowrap text-sm font-medium"
                    :initial="{ opacity: 0, width: 0, marginLeft: 0, filter: 'blur(4px)' }"
                    :animate="{ opacity: 1, width: 'auto', marginLeft: 10, filter: 'blur(0px)' }"
                    :exit="{ opacity: 0, width: 0, marginLeft: 0, filter: 'blur(4px)' }"
                    :transition="textSpring"
                >{{ link.label }}</motion.span>
              </AnimatePresence>
            </motion.div>
          </router-link>
        </motion.div>
      </motion.div>

      <!-- Кнопки швидких дій для водіїв/ТЗ (плавний CSS слайд у центрі) -->
      <div class="actions-wrapper flex-shrink-0" :class="{ 'active': showActions }">
        <div class="flex items-center gap-2 rounded-full backdrop-blur-xl bg-white/55 border border-gray-200 shadow-[0_8px_8px_rgba(31,38,135,0.04)] p-1.5 z-50">
          <button
              v-for="btn in actionButtons"
              :key="btn.id"
              @click.stop="handleAction(btn)"
              class="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-400 group outline-none overflow-hidden"
              :title="btn.label"
              :class="[
                (isDeleteMode && btn.id === 'delete') || (isAssignRouteMode && btn.id === 'assign-route')
                  ? btn.activeTextClass
                  : 'text-gray-600 hover:text-gray-900 hover:scale-105'
              ]"
          >
            <div
                class="absolute inset-0 border transition-colors duration-500 rounded-full pointer-events-none"
                :class="[
                  (isDeleteMode && btn.id === 'delete') || (isAssignRouteMode && btn.id === 'assign-route')
                    ? `${btn.activeBgClass} shadow-sm border-gray-200`
                    : 'border-transparent bg-transparent group-hover:bg-gray-200/50'
                ]"
            ></div>

            <div class="relative z-10 flex items-center justify-center pointer-events-none">
              <SvgIcon :name="btn.icon" class="w-4 h-4 flex-shrink-0" />
            </div>
          </button>
        </div>
      </div>

    </nav>

    <div :class="isBaseRoute ? 'flex-1 flex flex-col justify-center items-center pb-20 mt-20' : 'p-6 flex justify-center'">

      <template v-if="isBaseRoute">
        <h2 class="text-center text-3xl font-semibold font-sans mb-6">Інформаційна база</h2>
        <p class="text-gray-500 text-sm mb-8 text-center max-w-md">
          Виберіть потрібний розділ у меню вище для початку роботи з базою даних.
        </p>
      </template>

      <div class="inner-content w-full max-w-7xl">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.actions-wrapper {
  display: flex;
  align-items: center;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  width: max-content;
  transform: scale(0.95);
  pointer-events: none;
  transition: max-width 0.4s cubic-bezier(0.25, 1, 0.5, 1),
              opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1),
              transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.actions-wrapper.active {
  max-width: 180px;
  opacity: 1;
  transform: scale(1);
  pointer-events: auto !important;
}
</style>