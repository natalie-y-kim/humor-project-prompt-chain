"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginGate() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Prompt Chain Access
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Humor Project Prompt Chain
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign in with Google to access the prompt chain workspace backed by the
          shared Supabase project.
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Redirecting..." : "Sign in with Google"}
        </button>

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
