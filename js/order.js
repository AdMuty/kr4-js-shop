// Состав заявки независим от корзины; цены и доступность определяются каталогом.
(() => {
    const container = document.querySelector('#order-items');
    if (!container) return;
    const form = document.querySelector('#order-form');
    const total = document.querySelector('#order-total');
    const sourceMessage = document.querySelector('#order-source-message');
    let sequence = 0;
    const promo = Promotions.mount(document.querySelector('#order-promo'), new URLSearchParams(location.search).get('promo'), () => updateTotal());

    function createElement(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function addRow(id = '', quantity = 1) {
        sequence += 1;
        const row = createElement('div', 'order-item');
        const tourField = createElement('div', 'order-form__field');
        const label = createElement('label', 'order-form__label', 'Тур');
        const select = createElement('select', 'order-form__select');
        select.id = `order-tour-${sequence}`;
        select.name = 'tour[]';
        select.dataset.orderTour = '';
        select.required = true;
        label.htmlFor = select.id;
        const placeholder = createElement('option', '', 'Выберите тур');
        placeholder.value = '';
        select.append(placeholder);
        products.forEach((product) => {
            const option = createElement('option', '', `${product.title} — ${formatPrice(product.price)}${product.isAvailable ? '' : ' (недоступен)'}`);
            option.value = product.id;
            option.disabled = !product.isAvailable;
            select.append(option);
        });
        select.value = String(id);
        const quantityField = createElement('div', 'order-form__field');
        const quantityLabel = createElement('label', 'order-form__label', 'Количество участников');
        const input = createElement('input', 'order-form__input');
        input.id = `order-people-${sequence}`;
        input.name = 'people[]';
        input.dataset.orderQuantity = '';
        input.type = 'number';
        input.min = '1';
        input.max = '20';
        input.step = '1';
        input.required = true;
        input.value = quantity;
        quantityLabel.htmlFor = input.id;
        const subtotal = createElement('p', 'order-item__subtotal');
        const remove = createElement('button', 'button button--secondary', 'Удалить тур');
        remove.type = 'button';
        remove.dataset.removeOrder = '';
        tourField.append(label, select);
        quantityField.append(quantityLabel, input);
        row.append(tourField, quantityField, subtotal, remove);
        container.append(row);
        return select;
    }

    function validationMessage(field) {
        if (field.matches('[data-order-tour]')) {
            const product = products.find((product) => product.id === Number(field.value));
            if (!product) return 'Выберите тур.';
            if (!product.isAvailable) return 'Этот тур недоступен. Выберите другое направление.';
            const duplicates = [...container.querySelectorAll('[data-order-tour]')].filter((select) => select.value === field.value);
            if (duplicates.length > 1) return 'Тур уже добавлен. Измените количество участников в одной строке, а повторную удалите.';
        }
        if (field.matches('[data-order-quantity]')) {
            const quantity = Number(field.value);
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return 'Укажите целое количество участников от 1 до 20.';
        }
        return '';
    }

    function getItems() {
        return [...container.querySelectorAll('.order-item')].map((row) => {
            const select = row.querySelector('[data-order-tour]');
            const input = row.querySelector('[data-order-quantity]');
            return { product: products.find((product) => product.id === Number(select.value)), quantity: Number(input.value), valid: !validationMessage(select) && !validationMessage(input) };
        });
    }

    function updateTotal() {
        const items = getItems();
        const rows = container.querySelectorAll('.order-item');
        items.forEach((item, index) => {
            rows[index].querySelector('.order-item__subtotal').textContent = item.valid
                ? `Стоимость тура: ${formatPrice(item.product.price * item.quantity)}` : 'Выберите доступный тур и укажите количество участников от 1 до 20.';
            rows[index].querySelector('[data-remove-order]').disabled = rows.length === 1;
        });
        const valid = items.every((item) => item.valid);
        const base = valid ? items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) : 0;
        promo.render(base);
        total.textContent = valid ? formatPrice(promo.totals(base).total) : 'Уточните состав заявки';
        document.querySelector('#order-add-tour').disabled = rows.length >= products.filter((product) => product.isAvailable).length;
        const success = document.querySelector('#success-message');
        if (success) success.hidden = true;
    }

    const params = new URLSearchParams(location.search);
    if (params.get('from') === 'cart') {
        const incoming = (params.get('items') || '').split(',');
        const selected = new Map();
        let rejected = false;
        incoming.forEach((entry) => {
            const match = /^(\d+):(\d+)$/.exec(entry);
            if (!match) { rejected = true; return; }
            const id = Number(match[1]);
            const quantity = Number(match[2]);
            const product = products.find((product) => product.id === id && product.isAvailable);
            if (!product || quantity < 1 || quantity > 20 || selected.has(id)) { rejected = true; return; }
            selected.set(id, quantity);
        });
        selected.forEach((quantity, id) => addRow(id, quantity));
        sourceMessage.textContent = selected.size
            ? 'Туры и количество участников перенесены из корзины. Здесь можно изменить состав заявки; сама корзина останется прежней.'
            : 'В корзине нет доступных туров для оформления. Добавьте тур вручную.';
        if (rejected && selected.size) sourceMessage.textContent += ' Некорректные или недоступные позиции исключены.';
    } else {
        sourceMessage.textContent = 'Выберите доступные туры и количество участников. Для нескольких направлений нажмите «Добавить тур».';
    }
    if (!container.children.length) addRow();
    updateTotal();

    document.querySelector('#order-add-tour').addEventListener('click', () => {
        const select = addRow();
        updateTotal();
        select.focus();
    });
    container.addEventListener('input', updateTotal);
    container.addEventListener('change', updateTotal);
    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-order]');
        if (!button || container.children.length === 1) return;
        button.closest('.order-item').remove();
        updateTotal();
        container.querySelector('select').focus();
        form.dispatchEvent(new CustomEvent('order:changed'));
    });
    document.addEventListener('order:select', (event) => {
        const product = products.find((product) => product.title.endsWith(event.detail));
        container.replaceChildren();
        addRow(product?.isAvailable ? product.id : '', 1);
        sourceMessage.textContent = product?.isAvailable ? 'Выбран тур из карточки. Укажите количество участников.' : 'Этот тур сейчас недоступен. Выберите другое направление.';
        updateTotal();
    });
    window.OrderSelection = {
        validationMessage,
        reset() {
            container.replaceChildren();
            addRow();
            promo.reset();
            sourceMessage.textContent = 'Выберите туры для новой заявки.';
            const url = new URL(location.href);
            ['from', 'items', 'promo'].forEach((key) => url.searchParams.delete(key));
            history.replaceState(null, '', url);
            updateTotal();
        },
        summary() {
            return getItems().filter((item) => item.valid).map((item) => `${item.product.title}: ${item.quantity} чел., ${formatPrice(item.product.price * item.quantity)}`).join('; ') + `. ${promo.code ? `Промокод ${promo.code}, скидка 10%: ${formatPrice(promo.totals(getItems().reduce((sum, item) => sum + item.product.price * item.quantity, 0)).discount)}. ` : ''}Итого: ${total.textContent}.`;
        }
    };
})();
