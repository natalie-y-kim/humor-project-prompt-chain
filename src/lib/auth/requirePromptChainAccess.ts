import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type PromptChainProfile = {
  is_superadmin: boolean;
  is_matrix_admin: boolean;
};

export async function getAuthorizedPromptChainUser(): Promise<{ user: User } | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single<PromptChainProfile>();

  if (
    profileError ||
    (!profile?.is_superadmin && !profile?.is_matrix_admin)
  ) {
    return null;
  }

  return { user };
}

export async function requirePromptChainAccess(): Promise<{ user: User }> {
  const authorizedUser = await getAuthorizedPromptChainUser();

  if (!authorizedUser) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    redirect("/prompt-chain/access-denied");
  }

  return authorizedUser;
}
