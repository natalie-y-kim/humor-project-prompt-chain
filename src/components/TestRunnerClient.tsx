"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

type HumorFlavorOption = {
  id: number;
  slug: string;
  description: string | null;
};

type StudyImageSetOption = {
  id: number;
  slug: string;
  description: string | null;
  images: TestImageOption[];
};

type TestImageOption = {
  id: string;
  url: string | null;
  additionalContext: string | null;
  imageDescription: string | null;
};

type TestRunnerClientProps = {
  humorFlavors: HumorFlavorOption[];
  studyImageSets: StudyImageSetOption[];
};

type RunnerResponse = {
  humorFlavor: {
    id: number;
    slug: string;
  };
  image: {
    id: string;
    url: string | null;
    additional_context: string | null;
    image_description: string | null;
  };
  result: unknown;
  persisted: boolean;
};

function normalizeResultItems(result: unknown) {
  if (Array.isArray(result)) {
    return result.map((item, index) => ({
      id: `${index}`,
      title: `Caption ${index + 1}`,
      content:
        typeof item === "string"
          ? item
          : typeof item === "object" && item && "content" in item
            ? String((item as { content?: unknown }).content ?? "")
            : JSON.stringify(item, null, 2),
    }));
  }

  return [];
}

export function TestRunnerClient({
  humorFlavors,
  studyImageSets,
}: TestRunnerClientProps) {
  const [humorFlavorId, setHumorFlavorId] = useState(
    humorFlavors[0] ? String(humorFlavors[0].id) : "",
  );
  const [studyImageSetId, setStudyImageSetId] = useState(
    studyImageSets[0] ? String(studyImageSets[0].id) : "",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<RunnerResponse | null>(null);

  const selectedStudyImageSet =
    studyImageSets.find((set) => String(set.id) === studyImageSetId) ?? null;
  const testImages = selectedStudyImageSet?.images ?? [];
  const [imageId, setImageId] = useState(testImages[0]?.id ?? "");

  const selectedImage = testImages.find((image) => image.id === imageId) ?? null;
  const selectedHumorFlavor =
    humorFlavors.find((flavor) => String(flavor.id) === humorFlavorId) ?? null;
  const filteredHumorFlavors = humorFlavors;

  const onStudyImageSetChange = (nextStudyImageSetId: string) => {
    setStudyImageSetId(nextStudyImageSetId);
    setResponse(null);
    setError(null);

    const nextStudyImageSet =
      studyImageSets.find((set) => String(set.id) === nextStudyImageSetId) ?? null;

    setImageId(nextStudyImageSet?.images[0]?.id ?? "");
  };

  const onRun = async () => {
    setIsRunning(true);
    setError(null);
    setResponse(null);

    try {
      const result = await fetch("/api/prompt-chain/test-runner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ humorFlavorId, studyImageSetId, imageId }),
      });

      const data = (await result.json()) as RunnerResponse | { error?: string };

      if (!result.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in data && data.error
            ? data.error
            : "Test run failed.",
        );
      }

      setResponse(data as RunnerResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const normalizedItems = response ? normalizeResultItems(response.result) : [];

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
        <h2 className="text-lg font-semibold text-panel-foreground">Run Caption Test</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a humor flavor and a test image, then run the Assignment 5 caption
          generation flow against the existing API.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a test set first, then choose one image from that set to run this humor
          flavor against.
        </p>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <div>
              <label
                htmlFor="study-image-set-select"
                className="mb-1 block text-sm font-medium text-panel-foreground"
              >
                Study Image Set
              </label>
              <select
                id="study-image-set-select"
                value={studyImageSetId}
                onChange={(event) => onStudyImageSetChange(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
              >
                {studyImageSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.slug}
                  </option>
                ))}
              </select>
              {selectedStudyImageSet?.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedStudyImageSet.description}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="humor-flavor-select"
                className="mb-1 block text-sm font-medium text-panel-foreground"
              >
                Humor Flavor
              </label>
              <p className="mb-2 text-xs text-muted-foreground">
                Start typing in the select list to search the available flavors.
              </p>
              <select
                id="humor-flavor-select"
                value={humorFlavorId}
                onChange={(event) => setHumorFlavorId(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
              >
                {filteredHumorFlavors.map((flavor) => (
                  <option key={flavor.id} value={flavor.id}>
                    {flavor.slug}
                  </option>
                ))}
              </select>
              {filteredHumorFlavors.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No humor flavors match the current search.
                </p>
              ) : null}
              {selectedHumorFlavor && !filteredHumorFlavors.some((flavor) => flavor.id === selectedHumorFlavor.id) ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Current selection: <code>{selectedHumorFlavor.slug}</code>. Clear or adjust the
                  search to view it in the list.
                </p>
              ) : null}
              {selectedHumorFlavor?.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedHumorFlavor.description}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="test-image-select"
                className="mb-1 block text-sm font-medium text-panel-foreground"
              >
                Test Image
              </label>
              <select
                id="test-image-select"
                value={imageId}
                onChange={(event) => setImageId(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-panel-foreground outline-none focus:border-slate-400"
              >
                {testImages.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.url ?? image.id}
                  </option>
                ))}
              </select>
              {testImages.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No images are mapped to the selected study image set.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <h3 className="text-sm font-semibold text-panel-foreground">Selected Test Image</h3>
            {selectedImage?.url ? (
              <div className="mt-3 grid gap-3">
                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                  <img
                    src={selectedImage.url}
                    alt="Selected test"
                    className="h-auto max-h-[360px] w-full object-contain"
                  />
                </div>
                {selectedImage.imageDescription || selectedImage.additionalContext ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedImage.imageDescription ?? selectedImage.additionalContext}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Select an image to preview it before running the test.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning || !humorFlavorId || !studyImageSetId || !imageId}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {isRunning ? "Running Test..." : "Run Test"}
          </button>
        </div>

        {error ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </section>

      {response ? (
        <section className="rounded-2xl border border-border bg-panel p-6 text-panel-foreground shadow-sm">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-panel-foreground">Test Results</h2>
            <p className="text-sm text-muted-foreground">
              Flavor <code>{response.humorFlavor.slug}</code> on image{" "}
              <code>{response.image.id}</code>.
            </p>
            <p className="text-sm text-muted-foreground">
              Persistence: {response.persisted ? "stored" : "shown in UI only"}.
            </p>
          </div>

          {normalizedItems.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {normalizedItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-border bg-muted p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-lg font-semibold leading-7 text-panel-foreground">
                    {item.content || "(empty caption content)"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-muted p-4 text-sm text-panel-foreground">
              {JSON.stringify(response.result, null, 2)}
            </pre>
          )}
        </section>
      ) : null}
    </div>
  );
}
