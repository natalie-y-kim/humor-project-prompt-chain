import { ThemeToggle } from "@/components/ThemeToggle";
import { SectionCard } from "@/components/SectionCard";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";

export default async function PromptChainPage() {
  const { user } = await requirePromptChainAccess();

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex justify-end">
          <ThemeToggle />
        </div>
        <SectionCard
          title="Humor Project Prompt Chain"
          titleClassName="!text-3xl leading-tight sm:!text-4xl"
          description="This workspace is restricted to users with either the superadmin or matrix admin flag on their profile. Use the sidebar to access features."
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

          <div className="mt-8 p-4 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              👈 Select a feature from the sidebar to get started.
            </p>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
