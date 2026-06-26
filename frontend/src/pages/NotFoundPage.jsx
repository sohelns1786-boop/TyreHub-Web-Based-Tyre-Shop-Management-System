export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-xl shadow-black/10">
        <h1 className="text-4xl font-semibold text-white">404</h1>
        <p className="mt-4 text-white/70">Page not found.</p>
        <a href="/" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-white">
          Back to Home
        </a>
      </div>
    </section>
  );
}
