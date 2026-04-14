import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <section className="w-full max-w-lg">
        <p className="text-sm font-medium text-zinc-500">TCG Tracker</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          Track your collection.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          Log in to manage your cards, decks, and collection data.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Sign up
          </Link>
        </div>
      </section>
    </main>
  );
}
