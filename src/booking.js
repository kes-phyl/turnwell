import { estimateQuote } from './quotes.js';
import { bindForm, filesToPhotos, track } from './form-submit.js';

const COPY = {
  carpet: { title: 'Your rug or carpet', kicker: 'A couple of details' },
  regular: { title: 'Your Home Care plan', kicker: 'How often should we come?' },
  deep: { title: 'The deep clean', kicker: 'How big is the house?' },
  end_of_tenancy: { title: 'End of tenancy', kicker: 'Keys back Friday' },
};

const form = document.getElementById('booking-form');
if (!form) throw new Error('Booking form missing');

const steps = [...form.querySelectorAll('[data-step]')];
const fill = document.querySelector('[data-progress-fill]');
const heading = document.querySelector('[data-step-title]');
const kicker = document.querySelector('[data-step-kicker]');
const context = document.querySelector('[data-context]');
const params = new URLSearchParams(window.location.search);
let current = 0;
let moving = false;

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setProgress() {
  const pct = ((current + 1) / steps.length) * 100;
  if (fill) fill.style.width = `${pct}%`;
}

function setCopy() {
  const service = form.service.value;
  const meta = COPY[service];
  if (current === 0) {
    if (kicker) kicker.textContent = 'Pick one';
    if (heading) heading.textContent = 'What needs doing?';
  } else if (current === 1 && meta) {
    if (kicker) kicker.textContent = meta.kicker;
    if (heading) heading.textContent = meta.title;
  } else if (current === 2) {
    if (kicker) kicker.textContent = 'Your details';
    if (heading) heading.textContent = 'Where should we come?';
  }
  if (context) {
    context.hidden = current === 0 || !service;
    const label = context.querySelector('[data-service-label]');
    if (label && meta) label.textContent = meta.title;
  }
}

function showStep(index, { instant = false } = {}) {
  const next = Math.max(0, Math.min(index, steps.length - 1));
  if (next === current && !instant) return;
  if (moving) return;

  const apply = () => {
    steps.forEach((step, i) => { step.hidden = i !== next; });
    current = next;
    setProgress();
    setCopy();
    renderEstimate();
    syncPanels();
    steps[current].querySelector('h2, [tabindex]')?.focus?.();
  };

  if (instant || reduceMotion()) {
    apply();
    return;
  }

  moving = true;
  const outgoing = steps[current];
  outgoing.classList.add('is-leaving');
  window.setTimeout(() => {
    outgoing.classList.remove('is-leaving');
    apply();
    moving = false;
  }, 220);
}

function payloadFromForm() {
  return Object.fromEntries(new FormData(form));
}

function syncPanels() {
  const service = form.service.value;
  form.querySelectorAll('[data-for-service]').forEach((panel) => {
    const match = panel.dataset.forService.split(',').includes(service);
    panel.hidden = !match;
    panel.querySelectorAll('input, select, textarea').forEach((field) => {
      field.disabled = !match;
    });
  });

  const kind = form.querySelector('[name="carpet_kind"]:checked')?.value;
  form.querySelectorAll('[data-for-carpet]').forEach((panel) => {
    const on = kind === panel.dataset.forCarpet;
    panel.hidden = !on;
    panel.querySelectorAll('input, select, textarea').forEach((field) => {
      field.disabled = !on;
    });
  });
}

function renderEstimate() {
  const estimate = estimateQuote(payloadFromForm());
  document.querySelectorAll('[data-estimate], [data-commit]').forEach((box) => {
    box.innerHTML = `
      <strong>${estimate.label}</strong>
      <p>${estimate.note}</p>
    `;
  });
  return estimate;
}

form.addEventListener('change', () => {
  syncPanels();
  renderEstimate();
});

form.querySelectorAll('[name="service"]').forEach((input) => {
  input.addEventListener('change', () => {
    syncPanels();
    showStep(1);
  });
});

const preset = params.get('service');
if (preset && COPY[preset]) {
  const radio = form.querySelector(`[name="service"][value="${preset}"]`);
  if (radio) radio.checked = true;
}

const presetPlan = params.get('plan');
if (presetPlan) {
  const regular = form.querySelector('[name="service"][value="regular"]');
  if (regular) regular.checked = true;
  const planRadio = form.querySelector(`[name="plan"][value="${presetPlan}"]`);
  if (planRadio) planRadio.checked = true;
}

syncPanels();
showStep(preset ? 1 : 0, { instant: true });

form.querySelectorAll('[data-next]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const required = [...steps[current].querySelectorAll('[required]:not(:disabled)')];
    const invalid = required.find((field) => !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (steps[current].dataset.step === 'details') {
      const estimate = renderEstimate();
      if (estimate.status === 'need_price') {
        document.querySelector('[data-estimate]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
    }
    showStep(current + 1);
  });
});

form.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => showStep(current - 1));
});

document.querySelector('[data-change-service]')?.addEventListener('click', () => {
  showStep(0);
});

bindForm(form, {
  extraPayload: async () => {
    const estimate = estimateQuote(payloadFromForm());
    const photoInput = form.querySelector('[name="photos"]');
    const photos = photoInput?.files?.length ? await filesToPhotos(photoInput.files) : [];
    track('booking_request', { service: form.service.value });
    return {
      enquiry_type: form.service.value === 'regular' ? 'plan' : 'booking',
      plan: estimate.plan || form.plan?.value || '',
      requested_price: estimate.amount ?? null,
      requested_label: estimate.label,
      client_estimate: estimate,
      photos,
    };
  },
});
