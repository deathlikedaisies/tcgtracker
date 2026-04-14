import { AuthForm } from "@/components/auth/AuthForm";
import { card, pageCopy } from "@/components/brand-styles";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1020] px-6 py-12 text-[#F8FAFC]">
      <section className={`w-full max-w-sm ${card}`}>
        <div className="mb-6">
          <PrizeMapLogo
            markClassName="size-8 bg-[#1A2238]"
            textClassName="text-sm text-[#F8FAFC]"
          />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
            Sign up
          </h1>
          <p className={pageCopy}>
            Create an account to start tracking your cards.
          </p>
        </div>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
