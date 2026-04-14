import { AuthForm } from "@/components/auth/AuthForm";
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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <section className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Sign up
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Create an account to start tracking your cards.
          </p>
        </div>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
