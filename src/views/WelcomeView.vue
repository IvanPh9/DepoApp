<script setup lang="ts">

</script>

<template>
  <div class="flex-1 flex flex-col justify-center items-center pb-20 h-full">
    <header class="text-center mb-8">
      <h1 class=" text-3xl font-semibold">СумиЕлектроавтотранс</h1>
      <p>Вітаємо в панелі керування. Оберіть необхідний розділ для початку роботи:</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-1 gap-4 w-full max-w-4xl">
      <router-link to="/base" class="bg-sky-100 p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
        <h3 class="text-2xl font-semibold">Інформаційна база системи</h3>
        <p>Керування водіями, тролейбусами та маршрутами</p>
      </router-link>

      <div class="bg-gray-50 p-6 text-gray-300 rounded-lg text-center">
        <h3 class="text-2xl font-semibold">Розрахунок розкладу чи завантаження з архіву</h3>
        <p>Запуск алгоритму в дію</p>
      </div>

      <div class="bg-gray-50 p-6 text-gray-300 rounded-lg text-center">
        <h3 class="text-2xl font-semibold">Аналіз та редагування розкладу</h3>
        <p>Регулювання створених розкладів</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>