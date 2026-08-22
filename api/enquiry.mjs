import { sendEnquiry } from '../lib/email.mjs';

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
    const required = ['name', 'phone', 'email', 'customer_type', 'property_type', 'postcode', 'service'];

    for (const field of required) {
      if (!req.body?.[field]?.trim?.()) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    await sendEnquiry({
      name: req.body.name.trim(),
      phone: req.body.phone.trim(),
      email: req.body.email.trim(),
      customer_type: req.body.customer_type.trim(),
      property_type: req.body.property_type.trim(),
      postcode: req.body.postcode.trim(),
      service: req.body.service.trim(),
      preferred_date: req.body.preferred_date?.trim() || '',
      notes: req.body.notes?.trim() || '',
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Enquiry error:', err);
    return res.status(500).json({
      error: 'Unable to send enquiry. Please try WhatsApp or call us.',
    });
  }
}
