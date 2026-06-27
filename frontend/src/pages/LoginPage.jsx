import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, resetPassword, hasFirebaseConfig } = useAuth();
  const { addToast } = useToast();

  const queryParams = new URLSearchParams(window.location.search);
  const isExpired = queryParams.get('expired') === 'true';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!hasFirebaseConfig) {
        // Fallback for development if Firebase is not configured
        const api = (await import('../api/axios')).default;
        const response = await api.post('/auth/login', form);
        const { token, user } = response.data;
        const { saveAdminSession } = await import('../utils/auth');
        saveAdminSession(user, token);
        window.dispatchEvent(new Event('auth-change'));
        addToast('Sign in successful! (Mock Mode)', 'success');
        navigate(user.role === 'admin' ? '/admin' : '/');
        return;
      }
      
      const backendUser = await loginWithEmail(form.email, form.password);
      addToast('Sign in successful!', 'success');
      navigate(backendUser.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      addToast(err?.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!hasFirebaseConfig) {
      setShowMockModal(true);
      return;
    }

    setGoogleLoading(true);
    try {
      const backendUser = await loginWithGoogle();
      addToast('Google Sign-In successful!', 'success');
      navigate(backendUser.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      addToast(err?.message || 'Google sign-in failed. Please try again.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMockSignIn = async (email, name) => {
    setGoogleLoading(true);
    setShowMockModal(false);
    try {
      const { googleLogin } = await import('../api/auth');
      const responseData = await googleLogin(email, name);
      const { token, user: backendUser } = responseData;
      const { saveGoogleSession } = await import('../utils/auth');
      saveGoogleSession(backendUser, token);
      
      window.dispatchEvent(new Event('auth-change'));
      addToast(`Mock Signed In as ${backendUser.name}`, 'success');
      navigate(backendUser.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Mock Google login failed.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      addToast('Please enter your email address in the Email field first.', 'warning');
      return;
    }
    if (!hasFirebaseConfig) {
      addToast('Password reset is not available in mock mode.', 'error');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(form.email);
      addToast('Password reset link sent to your email inbox.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to send password reset email.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
        <h1 className="text-3xl font-semibold text-white">Login / Admin Portal</h1>
        {isExpired && (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-400">
            ⚠️ Your session has expired or is invalid. Please sign in again.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-white/80">
            Email
            <input name="email" value={form.email} onChange={handleChange} required type="email" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </label>
          <label className="block text-sm text-white/80">
            Password
            <input name="password" value={form.password} onChange={handleChange} required={hasFirebaseConfig} type="password" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-xs text-primary hover:underline font-semibold"
            >
              {resetLoading ? 'Sending reset email...' : 'Forgot Password?'}
            </button>
          </div>
          <button disabled={loading} type="submit" className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/70">Or continue with Google</p>
          <button onClick={handleGoogleSignIn} disabled={googleLoading} className="mt-4 inline-flex items-center justify-center gap-2 w-full rounded-full border border-white/10 bg-black/80 px-5 py-3 text-sm font-semibold text-white transition hover:border-primary hover:text-primary disabled:opacity-50">
            {googleLoading ? 'Loading…' : 'Continue with Google'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-white/70">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>

      {/* Mock Google Account Chooser Modal */}
      {showMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#161616] p-8 shadow-2xl shadow-black animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setShowMockModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition duration-200 text-xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
            
            {/* Google Logo Icon */}
            <div className="flex justify-center mb-4">
              <svg className="h-10 w-10" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.053h3.837c2.25-2.07 3.708-5.12 3.708-8.59z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.837-3.053c-1.08.72-2.45 1.16-4.093 1.16-3.15 0-5.81-2.13-6.76-5.01H1.326v3.13C3.306 21.17 7.39 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.19c-.25-.72-.39-1.49-.39-2.28s.14-1.56.39-2.28V6.5H1.326C.48 8.19 0 10.04 0 12s.48 3.81 1.326 5.5l3.914-3.31z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.39 0 3.306 2.83 1.326 6.5l3.914 3.31c.95-2.88 3.61-5.06 6.76-5.06z"
                />
              </svg>
            </div>

            <h2 className="text-center text-xl font-bold text-white tracking-wide">Sign in with Google</h2>
            <p className="mt-2 text-center text-sm text-white/60">Choose a mock Google account to continue to TyreHub</p>

            <div className="mt-6 space-y-3">
              {/* Account 1 - User */}
              <button
                onClick={() => handleMockSignIn('sohel@gmail.com', 'Sohel Mahiniyaz')}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition hover:bg-white/10 hover:border-primary/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                  SM
                </div>
                <div>
                  <div className="font-semibold text-white">Sohel Mahiniyaz</div>
                  <div className="text-xs text-white/55">sohel@gmail.com</div>
                </div>
                <span className="ml-auto rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white/60 uppercase">
                  User
                </span>
              </button>

              {/* Account 2 - Admin */}
              <button
                onClick={() => handleMockSignIn('admin@tyrehub.com', 'Admin TyreHub')}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition hover:bg-white/10 hover:border-primary/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold">
                  AT
                </div>
                <div>
                  <div className="font-semibold text-white">Admin TyreHub</div>
                  <div className="text-xs text-white/55">admin@tyrehub.com</div>
                </div>
                <span className="ml-auto rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400 uppercase">
                  Admin
                </span>
              </button>
            </div>

            {/* Custom Account Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-[#161616] px-3 text-xs text-white/40 uppercase">Or use custom</span>
            </div>

            {/* Custom Account Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('customEmail');
                const name = formData.get('customName');
                handleMockSignIn(email, name);
              }}
              className="space-y-3"
            >
              <input
                required
                name="customName"
                placeholder="Full Name"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
              />
              <input
                required
                type="email"
                name="customEmail"
                placeholder="Google Email Address"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#e10600]"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-black transition hover:bg-white"
              >
                Sign In with Custom Email
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
