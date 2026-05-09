import type {
  CaptionRatingDashboardStats,
  HumorFlavorRatingStats,
} from "@/lib/captionStats";

type CaptionStatsDashboardProps = {
  stats: CaptionRatingDashboardStats;
};

const numberFormatter = new Intl.NumberFormat("en");
const MIN_VOTES_FOR_CAPTION_RANKING = 5;
const MIN_CONFIDENT_FLAVOR_VOTES = 5;

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatScore(value: number | null): string {
  return value === null ? "Needs feedback" : value.toFixed(2);
}

function getFeedbackStatus(row: HumorFlavorRatingStats): string {
  if (row.ratingCount === 0) {
    return "Needs feedback";
  }

  if (row.ratingCount < MIN_CONFIDENT_FLAVOR_VOTES) {
    return "Low confidence";
  }

  return `Avg vote score: ${formatScore(row.averageRating)}`;
}

function getPercent(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <dt className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold text-panel-foreground">
        {value}
      </dd>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

function SetupHealth({ stats }: { stats: CaptionRatingDashboardStats }) {
  return (
    <section className="rounded-xl border border-border bg-panel p-5 text-panel-foreground shadow-sm">
      <h3 className="text-lg font-semibold">Prompt Chain Setup Health</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Checks whether the prompt-chain configuration is complete enough to
        interpret caption output.
      </p>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Avg Steps Per Flavor"
          value={stats.setup.averageStepsPerFlavor.toFixed(1)}
          note="Configured workflow steps divided by humor flavors."
        />
        <StatCard
          label="Flavors With Zero Steps"
          value={formatNumber(stats.setup.flavorsWithZeroSteps)}
          note="These flavors may not produce complete prompt-chain output."
        />
        <StatCard
          label="High-Output, Needs Feedback"
          value={formatNumber(stats.setup.highOutputFlavorsWithoutVotes)}
          note="Flavors with at least 10 loaded captions and no votes."
        />
        <StatCard
          label="Unassigned Captions"
          value={formatNumber(stats.setup.captionsMissingFlavor)}
          note="Loaded captions not connected to a humor flavor."
        />
      </dl>
    </section>
  );
}

function CaptionGenerationByFlavor({ rows }: { rows: HumorFlavorRatingStats[] }) {
  const topRows = rows.filter((row) => row.captionCount > 0).slice(0, 10);
  const maxCaptions = Math.max(...topRows.map((row) => row.captionCount), 0);

  return (
    <section className="rounded-xl border border-border bg-panel p-5 text-panel-foreground shadow-sm">
      <h3 className="text-lg font-semibold">Caption Generation by Humor Flavor</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Top loaded flavors by generated caption count, with feedback shown only
        where votes exist.
      </p>

      {topRows.length === 0 ? (
        <p className="mt-5 rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
          No generated captions are available in the loaded dashboard data yet.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Humor Flavor</th>
                <th className="px-4 py-3 text-left font-semibold">Visible Captions</th>
                <th className="px-4 py-3 text-right font-semibold">Voted Captions</th>
                <th className="px-4 py-3 text-right font-semibold">Total Votes</th>
                <th className="px-4 py-3 text-right font-semibold">Feedback Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-panel">
              {topRows.map((row) => {
                const width =
                  maxCaptions === 0 ? 0 : (row.captionCount / maxCaptions) * 100;

                return (
                  <tr key={row.flavorId ?? "unassigned"}>
                    <td className="max-w-60 px-4 py-3 font-medium text-panel-foreground">
                      <p className="truncate">{row.label}</p>
                    </td>
                    <td className="min-w-56 px-4 py-3">
                      <div className="grid gap-2">
                        <ProgressBar value={width} />
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(row.captionCount)} captions
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(row.ratedCaptionCount)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(row.ratingCount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-panel-foreground">
                      {getFeedbackStatus(row)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function CaptionStatsDashboard({ stats }: CaptionStatsDashboardProps) {
  const voteCoverage = getPercent(
    stats.summary.ratedCaptions,
    stats.summary.totalCaptions,
  );
  const showCaptionRanking =
    stats.summary.totalRatings >= MIN_VOTES_FOR_CAPTION_RANKING &&
    stats.topCaptions.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
        <h2 className="text-2xl font-semibold text-panel-foreground">
          Prompt Chain Performance Dashboard
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          This dashboard summarizes prompt-chain setup, caption generation
          output, and available user feedback so admins can see what is working
          and what needs attention.
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Humor Flavors"
            value={formatNumber(stats.setup.totalHumorFlavors)}
            note="Configured humor styles available to admins."
          />
          <StatCard
            label="Total Prompt Chains"
            value={formatNumber(stats.setup.totalPromptChains)}
            note="Recorded prompt-chain runs."
          />
          <StatCard
            label="Total Flavor Steps"
            value={formatNumber(stats.setup.totalFlavorSteps)}
            note="Configured workflow steps across flavors."
          />
          <StatCard
            label="Generated Captions"
            value={formatNumber(stats.summary.totalCaptions)}
            note="Generated captions available to admins."
          />
          <StatCard
            label="Vote Coverage"
            value={`${voteCoverage.toFixed(1)}%`}
            note={`${formatNumber(stats.summary.ratedCaptions)} captions with votes.`}
          />
        </dl>
      </section>

      <SetupHealth stats={stats} />
      <CaptionGenerationByFlavor rows={stats.byFlavor} />

      {showCaptionRanking ? (
        <section className="rounded-xl border border-border bg-panel p-5 text-panel-foreground shadow-sm">
          <h3 className="text-lg font-semibold">Highest Vote Score Captions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Shown only when enough visible votes exist to avoid overemphasizing
            sparse feedback.
          </p>
          <div className="mt-5 grid gap-3">
            {stats.topCaptions.slice(0, 4).map((caption) => (
              <article
                key={caption.id}
                className="rounded-lg border border-border bg-muted p-4"
              >
                <p className="line-clamp-2 text-sm font-medium text-panel-foreground">
                  {caption.content}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {caption.flavorLabel} · average vote score{" "}
                  {caption.averageRating.toFixed(2)} ·{" "}
                  {formatNumber(caption.ratingCount)} votes
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
}
