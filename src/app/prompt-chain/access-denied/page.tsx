import Link from "next/link";

export default function PromptChainAccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Access Denied
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Prompt Chain Authorization Required
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          You are signed in, but your profile does not have
          `is_superadmin = true` or `is_matrix_admin = true`.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            prefetch={false}
            className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Go to login
          </Link>
          <Link
            href="/logout"
            prefetch={false}
            className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Logout
          </Link>
        </div>
      </section>
    </main>
  );
}
