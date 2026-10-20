import { sendEnquiry } from '../lib/email.mjs';
import { isHoneypot, isTooFast, normalizeEnquiry, validateEnquiry } from '../lib/validate.mjs';

function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }

  return {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = parseBody(req);

    if (isHoneypot(body) || isTooFast(body)) {
      return res.status(200).json({ ok: true });
    }

    const checked = validateEnquiry(body);
    if (!checked.ok) {
      return res.status(400).json({ error: checked.error });
    }

    const data = normalizeEnquiry(body);
    const result = await sendEnquiry(data);

    return res.status(200).json({ ok: true, estimate: result.estimate });
  } catch (err) {
    console.error('Enquiry error:', err);
    return res.status(500).json({
      error: err.message || 'Unable to send enquiry. Please try WhatsApp or call us.',
    });
  }
}
