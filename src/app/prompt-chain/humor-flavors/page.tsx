import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { FormField } from "@/components/FormField";
import { AlertBanner } from "@/components/AlertBanner";
import { EmptyState } from "@/components/EmptyState";
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

  const breadcrumbs = [
    { label: "Prompt Chain", href: "/prompt-chain" },
    { label: "Humor Flavors" },
  ];

  const actions = (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/prompt-chain"
        prefetch={false}
        className="btn btn-secondary"
      >
        Dashboard
      </Link>
      <Link
        href="/logout"
        prefetch={false}
        className="btn btn-ghost"
      >
        Logout
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          breadcrumbs={breadcrumbs}
          title="Humor Flavor CRUD"
          description="Manage humor flavors stored in Supabase. This tool edits only the existing slug and description fields."
          actions={actions}
        />

        {params.success && (
          <AlertBanner type="success">{params.success}</AlertBanner>
        )}

        {params.error && (
          <AlertBanner type="error">{params.error}</AlertBanner>
        )}

        <SectionCard
          title="Create Humor Flavor"
          description="Add a new humor flavor using the existing schema."
        >
          <form action={createHumorFlavorAction} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
              <FormField label="Slug" htmlFor="new-slug">
                <input
                  id="new-slug"
                  name="slug"
                  type="text"
                  required
                  className="w-full"
                />
              </FormField>
              <FormField label="Description" htmlFor="new-description">
                <textarea
                  id="new-description"
                  name="description"
                  rows={3}
                  className="w-full"
                />
              </FormField>
            </div>
            <div>
              <button type="submit" className="btn btn-primary">
                Create Flavor
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Existing Humor Flavors"
          description="Update or delete existing rows directly from this table."
        >
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <FormField label="Search Flavors" htmlFor="search-flavors">
                <form className="flex gap-2">
                  <input
                    id="search-flavors"
                    name="search"
                    type="text"
                    placeholder="Search by slug or description..."
                    defaultValue={searchTerm}
                    className="flex-1"
                  />
                  <button type="submit" className="btn btn-primary">
                    Search
                  </button>
                  {searchTerm && (
                    <Link
                      href="/prompt-chain/humor-flavors"
                      prefetch={false}
                      className="btn btn-ghost"
                    >
                      Clear
                    </Link>
                  )}
                </form>
              </FormField>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-panel-foreground">Sort:</span>
              <Link
                href={createPageLink(1, "id")}
                prefetch={false}
                className={`btn ${sort === "id" ? "btn-primary" : "btn-secondary"}`}
              >
                ID Ascending
              </Link>
              <Link
                href={createPageLink(1, "recent")}
                prefetch={false}
                className={`btn ${sort === "recent" ? "btn-primary" : "btn-secondary"}`}
              >
                Most Recent
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Current: {currentSortLabel}</p>
          </div>

          {error && (
            <AlertBanner type="error">
              Unable to load humor flavors right now.
            </AlertBanner>
          )}

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
                      <FormField label="Slug" htmlFor={`slug-${flavor.id}`}>
                        <input
                          id={`slug-${flavor.id}`}
                          name="slug"
                          type="text"
                          required
                          defaultValue={flavor.slug}
                          className="w-full"
                        />
                      </FormField>
                    </div>
                    <div>
                      <FormField label="Description" htmlFor={`description-${flavor.id}`}>
                        <textarea
                          id={`description-${flavor.id}`}
                          name="description"
                          rows={3}
                          defaultValue={flavor.description ?? ""}
                          className="w-full"
                        />
                      </FormField>
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
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                    <Link
                      href={`/prompt-chain/humor-flavors/${flavor.id}/steps`}
                      prefetch={false}
                      className="btn btn-secondary"
                    >
                      Manage Steps
                    </Link>
                    <button
                      type="submit"
                      formAction={duplicateHumorFlavorAction}
                      className="btn btn-secondary"
                    >
                      Duplicate
                    </button>
                    <button
                      type="submit"
                      formAction={deleteHumorFlavorAction}
                      className="btn btn-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <EmptyState
                icon="💡"
                title="No humor flavors found"
                description={
                  searchTerm
                    ? "No humor flavors match your search."
                    : error
                      ? "Unable to display humor flavors."
                      : "No humor flavors found."
                }
              />
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
                className={`btn ${hasPrevious ? "btn-secondary" : "btn-secondary opacity-50 pointer-events-none"}`}
              >
                Previous
              </Link>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Link
                href={hasNext ? createPageLink(currentPage + 1, sort) : "#"}
                prefetch={false}
                className={`btn ${hasNext ? "btn-secondary" : "btn-secondary opacity-50 pointer-events-none"}`}
              >
                Next
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
