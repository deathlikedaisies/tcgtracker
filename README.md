# PrizeMap

PrizeMap is a Next.js and Supabase app for tracking Pokemon TCG testing, deck performance, matchup results, and preparation notes.

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Required Environment

Set these variables locally and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
POKEMON_TCG_API_KEY=
```

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

If no Pokémon TCG API key is configured, PrizeMap still works with unauthenticated
API calls at lower rate limits. If the public API is unavailable or rate limited,
deck list parsing, archetype suggestion, match logging, missions, and dashboards
continue to run; only remote card resolution and legality warnings degrade.

## Release Checks

```bash
npm run lint
npm run build
git diff --check
```

## Deploy on Vercel

1. Import the repository into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel Project Settings ->
   Environment Variables for the intended environments.
3. Redeploy after adding or changing these variables. `NEXT_PUBLIC_*` values are
   bundled at build time.
4. In Supabase Auth, set the Site URL to the production domain and add the
   production Vercel URL to the allowed redirect URLs.
5. Deploy after the release checks pass.

Sprite assets are local files in `public/sprites/` and are referenced from `/sprites/{filename}` at runtime.
