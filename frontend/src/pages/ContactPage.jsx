import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getCurrentUser } from '../utils/auth';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.name) {
      setForm((prev) => ({ ...prev, name: user.name }));
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/enquiries', form);
      setSuccess('Enquiry submitted. Opening WhatsApp...');
      
      const text = `Hi Rasheed Tyres Planet! My name is *${form.name}* (Mobile: *${form.phone}*). Message: ${form.message}`;
      const whatsappUrl = `https://wa.me/919182736329?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      
      setForm({ name: '', phone: '', message: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
          <h1 className="text-3xl font-semibold text-white">Contact Rasheed Tyres Planet</h1>
          <p className="mt-4 text-white/75">Reach out for tyre enquiries, service booking, or stock availability.</p>
          <div className="mt-8 space-y-5 text-white/75">
            <div>
              <h2 className="font-semibold text-white">Phone</h2>
              <p>+91 91827 36329</p>
            </div>
            <div>
              <h2 className="font-semibold text-white">Email</h2>
              <p>info@tyrehub.com</p>
            </div>
            <div>
              <h2 className="font-semibold text-white">Address</h2>
              <p>Atmakur, Nandyal Dist., Andhra Pradesh</p>
            </div>
          </div>
          <div className="mt-8 rounded-3xl bg-black/70 p-6">
            <h2 className="font-semibold text-white">WhatsApp</h2>
            <p className="mt-2 text-white/70">Chat with us directly for fast support.</p>
            <a href="https://wa.me/919182736329" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-white">
              Open WhatsApp
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
          <h2 className="text-2xl font-semibold text-white">Send a Message</h2>
          <div className="mt-6 space-y-4">
            {success && <p className="text-green-400">{success}</p>}
            {error && <p className="text-red-400">{error}</p>}
            <label className="block text-sm text-white/80">
              Name
              <input name="name" value={form.name} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" type="text" placeholder="Your Name" />
            </label>
            <label className="block text-sm text-white/80">
              Mobile Number
              <input name="phone" value={form.phone} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" type="tel" placeholder="Mobile Number" />
            </label>
            <label className="block text-sm text-white/80">
              Message
              <textarea name="message" value={form.message} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" rows="5" placeholder="Your message"></textarea>
            </label>
            <button disabled={loading} type="submit" className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50">
              {loading ? 'Sending…' : 'Submit Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
