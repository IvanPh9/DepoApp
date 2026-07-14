import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Driver, ActiveDriver } from '../models/driver.js'

export const useDriversStore = defineStore('drivers', () => {
    const driversList = ref([])
    const isDeleteMode = ref(false)
    const isAssignRouteMode = ref(false)
    const isAddDriverModalOpen = ref(false)

    // 1. ВІДНОВЛЕННЯ ДАНИХ: При запуску перевіряємо, чи є збережені дані в браузері
    const savedData = localStorage.getItem('drivers-storage')
    let parsed = null
    try {
        if (savedData) {
            parsed = JSON.parse(savedData)
        }
    } catch (e) {}

    if (parsed && parsed.length >= 10) {
        // JSON перетворює класи на звичайні об'єкти, тому нам треба відновити їхні типи
        driversList.value = parsed.map(d => {
            if (d.isActive) {
                return new ActiveDriver(d.id, d.name, d.surname, d.phone, d.email, d.working_hours, d.currentRoute)
            } else {
                return new Driver(d.id, d.name, d.surname, d.phone, d.email, d.working_hours)
            }
        })
    } else {
        // Завантажуємо стартову базу з 100 водіїв
        loadDrivers()
    }

    // 2. АВТОЗБЕРЕЖЕННЯ: Слідкуємо за масивом і при БУДЬ-ЯКІЙ зміні (видалення/додавання) зберігаємо в браузер
    watch(driversList, (state) => {
        localStorage.setItem('drivers-storage', JSON.stringify(state))
    }, { deep: true }) // deep: true дозволяє відстежувати зміни навіть всередині об'єктів

    // 3. Метод завантаження базових даних (100 водіїв)
    function loadDrivers() {
        const firstNames = ["Іван", "Петро", "Олександр", "Михайло", "Сергій", "Андрій", "Дмитро", "Василь", "Роман", "Володимир", "Микола", "Юрій", "Анатолій", "Віктор", "Олег", "Igor", "Artem", "Vlad", "Taras", "Nazar"];
        const lastNames = ["Коваленко", "Мельник", "Шевченко", "Бойко", "Кравченко", "Козак", "Лисенко", "Кузнецов", "Пищик", "Дорошенко", "Ткаченко", "Ковальчук", "Павленко", "Мороз", "Петренко", "Савченко", "Клименко", "Яковенко", "Олійник", "Бабич"];
        
        const generated = [];
        // Додаємо перших 3 фіксованих
        generated.push(new Driver(1, "John", "Doe", "+38 (050) 123-45-67", "info@gmail.com", 34));
        generated.push(new ActiveDriver(2, "Jane", "Smith", "+38 (067) 987-65-43", "allo@gmail.com", 12, "Рейс 4B"));
        generated.push(new ActiveDriver(3, "Іван", "Пищик", "+38 (093) 111-22-33", "ivan@gmail.com", 8, "Рейс 7C"));
        
        for (let i = 4; i <= 100; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const phone = `+38 (0${[50, 67, 93, 63, 97, 99, 66][Math.floor(Math.random() * 7)]}) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;
            const email = `${firstName.toLowerCase().replace(/[^a-z]/g, 'a')}${lastName.toLowerCase().substring(0,3).replace(/[^a-z]/g, 'a')}${i}@gmail.com`;
            const hours = Math.floor(Math.random() * 160);
            
            if (Math.random() < 0.25) {
                const routeNum = Math.floor(1 + Math.random() * 30);
                const routeLetter = ["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)];
                generated.push(new ActiveDriver(i, firstName, lastName, phone, email, hours, `Рейс ${routeNum}${routeLetter}`));
            } else {
                generated.push(new Driver(i, firstName, lastName, phone, email, hours));
            }
        }
        driversList.value = generated;
    }

    function addDriver(driver) {
        const driverInstance = driver instanceof Driver
            ? driver
            : (driver.isActive 
                ? new ActiveDriver(driver.id, driver.name, driver.surname, driver.phone, driver.email, driver.working_hours, driver.currentRoute)
                : new Driver(driver.id, driver.name, driver.surname, driver.phone, driver.email, driver.working_hours));

        const { isValid, errors } = driverInstance.validate()
        if (!isValid) {
            throw new Error(JSON.stringify(errors))
        }
        driversList.value.push(driverInstance)
    }

    function updateDriver(id, updatedDriver) {
        const driverInstance = updatedDriver instanceof Driver
            ? updatedDriver
            : (updatedDriver.isActive 
                ? new ActiveDriver(updatedDriver.id, updatedDriver.name, updatedDriver.surname, updatedDriver.phone, updatedDriver.email, updatedDriver.working_hours, updatedDriver.currentRoute)
                : new Driver(updatedDriver.id, updatedDriver.name, updatedDriver.surname, updatedDriver.phone, updatedDriver.email, updatedDriver.working_hours));

        const { isValid, errors } = driverInstance.validate()
        if (!isValid) {
            throw new Error(JSON.stringify(errors))
        }
        const index = driversList.value.findIndex(d => d.id === id)
        if (index !== -1) {
            driversList.value[index] = driverInstance
        }
    }

    function deleteDriver(id) {
        driversList.value = driversList.value.filter(d => d.id !== id)
    }

    const getDriverById = computed(() => {
        return (id) => driversList.value.find(driver => driver.id === id)
    })

    const activeDrivers = computed(() => {
        // Завдяки тому, що ми вище відновили типи, `instanceof` працюватиме коректно
        return driversList.value.filter(driver => driver instanceof ActiveDriver)
    })

// Дія: Зробити водія активним (перетворити Driver на ActiveDriver)
    function activateDriver(id, routeName) {
        const index = driversList.value.findIndex(d => d.id === id)

        if (index !== -1) {
            const oldDriver = driversList.value[index]

            // Створюємо новий екземпляр класу-спадкоємця
            driversList.value[index] = new ActiveDriver(
                oldDriver.id,
                oldDriver.name,
                oldDriver.surname,
                oldDriver.phone,
                oldDriver.email,
                oldDriver.working_hours,
                routeName // Передаємо маршрут, бо ActiveDriver його вимагає
            )
        }
    }

    // Дія: Зняти водія з рейсу (перетворити ActiveDriver назад на Driver)
    function deactivateDriver(id) {
        const index = driversList.value.findIndex(d => d.id === id)

        if (index !== -1) {
            const oldDriver = driversList.value[index]

            // Створюємо базовий екземпляр, втрачаючи властивості маршруту
            driversList.value[index] = new Driver(
                oldDriver.id,
                oldDriver.name,
                oldDriver.surname,
                oldDriver.phone,
                oldDriver.email,
                oldDriver.working_hours
            )
        }
    }
    return {
        driversList,
        activeDrivers,
        activateDriver,
        deactivateDriver,
        getDriverById,
        loadDrivers,
        addDriver,
        updateDriver,
        deleteDriver,
        isDeleteMode,
        isAssignRouteMode,
        isAddDriverModalOpen
    }
})