# Add username to profiles

Run this in **Supabase** → **SQL Editor** to add a `username` column to `profiles`:

```sql
alter table public.profiles
  add column if not exists username text;

create unique index if not exists idx_profiles_username
  on public.profiles (lower(username))
  where username is not null;
```

After this, users can set a username in Account or Settings. Usernames are unique (case-insensitive).
