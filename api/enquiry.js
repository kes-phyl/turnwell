import { sendEnquiry } from '../lib/email.mjs';

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
    const required = ['name', 'phone', 'email', 'customer_type', 'property_type', 'postcode', 'service'];

    for (const field of required) {
      if (!body[field]?.trim?.()) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    await sendEnquiry({
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email.trim(),
      customer_type: body.customer_type.trim(),
      property_type: body.property_type.trim(),
      postcode: body.postcode.trim(),
      service: body.service.trim(),
      preferred_date: body.preferred_date?.trim() || '',
      notes: body.notes?.trim() || '',
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Enquiry error:', err);
    return res.status(500).json({
      error: err.message || 'Unable to send enquiry. Please try WhatsApp or call us.',
    });
  }
}
