import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDate } from "@/lib/crud";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";
import {
  createHumorFlavorStepAction,
  deleteHumorFlavorStepAction,
  moveHumorFlavorStepDownAction,
  moveHumorFlavorStepUpAction,
  updateHumorFlavorStepAction,
} from "./actions";

type Lookup =
  | { slug?: string | null; name?: string | null }
  | { slug?: string | null; name?: string | null }[]
  | null;

type StepPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

function getLookupValue(value: Lookup, key: "slug" | "name") {
  if (!value) {
    return "-";
  }

  if (Array.isArray(value)) {
    return value[0]?.[key] ?? "-";
  }

  return value[key] ?? "-";
}

export default async function HumorFlavorStepsPage({
  params,
  searchParams,
}: StepPageProps) {
  await requirePromptChainAccess();

  const { id } = await params;
  const pageState = await searchParams;
  const supabase = await createClient();

  const [
    { data: humorFlavor, error: flavorError },
    { data: steps, error: stepsError },
    { data: stepTypes, error: stepTypesError },
    { data: inputTypes, error: inputTypesError },
    { data: outputTypes, error: outputTypesError },
    { data: llmModels, error: llmModelsError },
  ] = await Promise.all([
    supabase
      .from("humor_flavors")
      .select("id, slug, description, created_datetime_utc")
      .eq("id", id)
      .single(),
    supabase
      .from("humor_flavor_steps")
      .select(
        "id, created_datetime_utc, humor_flavor_id, llm_temperature, order_by, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, llm_system_prompt, llm_user_prompt, description, llm_input_types(slug), llm_output_types(slug), llm_models(name), humor_flavor_step_types(slug)",
      )
      .eq("humor_flavor_id", id)
      .order("order_by", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("humor_flavor_step_types")
      .select("id, slug")
      .order("id", { ascending: true }),
    supabase
      .from("llm_input_types")
      .select("id, slug")
      .order("id", { ascending: true }),
    supabase
      .from("llm_output_types")
      .select("id, slug")
      .order("id", { ascending: true }),
    supabase.from("llm_models").select("id, name").order("id", { ascending: true }),
  ]);

  if (flavorError || !humorFlavor) {
    notFound();
  }

  const hasLookupError =
    stepTypesError || inputTypesError || outputTypesError || llmModelsError;

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
                <Link
                  href="/prompt-chain/humor-flavors"
                  className="transition hover:text-panel-foreground"
                >
                  Humor Flavors
                </Link>
                <span>/</span>
                <span className="text-panel-foreground">Steps</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-panel-foreground">
                Humor Flavor Steps
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Managing execution steps for flavor <code>{humorFlavor.slug}</code>.
                Steps are shown in execution order using <code>order_by</code>.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <ThemeToggle />
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/prompt-chain/humor-flavors"
                  prefetch={false}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                >
                  Back to Flavors
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

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Flavor ID
              </dt>
              <dd className="mt-2 text-sm text-panel-foreground">{humorFlavor.id}</dd>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Slug
              </dt>
              <dd className="mt-2 text-sm text-panel-foreground">{humorFlavor.slug}</dd>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Created (UTC)
              </dt>
              <dd className="mt-2 text-sm text-panel-foreground">
                {formatDate(humorFlavor.created_datetime_utc)}
              </dd>
            </div>
          </dl>

          {pageState.success ? (
            <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              {pageState.success}
            </p>
          ) : null}

          {pageState.error ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              {pageState.error}
            </p>
          ) : null}

          {hasLookupError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              One or more lookup tables could not be loaded. Step editing may be unavailable.
            </p>
          ) : null}

          {humorFlavor.description ? (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {humorFlavor.description}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
          <h2 className="text-lg font-semibold text-panel-foreground">Create Step</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new step for this flavor using the existing step schema.
          </p>

          <form action={createHumorFlavorStepAction} className="mt-5 grid gap-4">
            <input type="hidden" name="humor_flavor_id" value={String(humorFlavor.id)} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label
                  htmlFor="new-order-by"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Order
                </label>
                <input
                  id="new-order-by"
                  name="order_by"
                  type="number"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label
                  htmlFor="new-step-type"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Step Type
                </label>
                <select
                  id="new-step-type"
                  name="humor_flavor_step_type_id"
                  required
                  disabled={!stepTypes}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                >
                  <option value="">Select step type</option>
                  {stepTypes?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.slug}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="new-model"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Model
                </label>
                <select
                  id="new-model"
                  name="llm_model_id"
                  required
                  disabled={!llmModels}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                >
                  <option value="">Select model</option>
                  {llmModels?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="new-input-type"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Input Type
                </label>
                <select
                  id="new-input-type"
                  name="llm_input_type_id"
                  required
                  disabled={!inputTypes}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                >
                  <option value="">Select input type</option>
                  {inputTypes?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.slug}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="new-output-type"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Output Type
                </label>
                <select
                  id="new-output-type"
                  name="llm_output_type_id"
                  required
                  disabled={!outputTypes}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                >
                  <option value="">Select output type</option>
                  {outputTypes?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.slug}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="new-description"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Description
                </label>
                <input
                  id="new-description"
                  name="description"
                  type="text"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label
                  htmlFor="new-temperature"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  Temperature
                </label>
                <input
                  id="new-temperature"
                  name="llm_temperature"
                  type="number"
                  step="0.01"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="new-system-prompt"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  System Prompt
                </label>
                <textarea
                  id="new-system-prompt"
                  name="llm_system_prompt"
                  rows={5}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label
                  htmlFor="new-user-prompt"
                  className="mb-1 block text-sm font-medium text-panel-foreground"
                >
                  User Prompt
                </label>
                <textarea
                  id="new-user-prompt"
                  name="llm_user_prompt"
                  rows={5}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                Create Step
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
          <h2 className="text-lg font-semibold text-panel-foreground">
            Existing Steps
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Steps are displayed in execution order by <code>order_by</code>.
          </p>

          {stepsError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              Unable to load humor flavor steps right now.
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
            {steps && steps.length > 0 ? (
              steps.map((step, index) => (
                <form
                  key={step.id}
                  action={updateHumorFlavorStepAction}
                  className="rounded-xl border border-border bg-muted p-4"
                >
                  <input type="hidden" name="id" value={String(step.id)} />
                  <input
                    type="hidden"
                    name="humor_flavor_id"
                    value={String(humorFlavor.id)}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Step {step.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(step.created_datetime_utc)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div>
                      <label
                        htmlFor={`order-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Order
                      </label>
                      <input
                        id={`order-${step.id}`}
                        name="order_by"
                        type="number"
                        required
                        defaultValue={step.order_by}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`step-type-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Step Type
                      </label>
                      <select
                        id={`step-type-${step.id}`}
                        name="humor_flavor_step_type_id"
                        required
                        defaultValue={step.humor_flavor_step_type_id}
                        disabled={!stepTypes}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      >
                        {stepTypes?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.slug}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`model-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Model
                      </label>
                      <select
                        id={`model-${step.id}`}
                        name="llm_model_id"
                        required
                        defaultValue={step.llm_model_id}
                        disabled={!llmModels}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      >
                        {llmModels?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`input-type-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Input Type
                      </label>
                      <select
                        id={`input-type-${step.id}`}
                        name="llm_input_type_id"
                        required
                        defaultValue={step.llm_input_type_id}
                        disabled={!inputTypes}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      >
                        {inputTypes?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.slug}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`output-type-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Output Type
                      </label>
                      <select
                        id={`output-type-${step.id}`}
                        name="llm_output_type_id"
                        required
                        defaultValue={step.llm_output_type_id}
                        disabled={!outputTypes}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      >
                        {outputTypes?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.slug}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`description-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Description
                      </label>
                      <input
                        id={`description-${step.id}`}
                        name="description"
                        type="text"
                        defaultValue={step.description ?? ""}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`temperature-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        Temperature
                      </label>
                      <input
                        id={`temperature-${step.id}`}
                        name="llm_temperature"
                        type="number"
                        step="0.01"
                        defaultValue={step.llm_temperature ?? ""}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`system-prompt-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        System Prompt
                      </label>
                      <textarea
                        id={`system-prompt-${step.id}`}
                        name="llm_system_prompt"
                        rows={5}
                        defaultValue={step.llm_system_prompt ?? ""}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`user-prompt-${step.id}`}
                        className="mb-1 block text-sm font-medium text-panel-foreground"
                      >
                        User Prompt
                      </label>
                      <textarea
                        id={`user-prompt-${step.id}`}
                        name="llm_user_prompt"
                        rows={5}
                        defaultValue={step.llm_user_prompt ?? ""}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>
                      Current step type:{" "}
                      {getLookupValue(step.humor_flavor_step_types as Lookup, "slug")}
                    </span>
                    <span>
                      Current model: {getLookupValue(step.llm_models as Lookup, "name")}
                    </span>
                    <span>
                      Input: {getLookupValue(step.llm_input_types as Lookup, "slug")}
                    </span>
                    <span>
                      Output: {getLookupValue(step.llm_output_types as Lookup, "slug")}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      formAction={moveHumorFlavorStepUpAction}
                      disabled={index === 0}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Move Up
                    </button>
                    <button
                      type="submit"
                      formAction={moveHumorFlavorStepDownAction}
                      disabled={index === steps.length - 1}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Move Down
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      Save Changes
                    </button>
                    <button
                      type="submit"
                      formAction={deleteHumorFlavorStepAction}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </form>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
                {stepsError ? "Unable to display steps." : "No steps found for this flavor."}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
