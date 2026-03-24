import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TestRunnerClient } from "@/components/TestRunnerClient";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";

export default async function PromptChainTestRunnerPage() {
  await requirePromptChainAccess();
  const supabase = await createClient();

  const [{ data: humorFlavors, error: humorFlavorsError }, { data: testImages, error: testImagesError }] =
    await Promise.all([
      supabase
        .from("humor_flavors")
        .select("id, slug, description")
        .order("id", { ascending: true }),
      supabase
        .from("images")
        .select("id, url, additional_context, image_description, is_common_use")
        .eq("is_common_use", true)
        .order("created_datetime_utc", { ascending: false }),
    ]);

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link href="/prompt-chain" className="transition hover:text-panel-foreground">
                  Prompt Chain
                </Link>
                <span>/</span>
                <span className="text-panel-foreground">Test Runner</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-panel-foreground">
                Humor Flavor Test Runner
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Run caption generation tests for a selected humor flavor against
                the existing `api.almostcrackd.ai` pipeline flow.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <ThemeToggle />
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/prompt-chain"
                  prefetch={false}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                >
                  Dashboard
                </Link>
                <Link
                  href="/logout"
                  prefetch={false}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                >
                  Logout
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Test images are sourced from <code>images</code> rows where{" "}
            <code>is_common_use = true</code>.
          </p>

          {humorFlavorsError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              Unable to load humor flavors.
            </p>
          ) : null}

          {testImagesError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              Unable to load the common-use image test set.
            </p>
          ) : null}

          {!humorFlavorsError && (!humorFlavors || humorFlavors.length === 0) ? (
            <p className="mt-5 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              No humor flavors found.
            </p>
          ) : null}

          {!testImagesError && (!testImages || testImages.length === 0) ? (
            <p className="mt-5 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              No common-use test images found. Add rows in <code>images</code> with{" "}
              <code>is_common_use = true</code> to use this runner.
            </p>
          ) : null}
        </section>

        {!humorFlavorsError &&
        !testImagesError &&
        humorFlavors &&
        humorFlavors.length > 0 &&
        testImages &&
        testImages.length > 0 ? (
          <TestRunnerClient
            humorFlavors={humorFlavors.map((flavor) => ({
              id: flavor.id,
              slug: flavor.slug,
              description: flavor.description,
            }))}
            testImages={testImages.map((image) => ({
              id: image.id,
              url: image.url,
              additionalContext: image.additional_context,
              imageDescription: image.image_description,
            }))}
          />
        ) : null}
      </div>
    </main>
  );
}
