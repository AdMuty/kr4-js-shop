// ==================== ОБРАБОТКА ФОРМЫ ЗАЯВКИ ====================
// Работает только на страницах, где есть #order-form

const orderForm = document.getElementById('order-form');

if (orderForm) {
    const successMessage = document.getElementById('success-message');
    const fields = Array.from(orderForm.elements).filter((field) => field.willValidate && field.id);

    function clearError(field) {
        const errorId = `${field.id}-error`;
        document.getElementById(errorId)?.remove();
        field.removeAttribute('aria-invalid');
        field.setCustomValidity('');
        const descriptions = (field.getAttribute('aria-describedby') || '')
            .split(/\s+/).filter((id) => id && id !== errorId);
        if (descriptions.length) {
            field.setAttribute('aria-describedby', descriptions.join(' '));
        } else {
            field.removeAttribute('aria-describedby');
        }
    }

    function updateError(field) {
        clearError(field);
        if (field.id === 'order-name' && field.value.trim().length < 2) {
            field.setCustomValidity('Введите имя длиной не менее двух символов.');
        }
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
            field.setCustomValidity('Введите корректный e-mail, например name@example.ru.');
        }
        if (field.type === 'tel' && !/^7\d{10}$/.test(field.value.replace(/\D/g, ''))) {
            field.setCustomValidity('Введите телефон полностью: +7 (900) 000-00-00.');
        }
        if (field.validity.valid) return;

        const error = document.createElement('p');
        error.id = `${field.id}-error`;
        error.className = 'form-error';
        error.textContent = field.validationMessage;
        field.closest('.order-form__field').append(error);
        field.setAttribute('aria-invalid', 'true');
        const hint = field.getAttribute('aria-describedby');
        field.setAttribute('aria-describedby', [hint, error.id].filter(Boolean).join(' '));
    }

    // Повторная проверка после исправления поля, в котором уже обнаружена ошибка.
    function recheckField(event) {
        const field = event.target;
        if (fields.includes(field) && field.getAttribute('aria-invalid') === 'true') {
            updateError(field);
        }
        if (successMessage) successMessage.hidden = true;
    }

    orderForm.addEventListener('input', recheckField);
    orderForm.addEventListener('change', recheckField);
    orderForm.addEventListener('reset', () => {
        fields.forEach(clearError);
        if (successMessage) successMessage.hidden = true;
    });

    orderForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (successMessage) successMessage.hidden = true;
        fields.forEach(updateError);
        const firstInvalid = fields.find((field) => !field.validity.valid);
        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        orderForm.reset();
        if (successMessage) {
            successMessage.textContent = 'Заявка подготовлена. Это учебная форма: данные на сервер не отправляются.';
            successMessage.hidden = false;
        }

        if (orderDialog) {
            orderDialog.close();
        }
    });
}



