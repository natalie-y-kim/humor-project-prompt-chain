import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedPromptChainUser } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";
import { generateCaptions } from "@/lib/pipeline";

export async function POST(request: NextRequest) {
  const authorizedUser = await getAuthorizedPromptChainUser();

  if (!authorizedUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { humorFlavorId?: string; imageId?: string } | null = null;

  try {
    body = (await request.json()) as { humorFlavorId?: string; imageId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const humorFlavorId = body?.humorFlavorId?.trim();
  const imageId = body?.imageId?.trim();

  if (!humorFlavorId || !imageId) {
    return NextResponse.json(
      { error: "humorFlavorId and imageId are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const [
    {
      data: { session },
    },
    { data: humorFlavor, error: humorFlavorError },
    { data: image, error: imageError },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("humor_flavors").select("id, slug").eq("id", humorFlavorId).single(),
    supabase
      .from("images")
      .select("id, url, additional_context, image_description")
      .eq("id", imageId)
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

  if (imageError || !image) {
    return NextResponse.json({ error: "Selected test image was not found." }, { status: 404 });
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
