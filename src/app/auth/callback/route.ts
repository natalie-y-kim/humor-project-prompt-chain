import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/prompt-chain`);
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/prompt-chain`);
      }

      return NextResponse.redirect(`${origin}/prompt-chain`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
