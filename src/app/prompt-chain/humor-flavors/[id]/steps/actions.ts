"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePromptChainAccess } from "@/lib/auth/requirePromptChainAccess";
import { createClient } from "@/lib/supabase/server";
import {
  getNullableDecimalValue,
  getNullableTextValue,
  getRequiredIntegerValue,
  getTextValue,
} from "@/lib/crud";

function getStepsPath(humorFlavorId: string) {
  return `/prompt-chain/humor-flavors/${humorFlavorId}/steps`;
}

async function reorderHumorFlavorSteps(
  humorFlavorId: string,
  stepId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();
  const { data: steps, error } = await supabase
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("humor_flavor_id", humorFlavorId)
    .order("order_by", { ascending: true })
    .order("id", { ascending: true });

  if (error || !steps) {
    redirect(
      `${getStepsPath(humorFlavorId)}?error=Failed%20to%20load%20steps%20for%20reordering.`,
    );
  }

  const currentIndex = steps.findIndex((step) => String(step.id) === stepId);

  if (currentIndex === -1) {
    redirect(`${getStepsPath(humorFlavorId)}?error=Invalid%20step%20ID.`);
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= steps.length) {
    redirect(getStepsPath(humorFlavorId));
  }

  const reorderedSteps = [...steps];
  const [movedStep] = reorderedSteps.splice(currentIndex, 1);
  reorderedSteps.splice(targetIndex, 0, movedStep);

  const updates = reorderedSteps.map((step, index) =>
    supabase
      .from("humor_flavor_steps")
      .update({ order_by: index + 1 })
      .eq("id", step.id),
  );

  const results = await Promise.all(updates);
  const failedUpdate = results.find((result) => result.error);

  if (failedUpdate?.error) {
    redirect(
      `${getStepsPath(humorFlavorId)}?error=Failed%20to%20persist%20step%20order.`,
    );
  }
}

export async function createHumorFlavorStepAction(formData: FormData) {
  await requirePromptChainAccess();

  const humorFlavorId = getTextValue(formData, "humor_flavor_id");
  const orderBy = getRequiredIntegerValue(formData, "order_by");
  const llmInputTypeId = getRequiredIntegerValue(formData, "llm_input_type_id");
  const llmOutputTypeId = getRequiredIntegerValue(formData, "llm_output_type_id");
  const llmModelId = getRequiredIntegerValue(formData, "llm_model_id");
  const humorFlavorStepTypeId = getRequiredIntegerValue(
    formData,
    "humor_flavor_step_type_id",
  );
  const llmTemperature = getNullableDecimalValue(formData, "llm_temperature");
  const llmSystemPrompt = getNullableTextValue(formData, "llm_system_prompt");
  const llmUserPrompt = getNullableTextValue(formData, "llm_user_prompt");
  const description = getNullableTextValue(formData, "description");

  if (!humorFlavorId) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  if (
    orderBy === null ||
    llmInputTypeId === null ||
    llmOutputTypeId === null ||
    llmModelId === null ||
    humorFlavorStepTypeId === null
  ) {
    redirect(
      `${getStepsPath(humorFlavorId)}?error=Order%2C%20input%20type%2C%20output%20type%2C%20model%2C%20and%20step%20type%20are%20required.`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("humor_flavor_steps").insert({
    humor_flavor_id: humorFlavorId,
    order_by: orderBy,
    llm_input_type_id: llmInputTypeId,
    llm_output_type_id: llmOutputTypeId,
    llm_model_id: llmModelId,
    humor_flavor_step_type_id: humorFlavorStepTypeId,
    llm_temperature: llmTemperature,
    llm_system_prompt: llmSystemPrompt,
    llm_user_prompt: llmUserPrompt,
    description,
  });

  if (error) {
    redirect(
      `${getStepsPath(humorFlavorId)}?error=Failed%20to%20create%20humor%20flavor%20step.`,
    );
  }

  revalidatePath("/prompt-chain");
  revalidatePath("/prompt-chain/humor-flavors");
  revalidatePath(getStepsPath(humorFlavorId));
  redirect(
    `${getStepsPath(humorFlavorId)}?success=Humor%20flavor%20step%20created%20successfully.`,
  );
}

export async function updateHumorFlavorStepAction(formData: FormData) {
  await requirePromptChainAccess();

  const id = getTextValue(formData, "id");
  const humorFlavorId = getTextValue(formData, "humor_flavor_id");
  const orderBy = getRequiredIntegerValue(formData, "order_by");
  const llmInputTypeId = getRequiredIntegerValue(formData, "llm_input_type_id");
  const llmOutputTypeId = getRequiredIntegerValue(formData, "llm_output_type_id");
  const llmModelId = getRequiredIntegerValue(formData, "llm_model_id");
  const humorFlavorStepTypeId = getRequiredIntegerValue(
    formData,
    "humor_flavor_step_type_id",
  );
  const llmTemperature = getNullableDecimalValue(formData, "llm_temperature");
  const llmSystemPrompt = getNullableTextValue(formData, "llm_system_prompt");
  const llmUserPrompt = getNullableTextValue(formData, "llm_user_prompt");
  const description = getNullableTextValue(formData, "description");

  if (!humorFlavorId) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  if (!id) {
    redirect(`${getStepsPath(humorFlavorId)}?error=Invalid%20step%20ID.`);
  }

  if (
    orderBy === null ||
    llmInputTypeId === null ||
    llmOutputTypeId === null ||
    llmModelId === null ||
    humorFlavorStepTypeId === null
  ) {
    redirect(
      `${getStepsPath(humorFlavorId)}?error=Order%2C%20input%20type%2C%20output%20type%2C%20model%2C%20and%20step%20type%20are%20required.`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavor_steps")
    .update({
      order_by: orderBy,
      llm_input_type_id: llmInputTypeId,
      llm_output_type_id: llmOutputTypeId,
      llm_model_id: llmModelId,
      humor_flavor_step_type_id: humorFlavorStepTypeId,
      llm_temperature: llmTemperature,
      llm_system_prompt: llmSystemPrompt,
      llm_user_prompt: llmUserPrompt,
      description,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `${getStepsPath(humorFlavorId)}?error=Failed%20to%20update%20humor%20flavor%20step.`,
    );
  }

  revalidatePath("/prompt-chain");
  revalidatePath("/prompt-chain/humor-flavors");
  revalidatePath(getStepsPath(humorFlavorId));
  redirect(
    `${getStepsPath(humorFlavorId)}?success=Humor%20flavor%20step%20updated%20successfully.`,
  );
}

export async function deleteHumorFlavorStepAction(formData: FormData) {
  await requirePromptChainAccess();

  const id = getTextValue(formData, "id");
  const humorFlavorId = getTextValue(formData, "humor_flavor_id");

  if (!humorFlavorId) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  if (!id) {
    redirect(`${getStepsPath(humorFlavorId)}?error=Invalid%20step%20ID.`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(
      `${getStepsPath(humorFlavorId)}?error=Failed%20to%20delete%20humor%20flavor%20step.`,
    );
  }

  revalidatePath("/prompt-chain");
  revalidatePath("/prompt-chain/humor-flavors");
  revalidatePath(getStepsPath(humorFlavorId));
  redirect(
    `${getStepsPath(humorFlavorId)}?success=Humor%20flavor%20step%20deleted%20successfully.`,
  );
}

export async function moveHumorFlavorStepUpAction(formData: FormData) {
  await requirePromptChainAccess();

  const id = getTextValue(formData, "id");
  const humorFlavorId = getTextValue(formData, "humor_flavor_id");

  if (!humorFlavorId) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  if (!id) {
    redirect(`${getStepsPath(humorFlavorId)}?error=Invalid%20step%20ID.`);
  }

  await reorderHumorFlavorSteps(humorFlavorId, id, "up");

  revalidatePath(getStepsPath(humorFlavorId));
  redirect(
    `${getStepsPath(humorFlavorId)}?success=Humor%20flavor%20step%20moved%20up.`,
  );
}

export async function moveHumorFlavorStepDownAction(formData: FormData) {
  await requirePromptChainAccess();

  const id = getTextValue(formData, "id");
  const humorFlavorId = getTextValue(formData, "humor_flavor_id");

  if (!humorFlavorId) {
    redirect("/prompt-chain/humor-flavors?error=Invalid%20humor%20flavor%20ID.");
  }

  if (!id) {
    redirect(`${getStepsPath(humorFlavorId)}?error=Invalid%20step%20ID.`);
  }

  await reorderHumorFlavorSteps(humorFlavorId, id, "down");

  revalidatePath(getStepsPath(humorFlavorId));
  redirect(
    `${getStepsPath(humorFlavorId)}?success=Humor%20flavor%20step%20moved%20down.`,
  );
}
