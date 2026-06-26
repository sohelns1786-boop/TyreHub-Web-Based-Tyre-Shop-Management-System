import AdminPanel from './AdminPanel';

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Control <span className="text-primary font-black">Panel</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">Manage your tyre inventory catalog, stock levels, and client enquiries.</p>
        </div>
      </div>
      <AdminPanel />
    </section>
  );
}
