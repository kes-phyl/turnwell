import { defineConfig, loadEnv } from 'vite';
import { sendEnquiry } from './netlify/functions/lib/email.mjs';

function enquiryApiPlugin(env) {
  return {
    name: 'turnwell-enquiry-api',
    configureServer(server) {
      server.middlewares.use('/api/enquiry', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          try {
            const data = JSON.parse(body || '{}');
            process.env.RESEND_API_KEY = env.RESEND_API_KEY;
            process.env.FROM_EMAIL = env.FROM_EMAIL;

            await sendEnquiry(data);
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            console.error('Dev enquiry error:', err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({
              error: env.RESEND_API_KEY
                ? 'Unable to send enquiry. Please try WhatsApp or call us.'
                : 'Email not configured locally. Add RESEND_API_KEY to .env',
            }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [enquiryApiPlugin(env)],
  };
});
