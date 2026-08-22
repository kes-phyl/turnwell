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

For production-like local testing (Netlify functions):

```bash
npm run dev:netlify
```

Open http://localhost:8888

## Contact form (email)

Submissions POST to `/api/enquiry` and are sent via [Resend](https://resend.com):

- **To:** enquiries@turnwell.com (your inbox)
- **To customer:** confirmation email automatically
- **WhatsApp buttons:** still go directly to 07423 371686

### Setup Resend (one time, ~5 minutes)

1. Create account at [resend.com](https://resend.com)
2. Copy your API key into `.env` as `RESEND_API_KEY`
3. Verify your domain `turnwell.com` in Resend (required to send from `@turnwell.com`)
4. Set `FROM_EMAIL=Turnwell Enquiries <enquiries@turnwell.com>` in `.env`
5. On Netlify deploy: add the same env vars in Site settings > Environment variables

Until your domain is verified, Resend allows sending from `onboarding@resend.dev` for testing.

## Build for production

```bash
npm run build
```

Deploy the `dist/` folder to Netlify (recommended, functions included) or connect the Git repo.

## Before going live

1. Verify turnwell.com in Resend
2. Confirm enquiries@turnwell.com inbox is active
3. Swap gallery photos for your own job photos when available
4. Replace reviews with real Google reviews after first jobs
