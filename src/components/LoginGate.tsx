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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-lg card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Prompt Chain Access
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-panel-foreground">
          Humor Project Prompt Chain
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign in with Google to access the prompt chain workspace backed by the
          shared Supabase project.
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="btn btn-primary mt-8 w-full"
        >
          {isLoading ? "Redirecting..." : "Sign in with Google"}
        </button>

        {errorMessage && (
          <div className="alert alert-error mt-4">
            {errorMessage}
          </div>
        )}
      </section>
    </main>
  );
}
