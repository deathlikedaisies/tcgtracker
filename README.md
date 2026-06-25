# SixPrizer

SixPrizer helps competitive Pokémon TCG players log games, spot the matchups costing them wins, compare deck versions, and decide what to test next.

Tagline: From testing games to six-prize turns.

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Required Environment

Set these variables locally and in Vercel:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
POKEMON_TCG_API_KEY=
```

`NEXT_PUBLIC_SITE_URL` controls canonical public/shareable links such as player
profiles and shared reports. Use `https://sixprizer.com` in production and
`http://localhost:3000` for local development.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are
required for login, signup, and all account data. The app also accepts
`NEXT_PUBLIC_SUPABASE_ANON_KEY` as a legacy fallback for the publishable key, but
new deployments should use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Do not add fake values. Do not expose or configure a Supabase service role key in
the frontend app.

`POKEMON_TCG_API_KEY` is optional and server-side only. Add it in Vercel as a
normal encrypted environment variable, not a `NEXT_PUBLIC_*` variable. Locally,
add it to `.env.local` when you want higher Pokémon TCG API rate limits for card
lookup and legality enrichment. You can get a free key from the Pokémon TCG API
Developer Portal: https://dev.pokemontcg.io/

If no Pokémon TCG API key is configured, SixPrizer still works with unauthenticated
API calls at lower rate limits. If the public API is unavailable or rate limited,
deck list parsing, archetype suggestion, match logging, missions, and dashboards
continue to run; only remote card resolution and legality warnings degrade.

## Validation Tiers

```bash
npm run lint
npm run build
git diff --check
```

Use the smallest tier that matches the change:

### Small UI or copy change

```bash
npm run lint
npm run build
npm run test:e2e -- --project=desktop-chromium --workers=1
git diff --check
```

### Core flow, auth, logging, or deck change

```bash
npm run lint
npm run build
npm run test:e2e -- --project=desktop-chromium --workers=1
npm run test:e2e -- --project=mobile-chrome --workers=1
git diff --check
```

### Review, matchups, coach, or pagination change

```bash
npm run lint
npm run build
npm run test:e2e -- --project=desktop-chromium --workers=1
npm run test:e2e -- --project=mobile-chrome --workers=1
node scripts/playtest_250_seed.mjs
node scripts/playtest_250_audit.mjs
git diff --check
```

### Final beta or release validation

The 250-log and 1000-log workflows share the same disposable account, so they must be run as seed -> audit pairs in this exact order:

```bash
npm run lint
npm run build
npm run test:e2e -- --project=desktop-chromium --workers=1
npm run test:e2e -- --project=mobile-chrome --workers=1
node scripts/playtest_250_seed.mjs
node scripts/playtest_250_audit.mjs
node scripts/playtest_1000_seed.mjs
node scripts/playtest_1000_audit.mjs
git diff --check
```

## Deploy on Vercel

1. Import the repository into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel Project Settings ->
   Environment Variables for the intended environments.
3. Redeploy after adding or changing these variables. `NEXT_PUBLIC_*` values are
   bundled at build time.
4. In Supabase Auth, set the Site URL to `https://sixprizer.com` and add the
   production domain to the allowed redirect URLs.
5. Deploy after the release checks pass.

Sprite assets are local files in `public/sprites/` and are referenced from `/sprites/{filename}` at runtime.
