// src/models/driver.js

export class Driver {
    constructor(id, name, surname, phone, email, working_hours) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.phone = phone;
        this.email = email;
        this.working_hours = working_hours;
    }

    validate() {
        const errors = {};
        
        if (!this.name || typeof this.name !== 'string' || this.name.trim().length < 2) {
            errors.name = "Ім'я має містити щонайменше 2 символи";
        }
        
        if (!this.surname || typeof this.surname !== 'string' || this.surname.trim().length < 2) {
            errors.surname = "Прізвище має містити щонайменше 2 символи";
        }
        
        const phoneClean = this.phone ? String(this.phone).replace(/\D/g, '') : '';
        if (!this.phone || phoneClean.length < 10) {
            errors.phone = "Некоректний формат телефону (мінімум 10 цифр)";
        }
        
        if (this.email && String(this.email).trim().length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(String(this.email).trim())) {
                errors.email = "Некоректний формат email";
            }
        }
        
        const hours = Number(this.working_hours);
        if (this.working_hours === null || this.working_hours === undefined || isNaN(hours) || hours < 0) {
            errors.working_hours = "Відпрацьовані години мають бути додатним числом";
        } else if (hours > 744) {
            errors.working_hours = "Кількість годин не може перевищувати 744";
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// Успадковуємо базовий клас для активного водія
export class ActiveDriver extends Driver {
    constructor(id, name, surname, phone, email, working_hours, currentRoute = null) {
        // Викликаємо конструктор батьківського класу
        super(id, name, surname, phone, email, working_hours);

        // Додаємо специфічні поля для активного водія
        this.currentRoute = currentRoute;
        this.isActive = true;
    }
}