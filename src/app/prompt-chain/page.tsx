import { ThemeToggle } from "@/components/ThemeToggle";
import { SectionCard } from "@/components/SectionCard";
import { CaptionStatsDashboard } from "@/components/CaptionStatsDashboard";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";
import { getCaptionRatingDashboardStats } from "@/lib/captionStats";
import { createClient } from "@/lib/supabase/server";

export default async function PromptChainPage() {
  const { user } = await requirePromptChainAccess();
  const supabase = await createClient();

  const statsResult = await getCaptionRatingDashboardStats(supabase)
    .then((stats) => ({ stats, error: null }))
    .catch((error: unknown) => ({
      stats: null,
      error: error instanceof Error ? error.message : "Unable to load caption statistics.",
    }));

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex justify-end">
          <ThemeToggle />
        </div>
        <SectionCard
          title="Prompt Chain Dashboard"
          titleClassName="!text-3xl leading-tight sm:!text-4xl"
          description="This workspace is restricted to users with either the superadmin or matrix admin flag on their profile. The dashboard below summarizes prompt-chain setup, caption output, and available feedback."
        >
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Email
              </dt>
              <dd className="mt-2 text-sm text-panel-foreground">
                {user.email ?? "No email available"}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                User ID
              </dt>
              <dd className="mt-2 break-all text-sm text-panel-foreground">
                {user.id}
              </dd>
            </div>
          </dl>

          <div className="mt-8 rounded-lg border border-border bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Select a feature from the sidebar to manage humor flavors or run
              caption generation tests.
            </p>
          </div>
        </SectionCard>

        <div className="mt-6">
          {statsResult.error ? (
            <section className="rounded-xl border border-error-border bg-error-bg p-6 text-error-text">
              <h2 className="text-lg font-semibold">Unable to load statistics</h2>
              <p className="mt-2 text-sm">{statsResult.error}</p>
            </section>
          ) : statsResult.stats ? (
            <CaptionStatsDashboard stats={statsResult.stats} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
