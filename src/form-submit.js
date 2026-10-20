export function track(event, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export async function filesToPhotos(fileList, limit = 3) {
  const files = [...fileList].slice(0, limit);
  const photos = [];

  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Photographs must be JPEG, PNG or WebP.');
    }
    const dataUrl = await readCompressed(file);
    photos.push({
      filename: file.name.replace(/[^\w.-]+/g, '_') || 'photo.jpg',
      type: 'image/jpeg',
      data: dataUrl,
    });
  }

  return photos;
}

function readCompressed(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that photograph.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('That photograph could not be processed.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function bindForm(form, { extraPayload } = {}) {
  const errorEl = form.querySelector('[data-form-error]');
  const successEl = document.querySelector('[data-form-success]') || form.parentElement.querySelector('[data-form-success]');
  const submitBtn = form.querySelector('[type="submit"]');
  const started = Date.now();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl?.classList.remove('is-visible');
    form.classList.add('form-loading');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const data = Object.fromEntries(new FormData(form));
      data.form_started_at = started;
      if (typeof extraPayload === 'function') {
        Object.assign(data, await extraPayload(form, data));
      }

      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Something went wrong');

      track('generate_lead', { enquiry_type: data.enquiry_type || 'contact' });
      form.hidden = true;
      successEl?.classList.add('is-visible');
      successEl?.focus?.();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Unable to send. Please WhatsApp or call us.';
        errorEl.classList.add('is-visible');
      }
    } finally {
      form.classList.remove('form-loading');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
