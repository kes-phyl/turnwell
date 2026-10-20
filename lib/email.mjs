import { Resend } from 'resend';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { estimateQuote, serializeEstimate } from './quotes.mjs';

const TO_EMAIL = process.env.TO_EMAIL || 'enquiries@turnwell.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Turnwell Enquiries <onboarding@resend.dev>';

function getApiKey() {
  const raw = process.env.RESEND_API_KEY?.trim();
  if (!raw) return null;
  return raw.replace(/^RESEND_API_KEY=/, '');
}

function formatResendError(error) {
  const msg = error?.message || error?.error || '';

  if (msg.includes('verify a domain') || msg.includes('testing emails to your own')) {
    return 'Resend is in test mode. In Vercel, set TO_EMAIL to the same email as your Resend account until the sending domain is verified.';
  }

  if (msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('unauthorized')) {
    return 'Invalid Resend API key. In Vercel, set RESEND_API_KEY to the key only (starts with re_), with no RESEND_API_KEY= prefix.';
  }

  if (msg.includes('from') && msg.includes('domain')) {
    return 'Sender address not verified. Set FROM_EMAIL to Turnwell Enquiries <onboarding@resend.dev> until the domain is verified in Resend.';
  }

  return msg || 'Unknown email error';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function subjectFor(data) {
  const type = data.enquiry_type;
  if (type === 'commercial') {
    return `[Commercial] ${data.business_name || data.name}, ${data.postcode}`;
  }
  if (type === 'plan') {
    return `[Home Care] ${data.plan || data.service}, ${data.postcode}`;
  }
  if (type === 'contact') {
    return `[Contact] ${data.name}`;
  }
  return `[Booking request] ${data.service || 'clean'}, ${data.postcode}`;
}

function buildRows(data, estimate) {
  const rows = [
    ['Enquiry type', data.enquiry_type],
    ['Name', data.name],
    ['Phone', data.phone],
    ['Email', data.email],
    ['Postcode', data.postcode],
    ['Address', data.address],
    ['Service', data.service],
    ['Plan', data.plan],
    ['Carpet type', data.carpet_kind],
    ['Rug size', data.rug_size],
    ['Carpet rooms', data.carpet_rooms],
    ['Stairs & landing', data.include_stairs],
    ['Stains / condition', data.stain_notes],
    ['Property size', data.property_size],
    ['Bedrooms', data.bedrooms],
    ['Bathrooms', data.bathrooms],
    ['Visits per month', data.visits_per_month],
    ['Hours per visit', data.hours_per_visit],
    ['Preferred days', data.preferred_days],
    ['Extras', data.extras],
    ['Preferred date', data.preferred_date],
    ['Availability window', data.preferred_window],
    ['Access notes', data.access_notes],
    ['Business name', data.business_name],
    ['Premises type', data.premises_type],
    ['Approx. size', data.approx_size],
    ['Frequency', data.frequency],
    ['Notes', data.notes],
    ['Requested price', data.requested_price ?? estimate.amount],
    ['Requested label', data.requested_label || estimate.label],
    ['Server estimate', estimate.label],
    ['Server estimate note', estimate.note],
    ['Photos attached', String(data.photos?.length || 0)],
  ];

  return rows.filter(([, value]) => value);
}

function buildEmailHtml(data, estimate) {
  const tableRows = buildRows(data, estimate)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 16px 10px 0;color:#7B8F7E;font-size:14px;vertical-align:top;width:160px;">${escapeHtml(label)}</td><td style="padding:10px 0;color:#1E3A2F;font-size:14px;font-weight:500;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1E3A2F;">
      <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A586;margin:0 0 8px;">New website request</p>
      <h1 style="font-family:Georgia,serif;font-size:22px;color:#1E3A2F;margin:0 0 8px;">turnwell</h1>
      <p style="font-size:13px;color:#7B8F7E;margin:0 0 24px;">Pending review. Not a confirmed booking.</p>
      <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
      <p style="margin-top:28px;font-size:13px;color:#7B8F7E;">Reply directly to this email to respond to ${escapeHtml(data.name)}.</p>
    </div>
  `;
}

function buildConfirmationHtml(data) {
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1E3A2F;">
      <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A586;margin:0 0 8px;">turnwell</p>
      <h1 style="font-family:Georgia,serif;font-size:22px;color:#1E3A2F;margin:0 0 16px;">We have received your request</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${escapeHtml(data.name)},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Thanks. We’ll be in touch.</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">We will review your details and reply with a quote or the next step, Monday to Saturday, 8am to 6pm.</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">If your request is urgent, call us on <a href="tel:+447423371686" style="color:#1E3A2F;">07423 371686</a> or message us on WhatsApp.</p>
      <p style="font-size:13px;color:#7B8F7E;margin:0;">Turnwell · Cleaned properly · Milton Keynes</p>
    </div>
  `;
}

async function sendEmail(resend, payload) {
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error('Resend error:', error);
    throw new Error(formatResendError(error));
  }
  return data;
}

async function persistRequest(record) {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    const dir = process.env.VERCEL ? '/tmp/turnwell' : join(root, 'data');
    await mkdir(dir, { recursive: true });
    await appendFile(
      join(dir, 'enquiries.jsonl'),
      `${JSON.stringify(record)}\n`,
      'utf8'
    );
  } catch (err) {
    console.error('Enquiry persistence skipped:', err.message);
  }
}

export async function sendEnquiry(data) {
  const estimate = serializeEstimate(estimateQuote(data));
  const record = {
    received_at: new Date().toISOString(),
    ...data,
    photos: (data.photos || []).map((photo) => ({
      filename: photo.filename,
      type: photo.type,
      bytes: Math.ceil((photo.data?.length || 0) * 0.75),
    })),
    server_estimate: estimate,
  };

  await persistRequest(record);

  const apiKey = getApiKey();
  if (!apiKey) {
    if (!process.env.VERCEL) {
      return { ok: true, estimate, emailSkipped: true };
    }
    throw new Error('RESEND_API_KEY is not configured');
  }

  const resend = new Resend(apiKey);
  const attachments = (data.photos || []).map((photo) => ({
    filename: photo.filename,
    content: photo.data,
  }));

  await sendEmail(resend, {
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: data.email,
    subject: subjectFor(data),
    html: buildEmailHtml(data, estimate),
    attachments: attachments.length ? attachments : undefined,
  });

  try {
    await sendEmail(resend, {
      from: FROM_EMAIL,
      to: data.email,
      subject: 'We have received your Turnwell request',
      html: buildConfirmationHtml(data),
    });
  } catch (err) {
    console.error('Customer confirmation email failed:', err.message);
  }

  return { ok: true, estimate };
}

export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: statusCode === 204 ? '' : JSON.stringify(body),
  };
}
