# Trial & subscription schema migration

Run this in **Supabase → SQL Editor** after you have the base tables from `SUPABASE_GUIDE.md`.

## 1. Add trial_used to profiles (one free trial per user)

```sql
alter table public.profiles
  add column if not exists trial_used boolean not null default false;
```

## 2. Add plan and period columns to subscriptions

```sql
alter table public.subscriptions
  add column if not exists plan text;
alter table public.subscriptions
  add column if not exists words_included int;
alter table public.subscriptions
  add column if not exists current_period_start timestamptz;
```

## Meanings

- **profiles.trial_used**: `true` once the user has started a free trial (ever). Prevents a second trial.
- **subscriptions.plan**: `'trial'` | `'regular'` | `'pro'` | `'premium'`.
- **subscriptions.words_included**: 5000 (trial), 10000 (regular), 25000 (pro), 50000 (premium).
- **subscriptions.current_period_start**: Start of the current billing/trial period (used with `usage.period_start`).
- **subscriptions.status**: `'trial'` | `'active'` | `'expired'` (no Stripe yet; Stripe will add more).
- **subscriptions.cancel_at_period_end**: For trial: if `true`, user canceled and will not be converted to paid when trial ends. They keep access until `current_period_end`.
