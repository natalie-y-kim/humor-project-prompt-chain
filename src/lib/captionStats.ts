import type { SupabaseClient } from "@supabase/supabase-js";

type CaptionRow = {
  id: string;
  created_datetime_utc: string | null;
  content: string | null;
  humor_flavor_id: number | null;
  like_count: number | null;
  humor_flavors:
    | {
        slug: string | null;
      }
    | {
        slug: string | null;
      }[]
    | null;
};

type VoteRow = {
  caption_id: string;
  vote_value: number;
  profile_id: string;
  created_datetime_utc: string | null;
};

type CaptionActionRow = {
  caption_id: string;
};

type HumorFlavorRow = {
  id: number;
  slug: string | null;
};

type HumorFlavorStepRow = {
  humor_flavor_id: number;
};

export type CaptionStatsSummary = {
  totalCaptions: number;
  ratedCaptions: number;
  unratedCaptions: number;
  totalRatings: number;
  averageRating: number | null;
  uniqueRaters: number;
  totalLikes: number;
  totalSaves: number;
};

export type PromptChainSetupSummary = {
  totalHumorFlavors: number;
  totalPromptChains: number;
  totalFlavorSteps: number;
  averageStepsPerFlavor: number;
  flavorsWithZeroSteps: number;
  captionsMissingFlavor: number;
  highOutputFlavorsWithoutVotes: number;
};

export type CaptionStatsSources = {
  ratings: string;
  likes: string;
  saves: string;
};

export type HumorFlavorRatingStats = {
  flavorId: number | null;
  label: string;
  captionCount: number;
  ratedCaptionCount: number;
  ratingCount: number;
  averageRating: number | null;
  likeCount: number;
  saveCount: number;
};

export type TopRatedCaption = {
  id: string;
  content: string;
  flavorLabel: string;
  averageRating: number;
  ratingCount: number;
  likeCount: number;
  saveCount: number;
};

export type RecentRatingBucket = {
  dateLabel: string;
  ratingCount: number;
};

export type VoteDistributionBucket = {
  voteValue: number;
  count: number;
};

export type CaptionRatingDashboardStats = {
  summary: CaptionStatsSummary;
  setup: PromptChainSetupSummary;
  sources: CaptionStatsSources;
  byFlavor: HumorFlavorRatingStats[];
  topCaptions: TopRatedCaption[];
  recentRatings: RecentRatingBucket[];
  voteDistribution: VoteDistributionBucket[];
};

const MIN_TOP_CAPTION_RATINGS = 2;
const RECENT_RATING_DAYS = 14;

function formatAverage(total: number, count: number): number | null {
  if (count === 0) {
    return null;
  }

  return Math.round((total / count) * 100) / 100;
}

function getFlavorLabel(caption: CaptionRow): string {
  const relation = Array.isArray(caption.humor_flavors)
    ? caption.humor_flavors[0]
    : caption.humor_flavors;

  return relation?.slug || "Unassigned";
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export async function getCaptionRatingDashboardStats(
  supabase: SupabaseClient,
): Promise<CaptionRatingDashboardStats> {
  const [
    { data: captionsData, error: captionsError },
    { count: captionCount, error: captionCountError },
    { data: votesData, error: votesError },
    { data: humorFlavorsData, error: humorFlavorsError },
    { count: humorFlavorCount, error: humorFlavorCountError },
    { count: promptChainCount, error: promptChainsError },
    { data: flavorStepsData, error: flavorStepsError },
    { count: flavorStepCount, error: flavorStepCountError },
  ] = await Promise.all([
    supabase
      .from("captions")
      .select(
        `
          id,
          created_datetime_utc,
          content,
          humor_flavor_id,
          like_count,
          humor_flavors (
            slug
          )
        `,
      ),
    supabase.from("captions").select("id", { count: "exact", head: true }),
    supabase
      .from("caption_votes")
      .select("caption_id, vote_value, profile_id, created_datetime_utc"),
    supabase.from("humor_flavors").select("id, slug"),
    supabase.from("humor_flavors").select("id", { count: "exact", head: true }),
    supabase.from("llm_prompt_chains").select("id", { count: "exact", head: true }),
    supabase.from("humor_flavor_steps").select("humor_flavor_id"),
    supabase.from("humor_flavor_steps").select("id", { count: "exact", head: true }),
  ]);

  if (captionsError) {
    throw new Error(`Unable to load captions: ${captionsError.message}`);
  }

  if (captionCountError) {
    throw new Error(`Unable to count captions: ${captionCountError.message}`);
  }

  if (votesError) {
    throw new Error(`Unable to load caption votes: ${votesError.message}`);
  }

  if (humorFlavorsError) {
    throw new Error(`Unable to load humor flavors: ${humorFlavorsError.message}`);
  }

  if (humorFlavorCountError) {
    throw new Error(`Unable to count humor flavors: ${humorFlavorCountError.message}`);
  }

  if (promptChainsError) {
    throw new Error(`Unable to load prompt chains: ${promptChainsError.message}`);
  }

  if (flavorStepsError) {
    throw new Error(`Unable to load humor flavor steps: ${flavorStepsError.message}`);
  }

  if (flavorStepCountError) {
    throw new Error(`Unable to count humor flavor steps: ${flavorStepCountError.message}`);
  }

  const [
    { data: likesData, error: likesError },
    { data: savesData, error: savesError },
  ] = await Promise.all([
    supabase.from("caption_likes").select("caption_id"),
    supabase.from("caption_saved").select("caption_id"),
  ]);

  const captions = (captionsData ?? []) as CaptionRow[];
  const votes = (votesData ?? []) as VoteRow[];
  const humorFlavors = (humorFlavorsData ?? []) as HumorFlavorRow[];
  const flavorSteps = (flavorStepsData ?? []) as HumorFlavorStepRow[];
  const likes = likesError ? [] : ((likesData ?? []) as CaptionActionRow[]);
  const saves = savesError ? [] : ((savesData ?? []) as CaptionActionRow[]);
  const useCaptionLikeCountFallback = Boolean(likesError);
  const useSaveUnavailableFallback = Boolean(savesError);
  const sources: CaptionStatsSources = {
    ratings: "`caption_votes.vote_value`",
    likes: useCaptionLikeCountFallback
      ? "`captions.like_count` because `caption_likes` is unavailable"
      : "`caption_likes` rows",
    saves: useSaveUnavailableFallback
      ? "`caption_saved` is unavailable"
      : "`caption_saved` rows",
  };

  const captionById = new Map(captions.map((caption) => [caption.id, caption]));
  const stepCountByFlavor = new Map<number, number>();
  const likesByCaption = new Map<string, number>();
  const savesByCaption = new Map<string, number>();
  const votesByCaption = new Map<string, VoteRow[]>();
  const uniqueRaters = new Set<string>();

  for (const step of flavorSteps) {
    stepCountByFlavor.set(
      step.humor_flavor_id,
      (stepCountByFlavor.get(step.humor_flavor_id) ?? 0) + 1,
    );
  }

  for (const like of likes) {
    if (!captionById.has(like.caption_id)) {
      continue;
    }

    likesByCaption.set(like.caption_id, (likesByCaption.get(like.caption_id) ?? 0) + 1);
  }

  for (const save of saves) {
    if (!captionById.has(save.caption_id)) {
      continue;
    }

    savesByCaption.set(save.caption_id, (savesByCaption.get(save.caption_id) ?? 0) + 1);
  }

  for (const vote of votes) {
    uniqueRaters.add(vote.profile_id);
    const captionVotes = votesByCaption.get(vote.caption_id) ?? [];
    captionVotes.push(vote);
    votesByCaption.set(vote.caption_id, captionVotes);
  }

  const totalRatingValue = votes.reduce((sum, vote) => sum + vote.vote_value, 0);
  const totalRatings = votes.length;

  const summary: CaptionStatsSummary = {
    totalCaptions: captionCount ?? captions.length,
    ratedCaptions: votesByCaption.size,
    unratedCaptions: Math.max(captions.length - votesByCaption.size, 0),
    totalRatings,
    averageRating: formatAverage(totalRatingValue, totalRatings),
    uniqueRaters: uniqueRaters.size,
    totalLikes: useCaptionLikeCountFallback
      ? captions.reduce((sum, caption) => sum + Number(caption.like_count ?? 0), 0)
      : Array.from(likesByCaption.values()).reduce((sum, count) => sum + count, 0),
    totalSaves: Array.from(savesByCaption.values()).reduce((sum, count) => sum + count, 0),
  };

  const flavorAccumulator = new Map<
    string,
    {
      flavorId: number | null;
      label: string;
      captionCount: number;
      ratedCaptionIds: Set<string>;
      ratingCount: number;
      ratingValue: number;
      likeCount: number;
      saveCount: number;
    }
  >();

  for (const flavor of humorFlavors) {
    const key = String(flavor.id);
    flavorAccumulator.set(key, {
      flavorId: flavor.id,
      label: flavor.slug || `Flavor ${flavor.id}`,
      captionCount: 0,
      ratedCaptionIds: new Set<string>(),
      ratingCount: 0,
      ratingValue: 0,
      likeCount: 0,
      saveCount: 0,
    });
  }

  for (const caption of captions) {
    const label = getFlavorLabel(caption);
    const key = caption.humor_flavor_id?.toString() ?? "unassigned";
    const existing =
      flavorAccumulator.get(key) ??
      {
        flavorId: caption.humor_flavor_id,
        label,
        captionCount: 0,
        ratedCaptionIds: new Set<string>(),
        ratingCount: 0,
        ratingValue: 0,
        likeCount: 0,
        saveCount: 0,
      };

    const captionVotes = votesByCaption.get(caption.id) ?? [];
    existing.captionCount += 1;
    existing.likeCount += useCaptionLikeCountFallback
      ? Number(caption.like_count ?? 0)
      : (likesByCaption.get(caption.id) ?? 0);
    existing.saveCount += savesByCaption.get(caption.id) ?? 0;

    if (captionVotes.length > 0) {
      existing.ratedCaptionIds.add(caption.id);
      existing.ratingCount += captionVotes.length;
      existing.ratingValue += captionVotes.reduce((sum, vote) => sum + vote.vote_value, 0);
    }

    flavorAccumulator.set(key, existing);
  }

  const flavorsWithZeroSteps = humorFlavors.filter(
    (flavor) => (stepCountByFlavor.get(flavor.id) ?? 0) === 0,
  ).length;

  const byFlavor = Array.from(flavorAccumulator.values())
    .map((flavor): HumorFlavorRatingStats => ({
      flavorId: flavor.flavorId,
      label: flavor.label,
      captionCount: flavor.captionCount,
      ratedCaptionCount: flavor.ratedCaptionIds.size,
      ratingCount: flavor.ratingCount,
      averageRating: formatAverage(flavor.ratingValue, flavor.ratingCount),
      likeCount: flavor.likeCount,
      saveCount: flavor.saveCount,
    }))
    .sort((left, right) => {
      if (right.captionCount !== left.captionCount) {
        return right.captionCount - left.captionCount;
      }

      return left.label.localeCompare(right.label);
    });

  const setup: PromptChainSetupSummary = {
    totalHumorFlavors: humorFlavorCount ?? humorFlavors.length,
    totalPromptChains: promptChainCount ?? 0,
    totalFlavorSteps: flavorStepCount ?? flavorSteps.length,
    averageStepsPerFlavor:
      (humorFlavorCount ?? humorFlavors.length) === 0
        ? 0
        : Math.round(
            ((flavorStepCount ?? flavorSteps.length) /
              (humorFlavorCount ?? humorFlavors.length)) *
              10,
          ) / 10,
    flavorsWithZeroSteps,
    captionsMissingFlavor: captions.filter((caption) => !caption.humor_flavor_id).length,
    highOutputFlavorsWithoutVotes: byFlavor.filter(
      (flavor) => flavor.captionCount >= 10 && flavor.ratingCount === 0,
    ).length,
  };

  const topCaptions = captions
    .map((caption): TopRatedCaption | null => {
      const captionVotes = votesByCaption.get(caption.id) ?? [];

      if (captionVotes.length < MIN_TOP_CAPTION_RATINGS) {
        return null;
      }

      const averageRating = formatAverage(
        captionVotes.reduce((sum, vote) => sum + vote.vote_value, 0),
        captionVotes.length,
      );

      if (averageRating === null) {
        return null;
      }

      return {
        id: caption.id,
        content: caption.content || "(empty caption)",
        flavorLabel: getFlavorLabel(caption),
        averageRating,
        ratingCount: captionVotes.length,
        likeCount: useCaptionLikeCountFallback
          ? Number(caption.like_count ?? 0)
          : (likesByCaption.get(caption.id) ?? 0),
        saveCount: savesByCaption.get(caption.id) ?? 0,
      };
    })
    .filter((caption): caption is TopRatedCaption => caption !== null)
    .sort((left, right) => {
      if (right.averageRating !== left.averageRating) {
        return right.averageRating - left.averageRating;
      }

      return right.ratingCount - left.ratingCount;
    })
    .slice(0, 8);

  const recentRatingCounts = new Map<string, number>();
  const today = new Date();

  for (let index = RECENT_RATING_DAYS - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - index);
    recentRatingCounts.set(formatDateKey(date), 0);
  }

  for (const vote of votes) {
    if (!vote.created_datetime_utc) {
      continue;
    }

    const dateKey = formatDateKey(new Date(vote.created_datetime_utc));

    if (recentRatingCounts.has(dateKey)) {
      recentRatingCounts.set(dateKey, (recentRatingCounts.get(dateKey) ?? 0) + 1);
    }
  }

  const recentRatings = Array.from(recentRatingCounts.entries()).map(
    ([dateKey, ratingCount]) => ({
      dateLabel: formatDateLabel(dateKey),
      ratingCount,
    }),
  );

  const voteDistributionCounts = new Map<number, number>();

  for (const vote of votes) {
    voteDistributionCounts.set(
      vote.vote_value,
      (voteDistributionCounts.get(vote.vote_value) ?? 0) + 1,
    );
  }

  const voteDistribution = Array.from(voteDistributionCounts.entries())
    .map(([voteValue, count]) => ({ voteValue, count }))
    .sort((left, right) => left.voteValue - right.voteValue);

  return {
    summary,
    setup,
    sources,
    byFlavor,
    topCaptions,
    recentRatings,
    voteDistribution,
  };
}
