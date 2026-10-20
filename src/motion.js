const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  && !('ontouchstart' in window);

function samePage(url) {
  return url.origin === window.location.origin
    && url.pathname === window.location.pathname
    && url.search === window.location.search;
}

function bindPageFade() {
  if (reduce) return;

  document.documentElement.classList.add('is-ready');

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') return;
    if (samePage(url)) return;

    event.preventDefault();
    document.documentElement.classList.add('is-leaving');
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 220);
  });
}

function bindCursor() {
  if (reduce || !fine) return;

  document.documentElement.classList.add('has-brand-cursor');

  const cursor = document.createElement('div');
  cursor.className = 'brand-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 0.8 L14.2 9.8 L23.2 12 L14.2 14.2 L12 23.2 L9.8 14.2 L0.8 12 L9.8 9.8 Z"/></svg>`;
  document.body.append(cursor);

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let hot = false;
  let down = false;

  const draw = () => {
    const scale = down ? 0.72 : hot ? 1.28 : 1;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    cursor.classList.toggle('is-hot', hot);
  };

  window.addEventListener('pointermove', (event) => {
    x = event.clientX;
    y = event.clientY;
    hot = Boolean(event.target.closest('a, button, label, summary, .plan, .choice, .chip-choice, .service-tile, .card-link'));
    draw();
  }, { passive: true });

  window.addEventListener('pointerdown', () => {
    down = true;
    draw();
  });
  window.addEventListener('pointerup', () => {
    down = false;
    draw();
  });

  draw();
}

bindPageFade();
bindCursor();
