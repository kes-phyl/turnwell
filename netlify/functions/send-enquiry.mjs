import { sendEnquiry, jsonResponse } from './lib/email.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const required = ['name', 'phone', 'email', 'customer_type', 'property_type', 'postcode', 'service'];

    for (const field of required) {
      if (!data[field]?.trim()) {
        return jsonResponse(400, { error: `Missing field: ${field}` });
      }
    }

    await sendEnquiry({
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      customer_type: data.customer_type.trim(),
      property_type: data.property_type.trim(),
      postcode: data.postcode.trim(),
      service: data.service.trim(),
      preferred_date: data.preferred_date?.trim() || '',
      notes: data.notes?.trim() || '',
    });

    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('Enquiry error:', err);
    return jsonResponse(500, { error: 'Unable to send enquiry. Please try WhatsApp or call us.' });
  }
};
