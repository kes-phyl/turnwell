import { Resend } from 'resend';

const TO_EMAIL = 'enquiries@turnwell.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Turnwell Enquiries <onboarding@resend.dev>';

function buildEmailHtml(data) {
  const rows = [
    ['Name', data.name],
    ['Phone', data.phone],
    ['Email', data.email],
    ['Customer type', data.customer_type],
    ['Property', data.property_type],
    ['Postcode', data.postcode],
    ['Service', data.service],
    ['Preferred date', data.preferred_date || 'Flexible'],
    ['Notes', data.notes || 'None'],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 16px 10px 0;color:#5A5A5A;font-size:14px;vertical-align:top;width:140px;">${label}</td><td style="padding:10px 0;color:#1B2A41;font-size:14px;font-weight:500;">${value}</td></tr>`
    )
    .join('');

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#2C2C2C;">
      <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#A68B6A;margin:0 0 8px;">New quote request</p>
      <h1 style="font-family:Georgia,serif;font-size:22px;color:#1B2A41;margin:0 0 24px;">Turnwell website enquiry</h1>
      <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
      <p style="margin-top:28px;font-size:13px;color:#5A5A5A;">Reply directly to this email to respond to ${data.name}.</p>
    </div>
  `;
}

function buildConfirmationHtml(name) {
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#2C2C2C;">
      <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#A68B6A;margin:0 0 8px;">Turnwell</p>
      <h1 style="font-family:Georgia,serif;font-size:22px;color:#1B2A41;margin:0 0 16px;">We have received your quote request</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${name},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Thank you for contacting Turnwell. We will review your property details and send a fixed quote within 2 hours, Monday to Saturday, 8am to 6pm.</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">If your request is urgent, call us on <a href="tel:+447423371686" style="color:#1B2A41;">07423 371686</a> or message us on WhatsApp.</p>
      <p style="font-size:13px;color:#5A5A5A;margin:0;">Turnwell · Property Turnaround Specialists · Milton Keynes</p>
    </div>
  `;
}

export async function sendEnquiry(data) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: data.email,
    subject: `Quote request: ${data.postcode}, ${data.property_type}, ${data.service}`,
    html: buildEmailHtml(data),
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: 'We have received your Turnwell quote request',
    html: buildConfirmationHtml(data.name),
  });

  return { ok: true };
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
