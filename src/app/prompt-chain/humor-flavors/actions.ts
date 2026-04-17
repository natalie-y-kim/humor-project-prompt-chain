"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";
import { getNullableTextValue, getTextValue } from "@/lib/crud";

export async function createHumorFlavorAction(formData: FormData) {
  await requirePromptChainAccess();

  const slug = getTextValue(formData, "slug");
  const description = getNullableTextValue(formData, "description");

  if (!slug) {
    redirect("/prompt-chain/humor-flavors?error=Slug%20is%20required.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavors")
    .insert({ slug, description });

  if (error) {
    redirect(
      "/prompt-chain/humor-flavors?error=Failed%20to%20create%20humor%20flavor.",
    );
  }

  revalidatePath("/prompt-chain");
  revalidatePath("/prompt-chain/humor-flavors");
  redirect(
    "/prompt-chain/humor-flavors?success=Humor%20flavor%20created%20successfully.",
  );
}

export async function updateHumorFlavorAction(formData: FormData) {
  await requirePromptChainAccess();

  const id = getTextValue(formData, "id");
  const slug = getTextValue(formData, "slug");
  const description = getNullableTextValue(formData, "description");

  if (!id) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  if (!slug) {
    redirect(
      "/prompt-chain/humor-flavors?error=Slug%20is%20required%20for%20updates.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavors")
    .update({ slug, description })
    .eq("id", id);

  if (error) {
    redirect(
      "/prompt-chain/humor-flavors?error=Failed%20to%20update%20humor%20flavor.",
    );
  }

  revalidatePath("/prompt-chain");
  revalidatePath("/prompt-chain/humor-flavors");
  redirect(
    "/prompt-chain/humor-flavors?success=Humor%20flavor%20updated%20successfully.",
  );
}

export async function deleteHumorFlavorAction(formData: FormData) {
  await requirePromptChainAccess();

  const id = getTextValue(formData, "id");

  if (!id) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("humor_flavors").delete().eq("id", id);

  if (error) {
    redirect(
      "/prompt-chain/humor-flavors?error=Failed%20to%20delete%20humor%20flavor.",
    );
  }

  revalidatePath("/prompt-chain");
  revalidatePath("/prompt-chain/humor-flavors");
  redirect(
    "/prompt-chain/humor-flavors?success=Humor%20flavor%20deleted%20successfully.",
  );
}

async function generateUniqueCopiedSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  originalSlug: string,
) {
  const baseSlug = `${originalSlug}-copy`;
  let candidate = baseSlug;
  let copyIndex = 2;

  while (true) {
    const { data: existing, error } = await supabase
      .from("humor_flavors")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      redirect(
        "/prompt-chain/humor-flavors?error=Failed%20to%20verify%20flavor%20slug%20uniqueness.",
      );
    }

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${copyIndex}`;
    copyIndex += 1;
  }
}

export async function duplicateHumorFlavorAction(formData: FormData) {
  await requirePromptChainAccess();

  const id = getTextValue(formData, "id");

  if (!id) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  const supabase = await createClient();

  const { data: originalFlavor, error: flavorError } = await supabase
    .from("humor_flavors")
    .select("id, slug, description")
    .eq("id", id)
    .single();

  if (flavorError || !originalFlavor) {
    redirect(
      "/prompt-chain/humor-flavors?error=Failed%20to%20load%20original%20humor%20flavor.",
    );
  }

  const { data: originalSteps, error: stepsError } = await supabase
    .from("humor_flavor_steps")
    .select(
      "llm_temperature, order_by, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, llm_system_prompt, llm_user_prompt, description",
    )
    .eq("humor_flavor_id", originalFlavor.id)
    .order("order_by", { ascending: true })
    .order("id", { ascending: true });

  if (stepsError) {
    redirect(
      "/prompt-chain/humor-flavors?error=Failed%20to%20load%20steps%20for%20duplication.",
    );
  }

  const uniqueSlug = await generateUniqueCopiedSlug(supabase, originalFlavor.slug);

  const { data: newFlavor, error: insertFlavorError } = await supabase
    .from("humor_flavors")
    .insert({ slug: uniqueSlug, description: originalFlavor.description })
    .select("id")
    .single();

  if (insertFlavorError || !newFlavor) {
    redirect(
      "/prompt-chain/humor-flavors?error=Failed%20to%20create%20duplicated%20humor%20flavor.",
    );
  }

  if (originalSteps && originalSteps.length > 0) {
    const stepInserts = originalSteps.map((step) => ({
      humor_flavor_id: newFlavor.id,
      order_by: step.order_by,
      llm_input_type_id: step.llm_input_type_id,
      llm_output_type_id: step.llm_output_type_id,
      llm_model_id: step.llm_model_id,
      humor_flavor_step_type_id: step.humor_flavor_step_type_id,
      llm_temperature: step.llm_temperature,
      llm_system_prompt: step.llm_system_prompt,
      llm_user_prompt: step.llm_user_prompt,
      description: step.description,
    }));

    const { error: insertStepsError } = await supabase
      .from("humor_flavor_steps")
      .insert(stepInserts);

    if (insertStepsError) {
      redirect(
        "/prompt-chain/humor-flavors?error=Failed%20to%20copy%20humor%20flavor%20steps.",
      );
    }
  }

  revalidatePath("/prompt-chain");
  revalidatePath("/prompt-chain/humor-flavors");
  revalidatePath(`/prompt-chain/humor-flavors/${newFlavor.id}/steps`);

  redirect(
    `/prompt-chain/humor-flavors/${newFlavor.id}/steps?success=Humor%20flavor%20duplicated%20successfully.%20Slug%20${encodeURIComponent(
      uniqueSlug,
    )}`,
  );
}
