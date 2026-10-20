import { sendEnquiry, jsonResponse } from '../../lib/email.mjs';
import { isHoneypot, isTooFast, normalizeEnquiry, validateEnquiry } from '../../lib/validate.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');

    if (isHoneypot(body) || isTooFast(body)) {
      return jsonResponse(200, { ok: true });
    }

    const checked = validateEnquiry(body);
    if (!checked.ok) {
      return jsonResponse(400, { error: checked.error });
    }

    const data = normalizeEnquiry(body);
    const result = await sendEnquiry(data);
    return jsonResponse(200, { ok: true, estimate: result.estimate });
  } catch (err) {
    console.error('Enquiry error:', err);
    return jsonResponse(500, { error: 'Unable to send enquiry. Please try WhatsApp or call us.' });
  }
};
