# BypassrAI

AI humanizer: convert AI-generated text into human-sounding text that passes AI detectors. Humanize, paraphrase, and check AI score.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages (UI only — no API yet)

- **Landing** `/` — Hero, 3 steps, trust, testimonials, FAQ
- **AI Humanizer** `/humanize` — Paste text, Humanize / Check for AI (placeholder)
- **AI Detector** `/ai-check` — Paste text, Check for AI (placeholder)
- **Tools** (dropdown): **Paraphraser** `/paraphrase`, **Grammar checker** `/grammar-checker`, **Summarizer** `/summarizer`, **Translator** `/translator`
- **Auth** `/login`, `/signup`, `/forgot-password`
- **Help** `/help` (FAQ), `/help/how-it-works`, `/contact`
- **Pricing** `/pricing`
- **Legal** `/privacy`, `/terms` (placeholders)

## Docs

- `docs/ARCHITECTURE.md` — System design
- `docs/TECH_STACK.md` — Cheapest & easiest stack (Next.js, Supabase, Stripe, LLM API)
- `docs/UI_DESIGN.md` — Design direction (NaturalWrite-inspired)
- `docs/MVP.md` — MVP scope and phases
- `docs/IMPLEMENTATION_NOTES.md` — Auth (Supabase + Google), backend auth, quotas, billing
- `docs/PLANNING_CHECKLIST.md` — **AI API, Stripe/pricing, anonymous tracking, rate limiting, env vars, and what’s left to plan**
- `docs/AI_PROVIDERS.md` — **Humanizer model choice (Claude 3.5 Sonnet vs GPT-4o-mini), AI detector APIs vs DIY with LLM**
- `docs/PRICING_RESEARCH.md` — **Competitor free/paid/tiers research; recommended: 250 free, 2K trial, $9/mo 10K words**
- `scripts/test-humanizer-models.mjs` — **Run sample text through OpenAI + Anthropic models; compare output and cost** (set `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`; run `node --env-file=.env.local scripts/test-humanizer-models.mjs`)

## Next steps

1. Wire Humanizer, Paraphraser, and AI Check to backend APIs.
2. Add Supabase auth and usage/quota logic.
3. Add Stripe billing and webhooks.
