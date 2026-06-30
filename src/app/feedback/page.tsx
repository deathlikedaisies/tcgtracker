import {
  CheckCircle2,
  MessageSquareWarning,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
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
            subtitle="Report bugs, confusing screens, TCG Live import issues, mobile problems, or anything that slowed you down."
            userEmail={user.email ?? "Unknown email"}
          />

          <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <FeedbackForm />

            <aside className="grid gap-4 xl:sticky xl:top-6">
              <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Useful reports
                  </p>
                  <h2 className={`mt-2 ${sectionTitle}`}>What makes feedback useful</h2>
                  <p className={sectionCopy}>
                    A clear report helps turn beta friction into a specific fix.
                  </p>
                </div>

                <div className={`grid gap-3 p-3 ${premiumInset}`}>
                  {[
                    "What you were doing",
                    "What broke or felt confusing",
                    "What you expected instead",
                    "Mention if you have a screenshot available",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#4F8CFF]" aria-hidden="true" />
                      <p className="text-sm leading-6 text-[#D6E0F0]">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                    <ShieldAlert className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className={sectionTitle}>High-priority reports</h2>
                    <p className={`mt-1 ${sectionCopy}`}>
                      These are the fastest things to triage during beta.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  {[
                    "Signup or login is blocked",
                    "TCG Live import reads the log wrong",
                    "Mobile layout is broken",
                    "Cannot log or save a game",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[14px] bg-[#07111F]/42 px-3 py-2"
                    >
                      <MessageSquareWarning className="mt-1 size-4 shrink-0 text-[#F5C84C]" aria-hidden="true" />
                      <p className="text-sm leading-6 text-[#D6E0F0]">{item}</p>
                    </div>
                  ))}
                </div>

                <p className={sectionCopy}>
                  If something blocks logging or a mobile layout is broken, send a direct message as well so it can be checked faster.
                </p>
              </section>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
