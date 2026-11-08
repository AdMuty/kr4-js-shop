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


// ==================== ИНТЕРАКТИВНЫЙ КАТАЛОГ ====================
const catalogState = { query: '', category: 'all', sort: 'default', min: '', max: '' };
const productsContainer = document.querySelector('[data-products-container]');

function createProductCard(product) {
    const card = document.createElement('article');
    card.classList.add('product-card');
    const image = document.createElement('img');
    image.classList.add('product-card__image');
    image.src = product.image;
    image.alt = product.title;
    image.loading = 'lazy';
    const title = document.createElement('h3');
    title.classList.add('product-card__title');
    title.textContent = product.title;
    const description = document.createElement('p');
    description.classList.add('product-card__description');
    description.textContent = product.description;
    const price = document.createElement('p');
    price.classList.add('product-card__price');
    price.textContent = `от ${formatPrice(product.price)}`;
    const status = document.createElement('p');
    status.textContent = getProductStatus(product);
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('button', 'button--primary', 'product-card__button');
    button.dataset.productId = product.id;
    button.dataset.action = 'details';
    button.textContent = 'Подробнее';
    button.setAttribute('aria-label', `Подробнее: ${product.title}`);
    card.append(image, title, description, price, status, button);
    return card;
}

function renderProducts(productsToRender) {
    if (!productsContainer) return;
    productsContainer.replaceChildren();
    const fragment = document.createDocumentFragment();
    productsToRender.forEach((product) => fragment.append(createProductCard(product)));
    productsContainer.append(fragment);
    document.querySelector('#catalog-status').textContent = `Найдено туров: ${productsToRender.length} из ${products.length}.`;
    document.querySelector('#catalog-empty').hidden = productsToRender.length !== 0;
    document.querySelector('#catalog-details').hidden = true;
}

function updateCatalog() {
    let result = filterProductsByCategory(searchProducts(products, catalogState.query), catalogState.category);
    result = result.filter((product) =>
        (catalogState.min === '' || product.price >= Number(catalogState.min)) &&
        (catalogState.max === '' || product.price <= Number(catalogState.max)));
    if (catalogState.sort === 'asc' || catalogState.sort === 'desc') {
        result = sortProductsByPrice(result, catalogState.sort);
    } else if (catalogState.sort === 'title') {
        result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    }
    renderProducts(result);
}

if (productsContainer) {
    const form = document.querySelector('.filters-form');
    const controls = {
        query: document.querySelector('#catalog-search'),
        category: document.querySelector('#category-filter'),
        sort: document.querySelector('#sort-select'),
        min: document.querySelector('#price-from'),
        max: document.querySelector('#price-to')
    };
    function readFilters() {
        Object.entries(controls).forEach(([key, control]) => { catalogState[key] = control.value; });
        updateCatalog();
    }
    form.addEventListener('input', (event) => {
        if (event.target.tagName !== 'SELECT') readFilters();
    });
    form.addEventListener('change', (event) => {
        if (event.target.tagName === 'SELECT') readFilters();
    });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        readFilters();
    });
    form.addEventListener('reset', () => {
        // Значения считываются после восстановления стандартных значений формы.
        setTimeout(readFilters, 0);
    });
    productsContainer.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="details"]');
        if (!button || !productsContainer.contains(button)) return;
        const product = findProductById(products, Number(button.dataset.productId));
        if (!product) return;
        const details = document.querySelector('#catalog-details');
        details.textContent = `${product.title}. ${product.description} Цена от ${formatPrice(product.price)}. Рейтинг: ${product.rating}. ${getProductStatus(product)}.`;
        details.hidden = false;
        details.scrollIntoView({ block: 'nearest' });
    });
    readFilters();
}

