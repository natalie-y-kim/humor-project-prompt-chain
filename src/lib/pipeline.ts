function getPipelineBaseUrl() {
  return process.env.ALMOSTCRACKD_API_BASE_URL ?? "https://api.almostcrackd.ai";
}

async function parsePipelineResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

type CaptionGenerationPayload = {
  imageId: string;
  humorFlavorId?: string | number;
};

export async function generateCaptions(
  accessToken: string,
  payload: CaptionGenerationPayload,
): Promise<unknown> {
  const response = await fetch(`${getPipelineBaseUrl()}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return parsePipelineResponse(response);
}
