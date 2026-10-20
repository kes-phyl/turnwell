const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromISO(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function prettyDate(value) {
  const date = fromISO(value);
  if (!date) return 'Pick a day';
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

function closeAll(except) {
  document.querySelectorAll('.field-shell.is-open').forEach((shell) => {
    if (shell !== except) shell.classList.remove('is-open');
  });
}

function bindSelect(native) {
  if (native.dataset.branded === '1') return;
  native.dataset.branded = '1';

  const shell = document.createElement('div');
  shell.className = 'field-shell';
  native.parentNode.insertBefore(shell, native);
  shell.append(native);
  native.classList.add('is-native');
  native.hidden = true;
  native.setAttribute('aria-hidden', 'true');
  native.tabIndex = -1;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'field-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');

  const menu = document.createElement('div');
  menu.className = 'field-menu';
  menu.setAttribute('role', 'listbox');

  const paint = () => {
    const selected = native.options[native.selectedIndex];
    trigger.textContent = selected?.text || 'Select';
    trigger.classList.toggle('is-placeholder', !native.value);
    trigger.disabled = native.disabled;
    shell.classList.toggle('is-disabled', native.disabled);
    [...menu.children].forEach((item, i) => {
      item.classList.toggle('is-active', native.selectedIndex === i);
    });
  };

  [...native.options].forEach((option, i) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'field-option';
    item.setAttribute('role', 'option');
    item.textContent = option.text;
    item.addEventListener('click', () => {
      native.selectedIndex = i;
      native.dispatchEvent(new Event('change', { bubbles: true }));
      shell.classList.remove('is-open');
      paint();
    });
    menu.append(item);
  });

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (native.disabled) return;
    const open = !shell.classList.contains('is-open');
    closeAll();
    shell.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (event) => event.stopPropagation());

  shell.append(trigger, menu);
  paint();
  native.addEventListener('change', paint);
  new MutationObserver(paint).observe(native, { attributes: true, attributeFilter: ['disabled'] });
}

function bindDate(native) {
  if (native.dataset.branded === '1') return;
  native.dataset.branded = '1';

  const shell = document.createElement('div');
  shell.className = 'field-shell field-date';
  native.parentNode.insertBefore(shell, native);
  shell.append(native);
  native.classList.add('is-native');
  native.hidden = true;
  native.setAttribute('aria-hidden', 'true');
  native.tabIndex = -1;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'field-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');

  const cal = document.createElement('div');
  cal.className = 'cal';

  let view = fromISO(native.value) || new Date();
  view = new Date(view.getFullYear(), view.getMonth(), 1);

  const paintTrigger = () => {
    trigger.textContent = prettyDate(native.value);
    trigger.classList.toggle('is-placeholder', !native.value);
    trigger.disabled = native.disabled;
    shell.classList.toggle('is-disabled', native.disabled);
  };

  const paintCal = () => {
    const selected = native.value;
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const start = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const today = toISO(new Date());

    cal.innerHTML = `
      <div class="cal-head">
        <button type="button" class="cal-nav" data-cal="prev" aria-label="Previous month"></button>
        <p>${MONTHS[month]} ${year}</p>
        <button type="button" class="cal-nav" data-cal="next" aria-label="Next month"></button>
      </div>
      <div class="cal-week">${DAYS.map((day) => `<span>${day}</span>`).join('')}</div>
      <div class="cal-grid"></div>
    `;

    const grid = cal.querySelector('.cal-grid');
    for (let i = 0; i < start; i += 1) {
      grid.append(document.createElement('span'));
    }
    for (let day = 1; day <= days; day += 1) {
      const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = String(day);
      if (iso === selected) btn.classList.add('is-selected');
      if (iso === today) btn.classList.add('is-today');
      btn.addEventListener('click', () => {
        native.value = iso;
        native.dispatchEvent(new Event('change', { bubbles: true }));
        native.dispatchEvent(new Event('input', { bubbles: true }));
        shell.classList.remove('is-open');
        paintTrigger();
        paintCal();
      });
      grid.append(btn);
    }

    cal.querySelector('[data-cal="prev"]').addEventListener('click', () => {
      view = new Date(year, month - 1, 1);
      paintCal();
    });
    cal.querySelector('[data-cal="next"]').addEventListener('click', () => {
      view = new Date(year, month + 1, 1);
      paintCal();
    });
  };

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (native.disabled) return;
    const open = !shell.classList.contains('is-open');
    closeAll();
    shell.classList.toggle('is-open', open);
    if (open) paintCal();
  });
  cal.addEventListener('click', (event) => event.stopPropagation());

  shell.append(trigger, cal);
  paintTrigger();
  native.addEventListener('change', paintTrigger);
  new MutationObserver(paintTrigger).observe(native, { attributes: true, attributeFilter: ['disabled'] });
}

export function bindFields(root = document) {
  root.querySelectorAll('select').forEach(bindSelect);
  root.querySelectorAll('input[type="date"]').forEach(bindDate);
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.field-shell')) closeAll();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeAll();
});

bindFields();
