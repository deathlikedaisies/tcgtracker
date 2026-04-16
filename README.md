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
```

Do not expose or configure a Supabase service role key in the frontend app.

## Release Checks

```bash
npm run lint
npm run build
git diff --check
```

## Deploy on Vercel

1. Import the repository into Vercel.
2. Add the two public Supabase environment variables above.
3. In Supabase Auth, add the production Vercel URL to the allowed redirect/site URLs.
4. Deploy after the release checks pass.

Sprite assets are local files in `public/sprites/` and are referenced from `/sprites/{filename}` at runtime.
