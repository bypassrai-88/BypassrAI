# BypassrAI — UI Design (NaturalWrite-Inspired)

Reference: [NaturalWrite](https://naturalwrite.com/). Goal: clean, trustworthy, conversion-focused SaaS landing + humanizer tool. No code in this doc — layout, structure, and style direction only.

---

## 1. Design Direction

- **Vibe:** Professional, “built on science,” trustworthy. Not playful or gimmicky.
- **Layout:** Plenty of whitespace; clear hierarchy; one primary CTA above the fold.
- **Inspiration:** NaturalWrite’s structure: hero → value props → 3-step flow → social proof → FAQ → footer. We mirror that flow and simplify where needed for MVP.

---

## 2. Global / Shell

- **Header:** Logo (left), nav links (e.g. AI Humanizer, AI Detector optional, Pricing), “Log in” + “Try for free” (right). Sticky; minimal.
- **Footer:** Products, Resources, Legal (Privacy, Terms), optional “Mini tools”. Simple 2–3 columns.
- **Typography:** One clear sans-serif (e.g. Inter, DM Sans, or similar). Headings bold; body readable (e.g. 16px base).
- **Colors:**  
  - Neutral background (white or very light gray).  
  - Primary CTA: one strong color (e.g. blue or green — “go” / “humanize”).  
  - Trust / “science”: can use a slightly muted primary or keep black/gray for most text.  
- **No dark mode required for MVP** — light theme only is fine.

---

## 3. Page-by-Page (MVP)

### 3.1 Landing (Home)

- **Hero**
  - One strong headline (e.g. “Humanize AI Text & Outsmart AI Detectors”).
  - Short subline: e.g. “Convert AI-generated content into human-sounding text that passes every AI detection tool.”
  - Single primary CTA: “Try for free” (scroll to humanizer or go to `/humanize`). Optional “No credit card required.”
- **Trust**
  - “Trusted by X users” or “Bypass AI content detectors” with logos (Turnitin, Copyleaks, ZeroGPT, Quillbot, Grammarly, GPTZero) — placeholders or simple SVG icons for MVP.
- **3-step section**
  - “Humanize AI Writing in 3 Simple Steps” (or similar).
  - Step 1: Paste your text.  
  - Step 2: Check AI score (optional for MVP).  
  - Step 3: Humanize.
  - Short supporting copy under each; optional illustration or icon.
- **Social proof**
  - “Built on Science, Powered by Precision” — short blurb (training data, linguistic modeling, detectors we test against).
  - “Tested and Proven Across All AI Detectors” — same idea, short.
  - “Trusted by Writers Worldwide” — use case (students, marketers, businesses).
- **Testimonials**
  - 2–3 quote cards: name, role (e.g. Student, Content Writer), one sentence. Optional small avatar placeholder.
- **FAQ**
  - Accordion or list: How it works, Bypass Turnitin?, Pricing, Languages, Long essays, Word limit, History, Cancel, etc. Short answers.
- **Final CTA**
  - “Make Your Text Sound Human — Instantly” with “Start for free” and “X words for free. No credit card required.”

### 3.2 Humanizer (`/humanize`)

- **Location:** `/humanize`; linked from “Try for free” and nav.
- **Layout**
  - One main card/section: “Your Text”.
  - **Input:** Large textarea, placeholder “Paste text”, word count below (e.g. “0 / 250 words” for anonymous; “X / 2,000” for trial).
  - **Actions:** Two buttons: “Check for AI” (optional in MVP), “Humanize”.
- **Quota / paywall**
  - When anonymous and under 250: show “X / 250 words used (free). Create an account for a free trial.”
  - When anonymous and at/over 250: disable “Humanize” or show a modal: “You’ve used your free 250 words. Create an account to get a free trial” with CTA to sign up.
  - When logged in (trial): “X / 2,000 words this period” (or similar).
  - When subscribed: “X / [plan limit] words this month” or “Unlimited.”
- **Output**
  - After “Humanize”: show result in a second card/area (e.g. “Humanized text” with copy button). Optionally show “AI score” if we add detection.
- **Defaults**
  - Simple, minimal controls; no tone/style dropdown for MVP unless you want one.

### 3.3 Paraphraser (`/paraphrase`)

- **Location:** `/paraphrase`; linked from nav.
- **Layout**
  - Same pattern as Humanizer: “Your Text” card, textarea, word count, “Paraphrase” button, result area with copy.
  - No “Check for AI” button unless we add it later.
- **Copy:** “Rewrite sentences and paragraphs in your own words. Keep the meaning, change the wording.”

### 3.4 AI Detector (`/ai-check`)

- **Location:** `/ai-check`; linked from nav.
- **Layout**
  - Same pattern: “Your Text” card, textarea, word count (e.g. 500 words for free), “Check for AI” button, result area.
  - **Output:** AI score / detection result (e.g. “X% human / Y% AI” or similar) — wire to detection API later.

### 3.5 Account (Auth)

- **Sign up** (`/signup`): Centered card: email, password; “Create account.” Link to Log in. Optional “Forgot password?” on login.
- **Log in** (`/login`): Email, password; “Log in.” Link to Sign up, “Forgot password?” → `/forgot-password`.
- **Forgot password** (`/forgot-password`): Email field; “Send reset link.” Confirmation message; “Back to log in.”
- After signup: redirect to humanizer or a short “You’re on the free trial” message then humanizer.
- **Profile (minimal for MVP)**
  - Email, plan name, “Manage subscription” (link to Stripe Customer Portal or your billing page).

### 3.6 Help & Support

- **Help / FAQ** (`/help`): List of FAQs (how it works, bypass Turnitin?, pricing, languages, word limit, history, cancel, Google penalty). Links to “How it works” and “Contact us.”
- **How it works** (`/help/how-it-works`): 4 steps (paste → check AI score optional → humanize/paraphrase → use result) + “Built on science” blurb. CTA to Humanizer.
- **Contact** (`/contact`): Form: name, email, message. “Send message” → confirmation. No backend yet; placeholder.

### 3.7 Pricing / Billing (`/pricing`)

- **Pricing page**
  - “Free” row: 250 words, no account; “Try for free” → `/humanize`.
  - “Free trial” row: Create account, extra words for 7 days; “Start trial” → `/signup`.
  - “Monthly” row: $X/mo, higher word limit; “Subscribe” → `/signup` (or Stripe Checkout).
  - Short FAQ under (e.g. cancel anytime, refund policy).
- **Checkout**
  - Stripe Checkout or Stripe Elements on your page; minimal custom UI. “Manage subscription” → Stripe Customer Portal is easiest.

### 3.8 Legal (Placeholders)

- **Privacy** (`/privacy`), **Terms** (`/terms`): Placeholder content until real policies are drafted.

---

## 4. Components Checklist (Conceptual)

- **Header** (logo, nav: AI Humanizer, Paraphraser, AI Detector, Pricing, Help; Log in, Try for free).
- **Footer** (Products, Resources, Legal; 2–4 columns).
- **Hero** (headline, subline, CTA).
- **Step cards** (icon/num, title, short text).
- **Testimonial cards** (quote, name, role).
- **FAQ** (accordion or list).
- **Tool editor** (shared: textarea, word count, primary + optional secondary button, result area with copy). Used on Humanize, Paraphrase, AI Check.
- **Quota / paywall banner or modal** (message + CTA to sign up or upgrade).
- **Auth forms** (sign up, log in, forgot password).
- **Pricing table** (Free, Free trial, Monthly).
- **Help pages** (FAQ list, How it works steps, Contact form).

No design system file or code — this is the list of “screens and blocks” to implement.

---

## 5. Responsive

- **Desktop first** for MVP; then ensure humanizer and landing work on tablet and mobile (stack sections, full-width CTA, readable font size).
- **Humanizer:** Textarea and result stack vertically on small screens; buttons full-width if needed.

---

## 6. Copy Tone

- Clear, confident, benefit-led. “Humanize,” “Bypass detectors,” “Sound human.”
- Avoid hype; lean on “built on science,” “tested,” “trusted by X users.”
- CTAs: “Try for free,” “Start for free,” “Create account,” “Subscribe.”

---

*Document version: 1.0 — Planning only; no code. Reference: NaturalWrite.*
