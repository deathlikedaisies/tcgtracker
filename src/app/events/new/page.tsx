import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { EventForm } from "@/components/events/EventForm";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  primaryButton,
  sectionCopy,
} from "@/components/brand-styles";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createEvent } from "../actions";

type DeckRow = {
  id: string;
  name: string;
  deck_versions: {
    id: string;
    name: string;
    is_active: boolean;
  }[] | null;
};

export default async function NewEventPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("decks")
    .select("id, name, deck_versions(id, name, is_active)")
    .eq("user_id", user.id)
    .order("name", { ascending: true })
    .order("is_active", {
      referencedTable: "deck_versions",
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const decks = ((data ?? []) as DeckRow[])
    .map((deck) => ({
      id: deck.id,
      name: deck.name,
      versions: (deck.deck_versions ?? []).map((version) => ({
        id: version.id,
        name: version.name,
        isActive: version.is_active,
      })),
    }))
    .filter((deck) => deck.versions.length > 0);

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="events" />
        <div className={`${appMain} mx-auto w-full max-w-6xl`}>
          <AuthenticatedPageHeader
            current="events"
            title="New event"
            eyebrow="Event logger"
            subtitle="Log every round once, then review the event as SixPrizer match data."
            userEmail={user.email ?? "Unknown email"}
            actions={
              <Link href="/events" className={primaryButton}>
                Back to events
              </Link>
            }
          />

          {decks.length ? (
            <EventForm action={createEvent} decks={decks} />
          ) : (
            <section className={`${emptyCard} overflow-hidden`}>
              <div className="mb-5 h-1.5 w-28 rounded-full bg-[linear-gradient(90deg,#F5C84C,#4F8CFF)]" />
              <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                Add a deck version first.
              </h2>
              <p className={`mt-3 max-w-xl ${sectionCopy}`}>
                Event rounds link into Match history through your deck versions.
                Create a deck and version before logging an event.
              </p>
              <Link href="/decks" className={`mt-6 ${primaryButton}`}>
                Go to decks
              </Link>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
