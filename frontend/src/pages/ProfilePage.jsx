import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function ProfilePage() {
  const { user, refreshUser, hasFirebaseConfig } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    profilePhoto: user?.profilePhoto || '',
  });
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-white/70">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (hasFirebaseConfig && auth.currentUser) {
        // Update profile in Firebase
        await updateProfile(auth.currentUser, {
          displayName: form.name,
          photoURL: form.profilePhoto,
        });
        // Sync the updated profile info to MongoDB
        await refreshUser();
      } else {
        // Mock DB sync fallback
        const mockUser = { ...user, name: form.name, profilePhoto: form.profilePhoto };
        localStorage.setItem('tyrehub_user', JSON.stringify(mockUser));
        window.dispatchEvent(new Event('auth-change'));
      }
      addToast('Profile updated and synchronized successfully!', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1 rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col items-center text-center shadow-xl shadow-black/10">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-primary/40 bg-zinc-800 flex items-center justify-center">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-extrabold text-primary bg-primary/10">
                {user.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">{user.name}</h2>
          <span className="mt-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider animate-pulse">
            {user.role}
          </span>
          <p className="mt-2 text-sm text-white/50 break-all">{user.email}</p>

          <hr className="my-5 w-full border-white/10" />

          <div className="w-full text-left space-y-2 text-xs text-white/60">
            <p>UID: <span className="font-mono text-white/80">{user.uid || 'N/A'}</span></p>
            <p>Last Login: <span className="text-white/80">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span></p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
          <h1 className="text-2xl font-semibold text-white">
            Manage <span className="text-primary font-black">Profile</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">Update your user account display details and avatar.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm text-white/80">
              Display Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                type="text"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary"
                placeholder="Full Name"
              />
            </label>
            <label className="block text-sm text-white/80">
              Avatar Image URL
              <input
                name="profilePhoto"
                value={form.profilePhoto}
                onChange={handleChange}
                type="url"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary"
                placeholder="https://example.com/avatar.jpg"
              />
            </label>

            <button
              disabled={saving}
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50"
            >
              {saving ? 'Saving changes…' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
