# Telehealth Marketing Audit

Paste any telehealth website URL → Get instant marketing intelligence.

## Features

- **Marketing Teardown**: Messaging, trust signals, CTAs
- **Compliance Check**: FDA-risky claims, HIPAA mentions, licensing
- **Competitive Intel**: Services, tech stack, pricing
- **AI Visibility Score**: Schema, E-E-A-T signals
- **Recommendations**: 5 actionable improvements

## Setup

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Add your OpenAI API key to .env
# OPENAI_API_KEY=sk-...

# Run dev server
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

```bash
vercel
```

Set `OPENAI_API_KEY` in Vercel environment variables.

## How It Works

1. User enters telehealth site URL
2. Server scrapes page with Cheerio (fast, no browser needed for MVP)
3. Extracts: headlines, CTAs, trust signals, services, compliance flags
4. Sends to GPT-4o for analysis
5. Returns structured report with scores and recommendations

## Future Enhancements

- [ ] PDF export
- [ ] Shareable report links
- [ ] Meta Ad Library integration
- [ ] SEO data (Ahrefs/SEMrush API)
- [ ] Email capture for leads
- [ ] Competitor comparison mode
- [ ] Weekly monitoring alerts
