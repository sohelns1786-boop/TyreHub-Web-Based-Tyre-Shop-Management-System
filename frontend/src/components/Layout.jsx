import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Tyres', to: '/tyres' },
  { label: 'Contact', to: '/contact' },
];

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      try {
        const u = JSON.parse(localStorage.getItem('tyrehub_user') || 'null');
        setUser(u);
      } catch {
        setUser(null);
      }
    };
    checkUser();

    window.addEventListener('storage', checkUser);
    window.addEventListener('auth-change', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('auth-change', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tyrehub_token');
    localStorage.removeItem('tyrehub_user');
    setUser(null);
    setIsMobileOpen(false);
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="text-xl font-bold uppercase tracking-[0.2em] text-white hover:text-primary transition duration-300">
            TyreHub
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-medium tracking-wider uppercase transition hover:text-primary">
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium tracking-wider uppercase transition text-primary hover:text-white border border-primary/20 bg-primary/10 rounded-full px-3 py-1">
                    Admin
                  </Link>
                )}
                <span className="flex items-center gap-2 text-sm font-medium text-white/80 bg-white/5 rounded-full px-3 py-1 border border-white/5">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  {user.name}
                </span>
                <button type="button" onClick={handleLogout} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-primary hover:text-primary">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium tracking-wider uppercase transition hover:text-primary">
                Login
              </Link>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <button 
            type="button" 
            onClick={() => setIsMobileOpen(!isMobileOpen)} 
            className="block md:hidden text-white hover:text-primary focus:outline-none transition duration-300"
            aria-label="Toggle Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 flex flex-col justify-center items-center gap-8 md:hidden">
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="absolute top-6 right-6 text-white text-3xl hover:text-primary transition duration-300"
            aria-label="Close Menu"
          >
            &times;
          </button>
          {navLinks.map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              onClick={() => setIsMobileOpen(false)} 
              className="text-2xl font-bold uppercase tracking-widest text-white hover:text-primary transition duration-300"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMobileOpen(false)} 
                  className="text-2xl font-bold uppercase tracking-widest text-primary hover:text-white transition duration-300"
                >
                  Admin Panel
                </Link>
              )}
              <div className="flex items-center gap-3 text-lg font-semibold text-white/90 bg-white/5 border border-white/10 px-5 py-2 rounded-full">
                <span className="h-3.5 w-3.5 rounded-full bg-green-500 animate-pulse"></span>
                {user.name}
              </div>
              <button 
                type="button" 
                onClick={handleLogout} 
                className="rounded-full border border-white/20 px-8 py-3 text-lg text-white hover:border-primary hover:text-primary transition duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              onClick={() => setIsMobileOpen(false)} 
              className="text-2xl font-bold uppercase tracking-widest text-white hover:text-primary transition duration-300"
            >
              Login
            </Link>
          )}
        </div>
      )}

      <main>{children}</main>
      <Footer />
    </div>
  );
}
