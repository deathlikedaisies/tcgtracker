import { MessageSquareWarning } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import {
  appFrame,
  appMain,
  appShell,
  formSectionCard,
  premiumInset,
  sectionCopy,
  sectionTitle,
} from "@/components/brand-styles";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function FeedbackPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="feedback" />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="feedback"
            eyebrow="Beta channel"
            title="Send feedback"
            subtitle="Save a bug report, confusing flow note, mobile issue, or suggestion without leaving the app."
            userEmail={user.email ?? "Unknown email"}
          />

          <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <FeedbackForm />

            <aside className="grid gap-4 xl:sticky xl:top-6">
              <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                    Best reports
                  </p>
                  <h2 className={`mt-2 ${sectionTitle}`}>Keep it concrete</h2>
                  <p className={sectionCopy}>
                    The most useful reports say what you were doing, what happened, and what you expected instead.
                  </p>
                </div>

                <div className={`grid gap-3 p-4 ${premiumInset}`}>
                  {[
                    "Route or area where it happened",
                    "What felt broken, confusing, or slow",
                    "What you expected instead",
                    "Screenshot if you already shared one in WhatsApp",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-2 inline-flex size-2 shrink-0 rounded-full bg-[#4F8CFF]/76" />
                      <p className="text-sm leading-6 text-[#D6E0F0]">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                    <MessageSquareWarning className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className={sectionTitle}>Urgent issues</h2>
                    <p className={`mt-1 ${sectionCopy}`}>
                      If something blocks logging or a mobile layout is broken, post it in the WhatsApp beta group too. That is still the fastest channel for screenshots and quick follow-up.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
