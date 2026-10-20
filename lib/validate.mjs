const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9()\s-]{8,20}$/;
const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 1.6 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isHoneypot(data) {
  const trap = data.company_website || data.website || '';
  return String(trap).trim().length > 0;
}

export function isTooFast(data) {
  const started = Number(data.form_started_at);
  if (!started) return false;
  return Date.now() - started < 1200;
}

function requiredString(value, field) {
  if (!value || !String(value).trim()) {
    return `Missing field: ${field}`;
  }
  return null;
}

function clean(value) {
  return String(value ?? '').trim();
}

export function validateEnquiry(data) {
  const type = clean(data.enquiry_type) || 'booking';

  const baseErrors = [
    requiredString(data.name, 'name'),
    requiredString(data.phone, 'phone'),
    requiredString(data.email, 'email'),
  ].filter(Boolean);

  if (baseErrors.length) return { ok: false, error: baseErrors[0] };

  if (!EMAIL_RE.test(clean(data.email))) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!PHONE_RE.test(clean(data.phone))) {
    return { ok: false, error: 'Please enter a valid phone number.' };
  }

  if (type === 'commercial') {
    const missing = [
      requiredString(data.business_name, 'business_name'),
      requiredString(data.postcode, 'postcode'),
      requiredString(data.premises_type, 'premises_type'),
    ].filter(Boolean);
    if (missing.length) return { ok: false, error: missing[0] };
  } else if (type === 'contact') {
    const missing = requiredString(data.message || data.notes, 'message');
    if (missing) return { ok: false, error: missing };
  } else {
    const missing = [
      requiredString(data.service, 'service'),
      requiredString(data.postcode, 'postcode'),
    ].filter(Boolean);
    if (missing.length) return { ok: false, error: missing[0] };
  }

  const postcode = clean(data.postcode);
  if (postcode && !POSTCODE_RE.test(postcode)) {
    return { ok: false, error: 'Please enter a valid UK postcode.' };
  }

  const photos = Array.isArray(data.photos) ? data.photos : [];
  if (photos.length > MAX_PHOTOS) {
    return { ok: false, error: 'Please attach up to 3 photographs.' };
  }

  for (const photo of photos) {
    const typeName = photo.type || photo.contentType || '';
    if (!ALLOWED_PHOTO_TYPES.includes(typeName)) {
      return { ok: false, error: 'Photographs must be JPEG, PNG or WebP.' };
    }
    const b64 = String(photo.data || photo.content || '').replace(/^data:[^,]+,/, '');
    const bytes = Math.ceil((b64.length * 3) / 4);
    if (bytes > MAX_PHOTO_BYTES) {
      return { ok: false, error: 'Each photograph must be under 1.6MB.' };
    }
  }

  return { ok: true, type };
}

export function normalizeEnquiry(data) {
  const photos = Array.isArray(data.photos)
    ? data.photos.map((photo, i) => ({
        filename: photo.filename || `photo-${i + 1}.jpg`,
        type: photo.type || 'image/jpeg',
        data: String(photo.data || photo.content || '').replace(/^data:[^,]+,/, ''),
      }))
    : [];

  return {
    enquiry_type: clean(data.enquiry_type) || 'booking',
    service: clean(data.service),
    name: clean(data.name),
    phone: clean(data.phone),
    email: clean(data.email),
    postcode: clean(data.postcode).toUpperCase(),
    address: clean(data.address),
    notes: clean(data.notes || data.message),
    preferred_date: clean(data.preferred_date),
    preferred_window: clean(data.preferred_window),
    access_notes: clean(data.access_notes),
    carpet_kind: clean(data.carpet_kind),
    rug_size: clean(data.rug_size),
    carpet_rooms: clean(data.carpet_rooms),
    include_stairs: clean(data.include_stairs),
    stain_notes: clean(data.stain_notes),
    property_size: clean(data.property_size),
    bedrooms: clean(data.bedrooms),
    bathrooms: clean(data.bathrooms),
    visits_per_month: clean(data.visits_per_month),
    hours_per_visit: clean(data.hours_per_visit),
    preferred_days: clean(data.preferred_days),
    extras: clean(data.extras),
    plan: clean(data.plan),
    business_name: clean(data.business_name),
    premises_type: clean(data.premises_type),
    approx_size: clean(data.approx_size),
    frequency: clean(data.frequency),
    client_estimate: data.client_estimate || null,
    photos,
  };
}
