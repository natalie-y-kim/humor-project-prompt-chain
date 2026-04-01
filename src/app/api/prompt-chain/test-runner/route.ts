import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedPromptChainUser } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";
import { generateCaptions } from "@/lib/pipeline";

export async function POST(request: NextRequest) {
  const authorizedUser = await getAuthorizedPromptChainUser();

  if (!authorizedUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { humorFlavorId?: string; studyImageSetId?: string; imageId?: string } | null = null;

  try {
    body = (await request.json()) as {
      humorFlavorId?: string;
      studyImageSetId?: string;
      imageId?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const humorFlavorId = body?.humorFlavorId?.trim();
  const studyImageSetId = body?.studyImageSetId?.trim();
  const imageId = body?.imageId?.trim();

  if (!humorFlavorId || !studyImageSetId || !imageId) {
    return NextResponse.json(
      { error: "humorFlavorId, studyImageSetId, and imageId are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const [
    {
      data: { session },
    },
    { data: humorFlavor, error: humorFlavorError },
    { data: studyImageSet, error: studyImageSetError },
    { data: imageMapping, error: imageMappingError },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("humor_flavors").select("id, slug").eq("id", humorFlavorId).single(),
    supabase
      .from("study_image_sets")
      .select("id, slug")
      .eq("id", studyImageSetId)
      .single(),
    supabase
      .from("study_image_set_image_mappings")
      .select(`
        id,
        study_image_set_id,
        image:images (
          id,
          url,
          additional_context,
          image_description
        )
      `)
      .eq("study_image_set_id", studyImageSetId)
      .eq("image_id", imageId)
      .single(),
  ]);

  if (!session?.access_token) {
    return NextResponse.json(
      { error: "Missing auth access token. Please sign in again." },
      { status: 401 },
    );
  }

  if (humorFlavorError || !humorFlavor) {
    return NextResponse.json({ error: "Selected humor flavor was not found." }, { status: 404 });
  }

  if (studyImageSetError || !studyImageSet) {
    return NextResponse.json({ error: "Selected study image set was not found." }, { status: 404 });
  }

  const image = Array.isArray(imageMapping?.image)
    ? imageMapping.image[0]
    : imageMapping?.image;

  if (imageMappingError || !image) {
    return NextResponse.json(
      { error: "Selected test image does not belong to the selected study image set." },
      { status: 404 },
    );
  }

  try {
    const result = await generateCaptions(session.access_token, {
      imageId,
      humorFlavorId,
    });

    return NextResponse.json({
      humorFlavor,
      image,
      result,
      persisted: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Caption generation failed.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
