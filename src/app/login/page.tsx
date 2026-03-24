import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginGate from "@/components/LoginGate";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/prompt-chain");
  }

  return <LoginGate />;
}
