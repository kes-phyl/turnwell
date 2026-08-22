# Turnwell Website

Property turnaround cleaning, Milton Keynes.

## Run locally

```bash
npm install
cp .env.example .env
```

Add your Resend API key to `.env`, then:

```bash
npm run dev
```

Open http://localhost:5173

## Deploy on Vercel

1. Import the GitHub repo at [vercel.com](https://vercel.com)
2. Framework preset: **Vite** (auto detected)
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables (Settings → Environment Variables):

| Variable | Required | Example |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | `re_xxxxxxxx` (value only, no `RESEND_API_KEY=` prefix) |
| `FROM_EMAIL` | No | `Turnwell Enquiries <onboarding@resend.dev>` |
| `TO_EMAIL` | No | `enquiries@turnwell.com` (where quote requests are sent) |

6. Redeploy after adding env vars

### Resend setup

1. Create account at [resend.com](https://resend.com)
2. Create an API key
3. Verify `turnwell.com` in Resend (DNS records)
4. Once verified, set `FROM_EMAIL` to `Turnwell Enquiries <enquiries@turnwell.com>`
5. Until verified, use `Turnwell Enquiries <onboarding@resend.dev>`

Enquiries are sent to **enquiries@turnwell.com**. Customers receive a confirmation email.

## Contact form

The quote form POSTs to `/api/enquiry`, handled by a Vercel serverless function in `api/enquiry.mjs`.

WhatsApp buttons link directly to **07423 371686**.

## Build for production

```bash
npm run build
```

## Before going live

1. Verify turnwell.com in Resend
2. Confirm enquiries@turnwell.com inbox is active
3. Swap gallery photos for your own job photos when available
4. Replace reviews with real Google reviews after first jobs
