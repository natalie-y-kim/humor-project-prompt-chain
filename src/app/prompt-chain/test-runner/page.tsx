import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TestRunnerClient } from "@/components/TestRunnerClient";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";

export default async function PromptChainTestRunnerPage() {
  await requirePromptChainAccess();
  const supabase = await createClient();

  const [
    { data: humorFlavors, error: humorFlavorsError },
    { data: studyImageSets, error: studyImageSetsError },
  ] =
    await Promise.all([
      supabase
        .from("humor_flavors")
        .select("id, slug, description")
        .order("id", { ascending: true }),
      supabase
        .from("study_image_sets")
        .select(`
          id,
          slug,
          description,
          study_image_set_image_mappings (
            id,
            image:images (
              id,
              url,
              additional_context,
              image_description
            )
          )
        `)
        .order("id", { ascending: true }),
    ]);

  const normalizedStudyImageSets =
    studyImageSets?.map((set) => ({
      id: set.id,
      slug: set.slug,
      description: set.description,
      images:
        set.study_image_set_image_mappings
          ?.map((mapping) =>
            Array.isArray(mapping.image) ? mapping.image[0] : mapping.image,
          )
          .filter((image) => image?.id)
          .map((image) => ({
            id: image.id,
            url: image.url,
            additionalContext: image.additional_context,
            imageDescription: image.image_description,
          })) ?? [],
    })) ?? [];

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
            Test images are sourced from <code>study_image_sets</code> via{" "}
            <code>study_image_set_image_mappings</code> into <code>images</code>.
          </p>

          {humorFlavorsError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              Unable to load humor flavors.
            </p>
          ) : null}

          {studyImageSetsError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              Unable to load study image sets.
            </p>
          ) : null}

          {!humorFlavorsError && (!humorFlavors || humorFlavors.length === 0) ? (
            <p className="mt-5 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              No humor flavors found.
            </p>
          ) : null}

          {!studyImageSetsError && normalizedStudyImageSets.length === 0 ? (
            <p className="mt-5 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              No study image sets found.
            </p>
          ) : null}
        </section>

        {!humorFlavorsError &&
        !studyImageSetsError &&
        humorFlavors &&
        humorFlavors.length > 0 &&
        normalizedStudyImageSets.length > 0 ? (
          <TestRunnerClient
            humorFlavors={humorFlavors.map((flavor) => ({
              id: flavor.id,
              slug: flavor.slug,
              description: flavor.description,
            }))}
            studyImageSets={normalizedStudyImageSets}
          />
        ) : null}
      </div>
    </main>
  );
}
