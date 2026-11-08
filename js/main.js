// ==================== МОБИЛЬНАЯ НАВИГАЦИЯ ====================
const menuToggle = document.querySelector('.menu-toggle');
const siteNavigation = document.getElementById('site-navigation');

if (menuToggle && siteNavigation) {
    const desktopMenu = window.matchMedia('(min-width: 768px)');

    function setMenuOpen(open, returnFocus = false) {
        siteNavigation.hidden = !open;
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.textContent = open ? 'Закрыть меню' : 'Меню';
        if (returnFocus) menuToggle.focus();
    }

    function syncMenuLayout() {
        const focusInMenu = siteNavigation.contains(document.activeElement);
        const focusOnToggle = document.activeElement === menuToggle;
        menuToggle.hidden = desktopMenu.matches;
        setMenuOpen(desktopMenu.matches);
        if (!desktopMenu.matches && focusInMenu) menuToggle.focus();
        if (desktopMenu.matches && focusOnToggle) {
            siteNavigation.querySelector('a')?.focus();
        }
    }

    menuToggle.addEventListener('click', () => {
        if (!desktopMenu.matches) setMenuOpen(siteNavigation.hidden);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !desktopMenu.matches && !siteNavigation.hidden &&
            (siteNavigation.contains(document.activeElement) || document.activeElement === menuToggle)) {
            event.preventDefault();
            setMenuOpen(false, true);
        }
    });

    siteNavigation.addEventListener('click', (event) => {
        if (!desktopMenu.matches && event.target.closest('a')) {
            setMenuOpen(false, true);
        }
    });

    desktopMenu.addEventListener('change', syncMenuLayout);
    syncMenuLayout();
}

// ==================== МОДАЛЬНОЕ ОКНО ЗАЯВКИ ====================
// Работает только на страницах, где есть #order-dialog
// (index.html, order.html)

const orderDialog = document.getElementById('order-dialog');

if (orderDialog) {
    const orderButtons = document.querySelectorAll('[data-product]');
    const closeDialogButton = document.getElementById('close-order-dialog');
    const selectedProductInput = document.getElementById('selected-product');

    orderButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const productName = button.dataset.product;
            selectedProductInput.value = productName;
            orderDialog.showModal();
        });
    });

    if (closeDialogButton) {
        closeDialogButton.addEventListener('click', () => {
            orderDialog.close();
        });
    }
}

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
    orderForm.addEventListener('reset', () => fields.forEach(clearError));

    orderForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (successMessage) successMessage.hidden = true;
        fields.forEach(updateError);
        const firstInvalid = fields.find((field) => !field.validity.valid);
        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        if (successMessage) {
            successMessage.hidden = false;
        }

        orderForm.reset();

        if (orderDialog) {
            orderDialog.close();
        }
    });
}



// ==================== ТЕЛЕФОН ====================
// Автоматически форматирует ввод в +7 (900) 123-45-67

const phoneInputs = document.querySelectorAll('input[type="tel"]');

phoneInputs.forEach((input) => {
    input.addEventListener('input', () => {
        // Оставляем только цифры
        let digits = input.value.replace(/\D/g, '');

        // Если пусто — очищаем поле
        if (digits.length === 0) {
            input.value = '';
            return;
        }

        // Если начинается с 8 — заменяем на 7
        if (digits.startsWith('8')) {
            digits = '7' + digits.slice(1);
        }

        // Если начинается не с 7 — добавляем 7 в начало
        if (!digits.startsWith('7')) {
            digits = '7' + digits;
        }

        // Ограничиваем 11 цифрами (7 + 10)
        digits = digits.slice(0, 11);

        // Формируем строку
        let formatted = '+7';

        if (digits.length > 1) {
            formatted += ' (' + digits.slice(1, 4);
        }
        if (digits.length >= 5) {
            formatted += ') ' + digits.slice(4, 7);
        }
        if (digits.length >= 8) {
            formatted += '-' + digits.slice(7, 9);
        }
        if (digits.length >= 10) {
            formatted += '-' + digits.slice(9, 11);
        }

        input.value = formatted;
    });

    // При вставке из буфера — тоже форматируем
    input.addEventListener('paste', (event) => {
        event.preventDefault();
        const pasted = (event.clipboardData || window.clipboardData).getData('text');
        const digits = pasted.replace(/\D/g, '');
        input.value = digits;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
});

// Сворачиваемые фильтры: на компьютере всегда раскрыты.
const filtersDisclosure = document.querySelector('.filters-disclosure');
if (filtersDisclosure) {
    const wideCatalog = window.matchMedia('(min-width: 1024px)');
    const summary = filtersDisclosure.querySelector('summary');
    function updateFilterLabel() {
        summary.textContent = filtersDisclosure.open ? 'Скрыть фильтры' : 'Показать фильтры';
    }
    function syncFilters() {
        const active = document.activeElement;
        filtersDisclosure.open = wideCatalog.matches;
        updateFilterLabel();
        if (!wideCatalog.matches && filtersDisclosure.contains(active) && active !== summary) summary.focus();
        if (wideCatalog.matches && active === summary) filtersDisclosure.querySelector('input')?.focus();
    }
    filtersDisclosure.classList.add('filters-disclosure--enhanced');
    filtersDisclosure.addEventListener('toggle', updateFilterLabel);
    filtersDisclosure.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !wideCatalog.matches && filtersDisclosure.open) {
            event.preventDefault();
            filtersDisclosure.open = false;
            updateFilterLabel();
            summary.focus();
        }
    });
    wideCatalog.addEventListener('change', syncFilters);
    syncFilters();
}

// ==================== ОБРАБОТКА ДАННЫХ ТУРА ====================
// Числовые расчёты отделены от форматирования результатов.
function formatPrice(price) {
    return `${price.toLocaleString('ru-RU')} руб.`;
}

function calculateDiscount(price, discountPercent) {
    return price * discountPercent / 100;
}

function calculateFinalPrice(price, discountPercent) {
    return price - calculateDiscount(price, discountPercent);
}

function getProductStatus(product) {
    if (product.isAvailable === true) {
        return 'Доступен для бронирования';
    }
    return 'Бронирование недоступно';
}

function createProductSummary(product) {
    const finalPrice = calculateFinalPrice(product.price, product.discountPercent);
    return `${product.title}: ${formatPrice(finalPrice)}. Статус: ${getProductStatus(product)}.`;
}

// ==================== ОБРАБОТКА МАССИВА ТУРОВ ====================
function getProductTitles(products) {
    return products.map((product) => product.title);
}

function getAvailableProducts(products) {
    return products.filter((product) => product.isAvailable);
}

function searchProducts(products, query) {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => product.title.toLowerCase().includes(normalizedQuery));
}

function filterProductsByCategory(products, category) {
    if (category === 'all' || category === '') return [...products];
    return products.filter((product) => product.category === category);
}

function sortProductsByPrice(products, direction = 'asc') {
    // Сортировка копии сохраняет исходный порядок данных каталога.
    return [...products].sort((first, second) => direction === 'desc'
        ? second.price - first.price
        : first.price - second.price);
}

function findProductById(products, id) {
    return products.find((product) => product.id === id);
}

function calculateTotalPrice(products) {
    return products.reduce((total, product) => total + product.price, 0);
}

function countAvailableProducts(products) {
    let count = 0;
    for (const product of products) {
        if (product.isAvailable) count += 1;
    }
    return count;
}

function calculateAveragePrice(products) {
    if (products.length === 0) return 0;
    return Math.round(calculateTotalPrice(products) / products.length);
}

function getPreparedProducts(products, query = '', category = 'all', sortDirection = 'asc') {
    const searchResults = searchProducts(products, query);
    const filteredProducts = filterProductsByCategory(searchResults, category);
    return sortProductsByPrice(filteredProducts, sortDirection);
}

console.log('Массив туров подключён');
console.table(products);
console.log('Названия:', getProductTitles(products));
console.table(getAvailableProducts(products));
console.table(searchProducts(products, '  ПАРИЖ  '));
console.table(filterProductsByCategory(products, 'asia'));
console.table(sortProductsByPrice(products, 'asc'));
console.table(sortProductsByPrice(products, 'desc'));
console.log('Тур с id 1:', findProductById(products, 1));
console.log('Общая стоимость:', calculateTotalPrice(products));
console.log('Доступные туры:', countAvailableProducts(products));
console.log('Средняя цена:', calculateAveragePrice(products));
console.table(getPreparedProducts(products, 'тур', 'asia', 'asc'));
console.log('Описание первого тура:', createProductSummary(products[0]));

const messageElement = document.querySelector('.js-message');
const productOutputElement = document.querySelector('.product-output');
if (messageElement) {
    messageElement.textContent = 'Массив туров и функции обработки данных подключены.';
}
if (productOutputElement) {
    productOutputElement.textContent = [
        `Всего туров: ${products.length}`,
        `Доступно для бронирования: ${countAvailableProducts(products)}`,
        `Общая стоимость: ${formatPrice(calculateTotalPrice(products))}`,
        `Средняя цена: ${formatPrice(calculateAveragePrice(products))}`,
        `Результатов поиска «Париж»: ${searchProducts(products, 'Париж').length}`
    ].join('\n');
}

// Проверка текстового представления данных без интерпретации HTML-разметки.
const safeOutputExample = document.querySelector('.safe-output-example');
if (safeOutputExample) {
    safeOutputExample.textContent = '<strong>Текст пользователя</strong>';
}
