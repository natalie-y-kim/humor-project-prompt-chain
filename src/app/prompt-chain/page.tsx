import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";

export default async function PromptChainPage() {
  const { user } = await requirePromptChainAccess();

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-panel p-8 text-panel-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Authorized Access
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-panel-foreground">
              Humor Project Prompt Chain
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This workspace is restricted to users with either the superadmin
              or matrix admin flag on their profile.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ThemeToggle />
            <Link
              href="/logout"
              prefetch={false}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
            >
              Logout
            </Link>
          </div>
        </div>

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

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/prompt-chain/humor-flavors"
            prefetch={false}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Manage Humor Flavors
          </Link>
          <Link
            href="/prompt-chain/test-runner"
            prefetch={false}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            Run Flavor Tests
          </Link>
        </div>
      </section>
    </main>
  );
}
