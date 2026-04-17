import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDate } from "@/lib/crud";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";
import {
  createHumorFlavorAction,
  deleteHumorFlavorAction,
  duplicateHumorFlavorAction,
  updateHumorFlavorAction,
} from "./actions";

type HumorFlavorsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    page?: string;
    sort?: string;
    search?: string;
  }>;
};

const PAGE_SIZE = 10;

export default async function HumorFlavorsPage({
  searchParams,
}: HumorFlavorsPageProps) {
  await requirePromptChainAccess();
  const params = await searchParams;

  const currentPage = Math.max(1, Number(params.page ?? "1"));
  const sort = params.sort === "recent" ? "recent" : "id";
  const searchTerm = params.search?.trim() ?? "";
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("humor_flavors")
    .select("id, created_datetime_utc, slug, description", { count: "exact" });

  if (searchTerm) {
    query = query.or(`slug.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  const { data: humorFlavors, error, count } = await query
    .order(sort === "recent" ? "created_datetime_utc" : "id", {
      ascending: sort !== "recent",
    })
    .range(startIndex, endIndex);

  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const createPageLink = (page: number, newSort: string) => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("sort", newSort);
    if (searchTerm) {
      query.set("search", searchTerm);
    }
    return `/prompt-chain/humor-flavors?${query.toString()}`;
  };

  const currentSortLabel = sort === "recent" ? "Most Recent" : "ID Ascending";

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
                <span className="text-panel-foreground">Humor Flavors</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-panel-foreground">
                Humor Flavor CRUD
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage humor flavors stored in Supabase. This tool edits only the
                existing <code>slug</code> and <code>description</code> fields.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <ThemeToggle />
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/prompt-chain"
                  prefetch={false}
                  className="rounded-md border border-blue-500 bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
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

          {params.success ? (
            <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              {params.success}
            </p>
          ) : null}

          {params.error ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              {params.error}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
          <h2 className="text-lg font-semibold text-panel-foreground">
            Create Humor Flavor
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new humor flavor using the existing schema.
          </p>

          <form action={createHumorFlavorAction} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
              <div>
                <label
                  htmlFor="new-slug"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Slug
                </label>
                <input
                  id="new-slug"
                  name="slug"
                  type="text"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label
                  htmlFor="new-description"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Description
                </label>
                <textarea
                  id="new-description"
                  name="description"
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                Create Flavor
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
          <h2 className="text-lg font-semibold text-panel-foreground">
            Existing Humor Flavors
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Update or delete existing rows directly from this table.
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label
                htmlFor="search-flavors"
                className="mb-2 block text-sm font-medium text-panel-foreground"
              >
                Search Flavors
              </label>
              <form className="flex gap-2">
                <input
                  id="search-flavors"
                  name="search"
                  type="text"
                  placeholder="Search by slug or description..."
                  defaultValue={searchTerm}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  Search
                </button>
                {searchTerm && (
                  <Link
                    href="/prompt-chain/humor-flavors"
                    prefetch={false}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                  >
                    Clear
                  </Link>
                )}
              </form>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-panel-foreground">Sort:</span>
              <Link
                href={createPageLink(1, "id")}
                prefetch={false}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
                  sort === "id"
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                ID Ascending
              </Link>
              <Link
                href={createPageLink(1, "recent")}
                prefetch={false}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
                  sort === "recent"
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                Most Recent
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Current: {currentSortLabel}</p>
          </div>

          {error ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              Unable to load humor flavors right now.
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
            {humorFlavors && humorFlavors.length > 0 ? (
              humorFlavors.map((flavor) => (
                <form
                  key={flavor.id}
                  action={updateHumorFlavorAction}
                  className="rounded-xl border border-border bg-muted p-4"
                >
                  <input type="hidden" name="id" value={String(flavor.id)} />
                  <div className="grid gap-4 lg:grid-cols-[120px_minmax(0,240px)_minmax(0,1fr)_180px]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        ID
                      </p>
                      <p className="mt-2 text-sm text-panel-foreground">{flavor.id}</p>
                    </div>
                    <div>
                      <label
                        htmlFor={`slug-${flavor.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Slug
                      </label>
                      <input
                        id={`slug-${flavor.id}`}
                        name="slug"
                        type="text"
                        required
                        defaultValue={flavor.slug}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`description-${flavor.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Description
                      </label>
                      <textarea
                        id={`description-${flavor.id}`}
                        name="description"
                        rows={3}
                        defaultValue={flavor.description ?? ""}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Created (UTC)
                      </p>
                      <p className="mt-2 text-sm text-panel-foreground">
                        {formatDate(flavor.created_datetime_utc)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      Save Changes
                    </button>
                    <Link
                      href={`/prompt-chain/humor-flavors/${flavor.id}/steps`}
                      prefetch={false}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel"
                    >
                      Manage Steps
                    </Link>
                    <button
                      type="submit"
                      formAction={duplicateHumorFlavorAction}
                      className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900/70 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                    >
                      Duplicate
                    </button>
                    <button
                      type="submit"
                      formAction={deleteHumorFlavorAction}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
                {searchTerm
                  ? "No humor flavors match your search."
                  : error
                    ? "Unable to display humor flavors."
                    : "No humor flavors found."}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div>
              Showing {humorFlavors ? humorFlavors.length : 0} of {totalItems} total
              entries.
              {searchTerm && ` (filtered for "${searchTerm}")`}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={hasPrevious ? createPageLink(currentPage - 1, sort) : "#"}
                prefetch={false}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
                  hasPrevious
                    ? "border-border text-muted-foreground hover:bg-muted"
                    : "border-border bg-muted text-muted-foreground/60 pointer-events-none"
                }`}
              >
                Previous
              </Link>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Link
                href={hasNext ? createPageLink(currentPage + 1, sort) : "#"}
                prefetch={false}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
                  hasNext
                    ? "border-border text-muted-foreground hover:bg-muted"
                    : "border-border bg-muted text-muted-foreground/60 pointer-events-none"
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
