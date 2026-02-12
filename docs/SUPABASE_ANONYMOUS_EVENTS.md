# Anonymous usage events (for admin stats by period)

Run this in the Supabase SQL editor once so the admin dashboard can show anonymous uses **all time**, **last 30 days**, **last 7 days**, and **today**.

```sql
create table if not exists public.anonymous_usage_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  words_used int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_anonymous_usage_events_created_at
  on public.anonymous_usage_events(created_at);
```

After this, each anonymous humanize use will write one row here. The admin stats API uses it to compute counts per period.
