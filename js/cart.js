// Корзина хранит только идентификаторы туров и количество участников.
(() => {
    const storageKey = 'turist-cart-v1';
    const maxQuantity = 20;
    const container = document.querySelector('#cart-items');
    const message = document.querySelector('#cart-message');
    const storageMessage = document.querySelector('#cart-storage-message');
    let storageAvailable = true;

    function reportStorageError() {
        storageAvailable = false;
        if (storageMessage) storageMessage.textContent = 'Сохранение недоступно. Корзина работает только до перезагрузки или перехода на другую страницу.';
    }

    function normalizeCart(value) {
        if (!Array.isArray(value)) return [];
        const normalized = new Map();
        value.forEach((item) => {
            if (!item || !Number.isInteger(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1) return;
            const product = products.find((product) => product.id === item.id && product.isAvailable);
            if (!product) return;
            const previous = normalized.get(item.id) || 0;
            normalized.set(item.id, Math.min(previous + item.quantity, maxQuantity));
        });
        return Array.from(normalized, ([id, quantity]) => ({ id, quantity }));
    }

    function loadCart() {
        let raw;
        try { raw = localStorage.getItem(storageKey); }
        catch { reportStorageError(); return []; }
        try { return normalizeCart(JSON.parse(raw || '[]')); }
        catch {
            if (message) message.textContent = 'Сохранённая корзина повреждена. Можно выбрать туры заново.';
            return [];
        }
    }

    let cart = loadCart();

    function saveCart() {
        try { localStorage.setItem(storageKey, JSON.stringify(cart)); }
        catch { reportStorageError(); }
    }

    function announce(text) {
        if (message) message.textContent = text;
    }

    function calculateCartTotal() {
        return cart.reduce((total, item) => {
            const product = products.find((product) => product.id === item.id);
            return total + product.price * item.quantity;
        }, 0);
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.classList.add(className);
        if (text !== undefined) node.textContent = text;
        return node;
    }

    const promo = Promotions.mount(document.querySelector('#cart-promo'), '', () => {
        updateCartTotals();
    });

    function updateCartTotals() {
        const base = calculateCartTotal();
        promo?.render(base);
        document.querySelector('#cart-total').textContent = formatPrice(promo ? promo.totals(base).total : base);
        updateCheckoutLink();
    }

    function updateCheckoutLink() {
        const link = document.querySelector('#cart-checkout');
        if (!link) return;
        const params = new URLSearchParams({ from: 'cart', items: cart.map((item) => `${item.id}:${item.quantity}`).join(',') });
        if (promo?.code) params.set('promo', promo.code);
        link.href = `order.html?${params}`;
    }

    function renderCart() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll('[data-cart-count]').forEach((badge) => { badge.textContent = count; });
        if (!container) return;
        container.replaceChildren();
        cart.forEach((item) => {
            const product = products.find((product) => product.id === item.id);
            const row = element('article', 'cart-item');
            const image = element('img', 'cart-item__image');
            image.src = product.image;
            image.alt = product.title;
            image.loading = 'lazy';
            const content = element('div', 'cart-item__content');
            const title = element('h2', 'cart-item__title', product.title);
            const description = element('section', 'cart-item__description');
            description.append(element('h3', '', 'Описание тура'), element('p', '', product.description));
            const price = element('p', '', `За участника: ${formatPrice(product.price)}`);
            const label = element('label', '', 'Количество участников');
            const input = element('input', 'cart-item__quantity');
            input.id = `cart-quantity-${item.id}`;
            input.type = 'number';
            input.min = '1';
            input.max = String(maxQuantity);
            input.step = '1';
            input.value = item.quantity;
            input.dataset.productId = item.id;
            input.setAttribute('aria-label', `Количество участников: ${product.title}`);
            label.htmlFor = input.id;
            const subtotal = element('p', 'cart-item__subtotal', `Стоимость: ${formatPrice(product.price * item.quantity)}`);
            const remove = element('button', 'button', 'Удалить');
            remove.classList.add('button--secondary');
            remove.type = 'button';
            remove.dataset.removeId = item.id;
            remove.setAttribute('aria-label', `Удалить: ${product.title}`);
            content.append(title, description, price, label, input, subtotal, remove);
            row.append(image, content);
            container.append(row);
        });
        document.querySelector('#cart-empty').hidden = cart.length > 0;
        document.querySelector('#cart-summary').hidden = cart.length === 0;
        updateCartTotals();
    }

    function commitCart(text) {
        saveCart();
        renderCart();
        announce(text);
    }

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="add-to-cart"]');
        if (!button) return;
        const product = products.find((product) => product.id === Number(button.dataset.productId));
        if (!product || !product.isAvailable) return;
        const item = cart.find((item) => item.id === product.id);
        if (item?.quantity === maxQuantity) {
            announce('Для одного тура можно выбрать не более 20 участников.');
            return;
        }
        if (item) item.quantity += 1;
        else cart.push({ id: product.id, quantity: 1 });
        commitCart(`${product.title} добавлен в корзину. Участников: ${item ? item.quantity : 1}.`);
    });

    if (container) {
        container.addEventListener('change', (event) => {
            const input = event.target.closest('[data-product-id]');
            if (!input) return;
            const item = cart.find((item) => item.id === Number(input.dataset.productId));
            if (!item) return;
            const quantity = Number(input.value);
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
                input.value = item.quantity;
                announce('Введите целое количество участников от 1 до 20. Сохранено предыдущее значение.');
                return;
            }
            item.quantity = quantity;
            // Сохраняется существующий DOM: изменение поля не прерывает последующий клик.
            saveCart();
            input.closest('.cart-item__content').querySelector('.cart-item__subtotal').textContent = `Стоимость: ${formatPrice(products.find((product) => product.id === item.id).price * quantity)}`;
            updateCartTotals();
            document.querySelectorAll('[data-cart-count]').forEach((badge) => {
                badge.textContent = cart.reduce((total, item) => total + item.quantity, 0);
            });
            announce('Количество участников и стоимость обновлены.');
        });
        container.addEventListener('click', (event) => {
            const button = event.target.closest('[data-remove-id]');
            if (!button) return;
            const id = Number(button.dataset.removeId);
            const index = cart.findIndex((item) => item.id === id);
            cart = cart.filter((item) => item.id !== id);
            commitCart('Тур удалён из корзины.');
            const buttons = container.querySelectorAll('[data-remove-id]');
            (buttons[Math.min(index, buttons.length - 1)] || document.querySelector('.cart > a')).focus();
        });
        document.querySelector('#cart-clear').addEventListener('click', () => {
            cart = [];
            promo?.reset();
            commitCart('Корзина очищена.');
            document.querySelector('.cart > a').focus();
        });
    }

    window.addEventListener('storage', (event) => {
        if (storageAvailable && (event.key === storageKey || event.key === null)) {
            cart = loadCart();
            renderCart();
            announce('Корзина обновлена в другой вкладке.');
        }
    });
    renderCart();
})();
