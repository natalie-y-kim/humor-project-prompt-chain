"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { SectionCard } from "./SectionCard";
import { FormField } from "./FormField";
import { AlertBanner } from "./AlertBanner";

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
      <SectionCard
        title="Run Caption Test"
        description="Choose a humor flavor and a test image, then run the Assignment 5 caption generation flow against the existing API. Select a test set first, then choose one image from that set to run this humor flavor against."
      >

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <FormField
              label="Study Image Set"
              htmlFor="study-image-set-select"
              description={selectedStudyImageSet?.description || undefined}
            >
              <select
                id="study-image-set-select"
                value={studyImageSetId}
                onChange={(event) => onStudyImageSetChange(event.target.value)}
                className="w-full"
              >
                {studyImageSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.slug}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Humor Flavor"
              htmlFor="humor-flavor-select"
              description="Start typing in the select list to search the available flavors."
            >
              <select
                id="humor-flavor-select"
                value={humorFlavorId}
                onChange={(event) => setHumorFlavorId(event.target.value)}
                className="w-full"
              >
                {filteredHumorFlavors.map((flavor) => (
                  <option key={flavor.id} value={flavor.id}>
                    {flavor.slug}
                  </option>
                ))}
              </select>
              {filteredHumorFlavors.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No humor flavors match the current search.
                </p>
              )}
              {selectedHumorFlavor && !filteredHumorFlavors.some((flavor) => flavor.id === selectedHumorFlavor.id) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Current selection: <code>{selectedHumorFlavor.slug}</code>. Clear or adjust the
                  search to view it in the list.
                </p>
              )}
              {selectedHumorFlavor?.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedHumorFlavor.description}
                </p>
              )}
            </FormField>

            <FormField label="Test Image" htmlFor="test-image-select">
              <select
                id="test-image-select"
                value={imageId}
                onChange={(event) => setImageId(event.target.value)}
                className="w-full"
              >
                {testImages.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.url ?? image.id}
                  </option>
                ))}
              </select>
              {testImages.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No images are mapped to the selected study image set.
                </p>
              )}
            </FormField>
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
            className="btn btn-primary"
          >
            {isRunning ? "Running Test..." : "Run Test"}
          </button>
        </div>

        {error && (
          <AlertBanner type="error">{error}</AlertBanner>
        )}
      </SectionCard>

      {response && (
        <SectionCard
          title="Test Results"
          description={`Flavor ${response.humorFlavor.slug} on image ${response.image.id}. Persistence: ${response.persisted ? "stored" : "shown in UI only"}.`}
        >

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
        </SectionCard>
      )}
    </div>
  );
}
