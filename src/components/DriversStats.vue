<script setup lang="ts">
import { ref, computed } from 'vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'

// Props
const props = defineProps<{
  displayedDrivers: any[]
  activeDrivers: any[]
}>()

// === Логіка для кругової діаграми ===
const hoveredSlice = ref<any>(null)

const pieSlices = computed(() => {
  if (props.displayedDrivers.length === 0) return []

  // Підраховуємо скільки водіїв у кожному діапазоні
  const buckets = [
    { label: '0–40 год.', min: 0, max: 40, color: '#bfdbfe', drivers: [] as any[], totalHours: 0 },
    { label: '41–80 год.', min: 41, max: 80, color: '#93c5fd', drivers: [] as any[], totalHours: 0 },
    { label: '81–120 год.', min: 81, max: 120, color: '#60a5fa', drivers: [] as any[], totalHours: 0 },
    { label: '121+ год.', min: 121, max: Infinity, color: '#2563eb', drivers: [] as any[], totalHours: 0 }
  ]

  let totalHours = 0

  props.displayedDrivers.forEach(driver => {
    const hours = driver.working_hours
    totalHours += hours
    const bucket = buckets.find(b => hours >= b.min && hours <= b.max)
    if (bucket) {
      bucket.drivers.push(driver)
      bucket.totalHours += hours
    }
  })

  // Фільтруємо бакети, де немає водіїв, щоб не малювати порожні слайси
  const activeBuckets = buckets.filter(b => b.drivers.length > 0)
  
  // Рахуємо суму годин серед активних бакетів
  const activeTotalHours = activeBuckets.reduce((acc, b) => acc + b.totalHours, 0)

  let cumulativeFraction = 0

  return activeBuckets.map((b) => {
    const fraction = activeTotalHours > 0 ? b.totalHours / activeTotalHours : 0

    const startAngle = cumulativeFraction * 2 * Math.PI
    const startX = Math.cos(startAngle)
    const startY = Math.sin(startAngle)

    cumulativeFraction += fraction

    const endAngle = cumulativeFraction * 2 * Math.PI
    const endX = Math.cos(endAngle)
    const endY = Math.sin(endAngle)

    const largeArcFlag = fraction > 0.5 ? 1 : 0

    const pathData = fraction === 1
        ? `M 1 0 A 1 1 0 1 1 1 -0.001 Z`
        : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`

    const getDriverWord = (count: number) => {
      if (count === 1) return 'водій'
      if (count >= 2 && count <= 4) return 'водії'
      return 'водіїв'
    }

    const driverWord = getDriverWord(b.drivers.length)
    const driversText = b.drivers.map(d => `${d.name} ${d.surname.charAt(0)}.`).slice(0, 5).join(', ') + 
      (b.drivers.length > 5 ? ` та ще ${b.drivers.length - 5}` : '')

    return {
      hours: b.label,
      count: b.drivers.length,
      driverWord,
      driversText,
      color: b.color,
      pathData
    }
  })
})
</script>

<template>
  <!-- ЛІВА ЧАСТИНА: Віджети статистики -->
  <div class="flex flex-col sm:flex-row gap-4 w-full lg:w-auto relative z-10">

    <!-- Віджет "Відпрацьовані години" -->
    <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 w-full sm:w-[22rem]">
      <div class="relative flex-shrink-0" @mouseleave="hoveredSlice = null">

        <svg viewBox="-1 -1 2 2" class="w-20 h-20 transform -rotate-90 rounded-full overflow-hidden">
          <path
              v-for="slice in pieSlices"
              :key="'slice-' + slice.hours"
              :d="slice.pathData"
              :fill="slice.color"
              :stroke="slice.color"
              stroke-width="0.015"
              stroke-linejoin="round"
              class="transition-opacity duration-200 cursor-pointer hover:opacity-85 outline-none"
              @mouseenter="hoveredSlice = slice"
          />
        </svg>

        <!-- Повідомлення порожньої діаграми -->
        <div v-if="pieSlices.length === 0" class="absolute inset-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
          <SvgIcon name="empty-chart" class="w-6 h-6" />
        </div>

        <div class="absolute inset-0 rounded-full shadow-inner pointer-events-none border border-black/5"></div>

        <!-- Тултип -->
        <div
            v-show="hoveredSlice"
            class="absolute z-50 pointer-events-none flex flex-col items-center transform transition-all duration-150 ease-out bottom-full left-1/2 -translate-x-1/2 mb-2"
            :class="hoveredSlice ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'"
        >
          <div class="relative z-10 w-max max-w-[220px] bg-white/80 backdrop-blur-md border border-white/60 text-xs rounded-xl px-3 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div class="font-semibold text-blue-700 mb-1">
              {{ hoveredSlice?.hours }} <span class="text-gray-500 font-normal">({{ hoveredSlice?.count }} {{ hoveredSlice?.driverWord }})</span>
            </div>
            <div class="text-gray-700 leading-relaxed whitespace-normal break-words">
              {{ hoveredSlice?.driversText }}
            </div>
          </div>
          <div class="w-3 h-3 bg-white/80 backdrop-blur-md border-b border-r border-white/60 transform rotate-45 -mt-1.5 shadow-sm relative z-0"></div>
        </div>

      </div>

      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold text-gray-800 leading-tight">Відпрацьовані години</h3>
        <p class="text-[10px] text-gray-400 mt-0.5 mb-2">За поточний місяць</p>
        
        <!-- Легенда діаграми -->
        <div class="space-y-1">
          <div 
              v-for="slice in pieSlices" 
              :key="'legend-' + slice.hours" 
              class="flex items-center gap-2 text-[11px] text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: slice.color }"></div>
            <span class="font-medium truncate">{{ slice.hours }}</span>
            <span class="text-gray-400 ml-auto flex-shrink-0">({{ slice.count }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Віджет "Сьогодні на рейсі" -->
    <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm w-full sm:w-64 flex flex-col justify-between">
      <div class="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
        <h3 class="text-sm font-semibold text-gray-800">Сьогодні на рейсі</h3>
        <span class="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">08.07</span>
      </div>
      <ul class="text-sm text-gray-600 space-y-1.5 overflow-y-auto max-h-20 pr-1">
        <li v-for="active in activeDrivers" :key="'active-' + active.id" class="flex justify-between items-center">
          <span class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_#22c55e]"></div>
            {{ active.name }} {{ active.surname.charAt(0) }}.
          </span>
          <span class="text-xs text-gray-400">{{ active.currentRoute }}</span>
        </li>
        <li v-if="activeDrivers.length === 0" class="text-xs text-gray-400 text-center py-2">
          Немає активних водіїв
        </li>
      </ul>
    </div>

  </div>
</template>
