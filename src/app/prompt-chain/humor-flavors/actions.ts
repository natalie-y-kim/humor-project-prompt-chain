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
