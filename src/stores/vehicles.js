import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Vehicle, ActiveVehicle } from '../models/vehicle.js'

export const useVehiclesStore = defineStore('vehicles', () => {
    const vehiclesList = ref([])
    const isDeleteMode = ref(false)
    const isAssignRouteMode = ref(false)
    const isAddVehicleModalOpen = ref(false)

    // 1. ВІДНОВЛЕННЯ ДАНИХ: При запуску перевіряємо, чи є збережені дані в браузері
    const savedData = localStorage.getItem('vehicles-storage')
    let parsed = null
    try {
        if (savedData) {
            parsed = JSON.parse(savedData)
        }
    } catch (e) {}

    // Перевіряємо, чи є в збережених даних поле 'type'. Якщо немає (стара схема), змушуємо оновитися
    const hasType = parsed && parsed.length > 0 && ('type' in parsed[0])

    if (parsed && parsed.length >= 10 && hasType) {
        // JSON перетворює класи на звичайні об'єкти, тому нам треба відновити їхні типи
        vehiclesList.value = parsed.map(v => {
            if (v.isActive) {
                return new ActiveVehicle(v.vehicleId, v.boardNumber, v.model, v.type || 'bus', v.currentRoute)
            } else {
                return new Vehicle(v.vehicleId, v.boardNumber, v.model, v.type || 'bus')
            }
        })
    } else {
        // Завантажуємо стартову базу з 100 ТЗ
        loadVehicles()
    }

    // 2. АВТОЗБЕРЕЖЕННЯ: Слідкуємо за масивом і зберігаємо в браузер при будь-яких змінах
    watch(vehiclesList, (state) => {
        localStorage.setItem('vehicles-storage', JSON.stringify(state))
    }, { deep: true })

    // 3. Метод завантаження базових даних (100 ТЗ)
    function loadVehicles() {
        const vehicleModels = [
            "Bogdan T701",
            "Mercedes-Benz Citaro",
            "Solaris Urbino 12",
            "MAN Lion's City",
            "ElectroLAZ-12",
            "Ataman A092",
            "ZAZ A10C",
            "Etalon A081",
            "Volvo 7900",
            "Iveco Urbanway"
        ];
        
        const generated = [];
        // Додаємо перших 3 фіксованих
        generated.push(new Vehicle(1, "001", "Mercedes-Benz Citaro", "bus"));
        generated.push(new ActiveVehicle(2, "002", "Bogdan T701", "trolleybus", "Рейс 4B"));
        generated.push(new ActiveVehicle(3, "003", "Solaris Urbino 12", "bus", "Рейс 7C"));
        
        for (let i = 4; i <= 100; i++) {
            const model = vehicleModels[Math.floor(Math.random() * vehicleModels.length)];
            const boardNumber = String(100 + i); // Наприклад, "104", "105" ...
            const type = (model === "Bogdan T701" || model === "ElectroLAZ-12") ? "trolleybus" : "bus";
            
            if (Math.random() < 0.25) {
                const routeNum = Math.floor(1 + Math.random() * 30);
                const routeLetter = ["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)];
                generated.push(new ActiveVehicle(i, boardNumber, model, type, `Рейс ${routeNum}${routeLetter}`));
            } else {
                generated.push(new Vehicle(i, boardNumber, model, type));
            }
        }
        vehiclesList.value = generated;
    }

    function addVehicle(vehicle) {
        const vehicleInstance = vehicle instanceof Vehicle
            ? vehicle
            : (vehicle.isActive 
                ? new ActiveVehicle(vehicle.vehicleId, vehicle.boardNumber, vehicle.model, vehicle.type, vehicle.currentRoute)
                : new Vehicle(vehicle.vehicleId, vehicle.boardNumber, vehicle.model, vehicle.type));

        const { isValid, errors } = vehicleInstance.validate()
        if (!isValid) {
            throw new Error(JSON.stringify(errors))
        }
        vehiclesList.value.push(vehicleInstance)
    }

    function updateVehicle(id, updatedVehicle) {
        const vehicleInstance = updatedVehicle instanceof Vehicle
            ? updatedVehicle
            : (updatedVehicle.isActive 
                ? new ActiveVehicle(updatedVehicle.vehicleId, updatedVehicle.boardNumber, updatedVehicle.model, updatedVehicle.type, updatedVehicle.currentRoute)
                : new Vehicle(updatedVehicle.vehicleId, updatedVehicle.boardNumber, updatedVehicle.model, updatedVehicle.type));

        const { isValid, errors } = vehicleInstance.validate()
        if (!isValid) {
            throw new Error(JSON.stringify(errors))
        }
        const index = vehiclesList.value.findIndex(v => v.vehicleId === id)
        if (index !== -1) {
            vehiclesList.value[index] = vehicleInstance
        }
    }

    function deleteVehicle(id) {
        vehiclesList.value = vehiclesList.value.filter(v => v.vehicleId !== id)
    }

    // Дія: Вивести ТЗ на рейс
    function activateVehicle(id, routeName) {
        const index = vehiclesList.value.findIndex(v => v.vehicleId === id)

        if (index !== -1) {
            const oldVal = vehiclesList.value[index]
            vehiclesList.value[index] = new ActiveVehicle(
                oldVal.vehicleId,
                oldVal.boardNumber,
                oldVal.model,
                oldVal.type,
                routeName
            )
        }
    }

    // Дія: Зняти ТЗ з рейсу
    function deactivateVehicle(id) {
        const index = vehiclesList.value.findIndex(v => v.vehicleId === id)

        if (index !== -1) {
            const oldVal = vehiclesList.value[index]
            vehiclesList.value[index] = new Vehicle(
                oldVal.vehicleId,
                oldVal.boardNumber,
                oldVal.model,
                oldVal.type
            )
        }
    }

    const getVehicleById = computed(() => {
        return (id) => vehiclesList.value.find(v => v.vehicleId === id)
    })

    const activeVehicles = computed(() => {
        return vehiclesList.value.filter(v => v instanceof ActiveVehicle)
    })

    return {
        vehiclesList,
        activeVehicles,
        activateVehicle,
        deactivateVehicle,
        getVehicleById,
        loadVehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        isDeleteMode,
        isAssignRouteMode,
        isAddVehicleModalOpen
    }
})
