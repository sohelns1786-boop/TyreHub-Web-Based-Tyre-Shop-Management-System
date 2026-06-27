import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { registerWithEmail } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(form.email, form.password, form.name);
      addToast('Registration successful! Please check your inbox for a verification email.', 'success', 6000);
      navigate('/login');
    } catch (err) {
      addToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
        <h1 className="text-3xl font-semibold text-white">
          Create <span className="text-primary font-black">Account</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">Register to view tyre stock details and submit contact enquiries.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-white/80">
            Full Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              type="text"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary"
              placeholder="e.g. John Doe"
            />
          </label>
          <label className="block text-sm text-white/80">
            Email
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              type="email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary"
              placeholder="e.g. user@gmail.com"
            />
          </label>
          <label className="block text-sm text-white/80">
            Password
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              type="password"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary"
              placeholder="Min 6 characters"
            />
          </label>
          <label className="block text-sm text-white/80">
            Confirm Password
            <input
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              type="password"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary"
              placeholder="Repeat password"
            />
          </label>
          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50"
          >
            {loading ? 'Creating Account…' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </section>
  );
}
