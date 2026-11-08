// Общий расчёт промокода для корзины и заявки.
window.Promotions = (() => {
    const validCode = 'TRAVEL10';
    const percent = 10;
    const normalize = (value) => String(value || '').trim().toUpperCase();
    function calculate(base, code) {
        const discount = normalize(code) === validCode ? Math.round(base * percent) / 100 : 0;
        return { base, discount, total: Math.round((base - discount) * 100) / 100 };
    }
    function mount(root, initialCode, onChange) {
        if (!root) return null;
        let applied = normalize(initialCode) === validCode ? validCode : '';
        const field = document.createElement('div');
        field.className = 'order-form__field promo__field';
        const label = document.createElement('label');
        label.htmlFor = 'promo-code';
        label.textContent = 'Промокод';
        const input = document.createElement('input');
        input.id = 'promo-code';
        input.type = 'text';
        input.className = 'order-form__input';
        input.autocomplete = 'off';
        input.maxLength = 30;
        input.value = applied;
        input.setAttribute('aria-describedby', 'promo-hint promo-message');
        const hint = document.createElement('p');
        hint.id = 'promo-hint';
        hint.textContent = 'TRAVEL10 — скидка 10% на всю сумму. Промокоды не суммируются.';
        const actions = document.createElement('div');
        actions.className = 'promo__actions';
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.className = 'button button--secondary';
        apply.textContent = 'Применить';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'button button--secondary';
        remove.textContent = 'Убрать промокод';
        const message = document.createElement('p');
        message.id = 'promo-message';
        message.setAttribute('role', 'status');
        const breakdown = document.createElement('p');
        breakdown.className = 'promo__breakdown';
        field.append(label, input);
        actions.append(apply, remove);
        root.append(field, hint, actions, message, breakdown);
        function notify() {
            remove.hidden = !applied;
            onChange();
        }
        function applyCode() {
            const candidate = normalize(input.value);
            applied = candidate === validCode ? validCode : '';
            input.value = candidate;
            input.setAttribute('aria-invalid', String(!applied));
            message.textContent = applied ? 'Промокод TRAVEL10 применён: скидка 10%.' : 'Промокод не найден. Скидка не применяется.';
            notify();
        }
        apply.addEventListener('click', applyCode);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') { event.preventDefault(); applyCode(); }
        });
        input.addEventListener('input', () => {
            input.removeAttribute('aria-invalid');
            message.textContent = '';
            if (applied) { applied = ''; notify(); }
        });
        remove.addEventListener('click', () => {
            applied = '';
            input.value = '';
            input.removeAttribute('aria-invalid');
            message.textContent = 'Промокод удалён.';
            notify();
            input.focus();
        });
        remove.hidden = !applied;
        return {
            get code() { return applied; },
            totals(base) { return calculate(base, applied); },
            render(base) {
                const values = calculate(base, applied);
                breakdown.textContent = `Без скидки: ${formatPrice(values.base)}. Скидка${applied ? ' 10%' : ''}: ${formatPrice(values.discount)}.`;
            },
            reset() {
                applied = ''; input.value = ''; message.textContent = '';
                input.removeAttribute('aria-invalid'); remove.hidden = true;
            }
        };
    }
    return { calculate, mount };
})();
