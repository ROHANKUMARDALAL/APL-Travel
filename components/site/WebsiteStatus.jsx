export default function WebsiteStatus({ availability }) {
  const suspended = availability === "suspended";
  const unreachable = availability === "unreachable";
  const title = suspended
    ? "Website Temporarily Unavailable"
    : unreachable
      ? "Website Temporarily Unavailable"
      : "Website Not Configured";
  const body = suspended
    ? "This travel website has been suspended by the platform. Please contact your agency administrator."
    : unreachable
      ? "This website could not reach the travel service. Please try again in a moment."
      : "This domain is not assigned to a travel agency. Check the address and try again.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">APL Travel</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      </section>
    </main>
  );
}
