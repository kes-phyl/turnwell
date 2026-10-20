import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { sendEnquiry } from './lib/email.mjs';
import { isHoneypot, isTooFast, normalizeEnquiry, validateEnquiry } from './lib/validate.mjs';

const root = dirname(fileURLToPath(import.meta.url));

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
            const payload = JSON.parse(body || '{}');
            process.env.RESEND_API_KEY = env.RESEND_API_KEY;
            process.env.FROM_EMAIL = env.FROM_EMAIL;
            process.env.TO_EMAIL = env.TO_EMAIL;

            if (isHoneypot(payload) || isTooFast(payload)) {
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
              return;
            }

            const checked = validateEnquiry(payload);
            if (!checked.ok) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: checked.error }));
              return;
            }

            const result = await sendEnquiry(normalizeEnquiry(payload));
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, estimate: result.estimate }));
          } catch (err) {
            console.error('Dev enquiry error:', err.message);
            const missingKey = !env.RESEND_API_KEY || err.message?.includes('RESEND_API_KEY');
            res.statusCode = missingKey ? 200 : 500;
            res.end(JSON.stringify(
              missingKey
                ? { ok: true, warning: 'Email not configured locally. Add RESEND_API_KEY to .env to send messages.' }
                : { error: 'Unable to send enquiry. Please try WhatsApp or call us.' }
            ));
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
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          services: resolve(root, 'services.html'),
          plans: resolve(root, 'plans.html'),
          book: resolve(root, 'book.html'),
          work: resolve(root, 'work.html'),
          contact: resolve(root, 'contact.html'),
          commercial: resolve(root, 'commercial.html'),
        },
      },
    },
  };
});
