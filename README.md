# Turnwell Website

Home cleaning, carpet care and property turnaround services in Milton Keynes.

## Run locally

```bash
pnpm install
cp .env.example .env
```

Add your Resend API key to `.env`, then:

```bash
pnpm run dev
```

Open http://localhost:5173

Without `RESEND_API_KEY`, forms still validate. Requests may be stored in `data/enquiries.jsonl`. Email sending is skipped.

## Pages

| Path | Purpose |
|------|---------|
| `/` | Homepage |
| `/services.html` | Domestic and tenancy services |
| `/plans.html` | Turnwell Home Care comparison |
| `/book.html` | Guided booking request |
| `/work.html` | Genuine job photos and reviews |
| `/commercial.html` | Commercial site-visit enquiry |
| `/contact.html` | Phone, WhatsApp and message form |

## Deploy on Vercel

1. Import the GitHub repo at [vercel.com](https://vercel.com)
2. Framework preset: **Vite**
3. Build command: `pnpm run build`
4. Output directory: `dist`
5. Environment variables:

| Variable | Required | Example |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | `re_xxxxxxxx` |
| `FROM_EMAIL` | No | `Turnwell Enquiries <onboarding@resend.dev>` |
| `TO_EMAIL` | No | `enquiries@turnwell.com` |

Enquiries POST to `/api/enquiry`. Customers receive an acknowledgement email. A submitted request is **not** a confirmed booking.

WhatsApp and phone use **07423 371686**.

## Before going live

1. Verify the sending domain in Resend
2. Confirm `enquiries@turnwell.com` is monitored
3. Add genuine job photographs to Our Work
4. Publish reviews only when they can be verified
5. Confirm subscription prices with the owner before showing monthly figures
