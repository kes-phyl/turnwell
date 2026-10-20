import './motion.js';

const sparkle = `<svg class="brand-spark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0.8 L14.2 9.8 L23.2 12 L14.2 14.2 L12 23.2 L9.8 14.2 L0.8 12 L9.8 9.8 Z"/></svg>`;

function brand(href, modifier = '') {
  return `
    <a class="brand ${modifier}" href="${href}">
      <span class="brand-lockup">
        <span class="brand-word">turnwell</span>
        ${sparkle}
      </span>
      <span class="brand-tag">Cleaned properly</span>
    </a>
  `;
}

const LINKS = [
  ['/services.html', 'Services', 'services'],
  ['/plans.html', 'Plans', 'plans'],
  ['/work.html', 'Our work', 'work'],
  ['/commercial.html', 'Commercial', 'commercial'],
  ['/contact.html', 'Contact', 'contact'],
];

export function initLayout() {
  const page = document.body.dataset.page || '';
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const mobile = document.getElementById('mobile-bar');

  if (header) {
    header.innerHTML = `
      <div class="container header-inner">
        ${brand('/')}
        <nav class="nav" data-nav aria-label="Primary">
          ${LINKS.map(([href, label, id]) => `<a href="${href}" ${page === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
          <a class="header-phone" href="tel:+447423371686">07423 371686</a>
          <a class="btn btn-primary header-cta" href="/book.html">Book a clean</a>
        </nav>
        <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
          <span></span><span></span>
        </button>
      </div>
      <div class="mobile-nav" id="mobile-nav" data-mobile-nav hidden>
        ${LINKS.map(([href, label, id]) => `<a href="${href}" ${page === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
        <a href="tel:+447423371686">Call 07423 371686</a>
        <a class="btn btn-primary" href="/book.html">Book a clean</a>
      </div>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="container footer-grid">
        ${brand('/', 'brand-on-dark')}
        <div>
          <p class="footer-heading">Visit</p>
          <a href="/services.html">Services</a>
          <a href="/plans.html">Home Care plans</a>
          <a href="/book.html">Book a clean</a>
          <a href="/work.html">Our work</a>
          <a href="/commercial.html">Commercial cleaning</a>
          <a href="/contact.html">Contact</a>
        </div>
        <div>
          <p class="footer-heading">Milton Keynes</p>
          <a href="tel:+447423371686">07423 371686</a>
          <a href="https://wa.me/447423371686">WhatsApp</a>
          <a href="mailto:enquiries@turnwell.com">enquiries@turnwell.com</a>
          <p>CMK, Bletchley, Wolverton, Newport Pagnell.</p>
        </div>
      </div>
      <div class="container footer-meta">
        <p>© ${new Date().getFullYear()} turnwell. Milton Keynes.</p>
      </div>
    `;
  }

  if (mobile) {
    mobile.innerHTML = `
      <a class="btn btn-primary" href="/book.html">Book</a>
      <a class="btn btn-secondary" href="tel:+447423371686">Call</a>
      <a class="btn btn-clay" href="https://wa.me/447423371686">WhatsApp</a>
    `;
  }

  const toggle = header?.querySelector('[data-nav-toggle]');
  const panel = header?.querySelector('[data-mobile-nav]');
  if (panel) panel.hidden = false;

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    toggle.classList.toggle('is-open', !open);
    panel?.classList.toggle('is-open', !open);
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }
}

initLayout();
