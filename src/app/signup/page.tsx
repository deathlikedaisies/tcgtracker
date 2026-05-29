import { AuthForm } from "@/components/auth/AuthForm";
import { glassPanelStrong, marketingShell, pageCopy } from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { getOptionalSupabaseConfig } from "@/lib/supabase-config";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const authConfigured = Boolean(getOptionalSupabaseConfig());
  let shouldRedirect = false;

  if (authConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        shouldRedirect = true;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Unable to read Supabase user on signup page", {
          name: error.name,
          message: error.message,
        });
      }
    }
  }

  if (shouldRedirect) {
    redirect("/dashboard");
  }

  return (
    <main className={`flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 ${marketingShell}`}>
      <section className={`w-full max-w-sm p-5 sm:p-6 ${glassPanelStrong}`}>
        <div className="mb-6">
          <SixPrizerLogo
            markClassName="size-8 bg-[#1A2238]"
            textClassName="text-sm text-[#F8FAFC]"
          />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
            Create your SixPrizer account
          </h1>
          <p className={pageCopy}>
            Create an account to start tracking your matches.
          </p>
        </div>
        <AuthForm mode="signup" authConfigured={authConfigured} />
      </section>
    </main>
  );
}
