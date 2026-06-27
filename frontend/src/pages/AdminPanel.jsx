import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { API_BASE_URL } from '../api/config';
import SalesTab from '../components/SalesTab';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/150x150/151515/FACC15?text=No+Photo';
  if (imagePath.startsWith('/')) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return imagePath;
    }
    return `${API_BASE_URL.replace(/\/api$/, '')}${imagePath}`;
  }
  return imagePath;
};

const getStockBadgeClass = (stock) => {
  if (stock === 0) return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (stock <= 5) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard & global stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  
  // Enquiries state
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState(null);
  
  // Inventory Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Enquiries Filter state
  const [enquiryFilter, setEnquiryFilter] = useState('pending'); // pending, resolved, all

  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  // Load all dashboard, inventory and enquiry stats
  const fetchStats = async () => {
    const token = localStorage.getItem('tyrehub_token');
    if (!token) {
      setStatsError('Authentication token is missing. Please sign in.');
      return;
    }
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Stats loading failed', err);
      setStatsError(err?.response?.data?.message || 'Unable to load dashboard stats.');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem('tyrehub_token');
    if (!token) {
      setProductsError('Authentication token is missing. Please sign in.');
      return;
    }
    setProductsLoading(true);
    setProductsError(null);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setProductsError(err?.response?.data?.message || 'Unable to load products.');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchEnquiries = async () => {
    const token = localStorage.getItem('tyrehub_token');
    if (!token) {
      setEnquiriesError('Authentication token is missing. Please sign in.');
      return;
    }
    setEnquiriesLoading(true);
    setEnquiriesError(null);
    try {
      const response = await api.get('/enquiries');
      setEnquiries(response.data);
    } catch (err) {
      setEnquiriesError(err?.response?.data?.message || 'Unable to load client enquiries.');
    } finally {
      setEnquiriesLoading(false);
    }
  };

  const loadAllData = async () => {
    const token = localStorage.getItem('tyrehub_token');
    if (!token) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    await Promise.all([fetchStats(), fetchProducts(), fetchEnquiries()]);
    setActionLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleStockAdjustment = async (id, adjustment) => {
    setActionError(null);
    try {
      await api.patch(`/products/${id}/stock`, { adjustment });
      // Refresh backend datasets
      await Promise.all([fetchStats(), fetchProducts()]);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Unable to update stock level.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this tyre permanently?')) return;
    setActionError(null);
    try {
      await api.delete(`/products/${id}`);
      await loadAllData();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Unable to delete product.');
    }
  };

  const handleResolveEnquiry = async (id) => {
    setActionError(null);
    try {
      await api.put(`/enquiries/${id}/resolve`, {});
      await Promise.all([fetchStats(), fetchEnquiries()]);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Unable to resolve enquiry.');
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Delete this customer request permanently?')) return;
    setActionError(null);
    try {
      await api.delete(`/enquiries/${id}`);
      await Promise.all([fetchStats(), fetchEnquiries()]);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Unable to delete enquiry.');
    }
  };

  // Filter products based on search term, category and brand selection
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.size.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'All' || product.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  // Filter enquiries based on selected tab filter
  const filteredEnquiries = enquiries.filter((enquiry) => {
    if (enquiryFilter === 'pending') return !enquiry.resolved;
    if (enquiryFilter === 'resolved') return enquiry.resolved;
    return true;
  });

  // Collect unique brands and categories for filtering
  const brands = ['All', ...new Set(products.map(p => p.brand))];
  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full shrink-0 lg:w-64">
        <nav className="flex flex-row gap-2 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-md lg:flex-col">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 lg:flex-initial lg:justify-start ${
              activeTab === 'dashboard'
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 lg:flex-initial lg:justify-start ${
              activeTab === 'inventory'
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="hidden sm:inline">Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 lg:flex-initial lg:justify-start ${
              activeTab === 'enquiries'
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span className="hidden sm:inline">Enquiries</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 lg:flex-initial lg:justify-start ${
              activeTab === 'sales'
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Sales History</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 space-y-6">
        {actionError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {actionError}
          </div>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Loading Placeholder */}
            {statsLoading && !stats && (
              <p className="text-sm text-white/50 animate-pulse">Loading dashboard overview statistics…</p>
            )}
            {statsError && (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{statsError}</p>
                <button
                  onClick={fetchStats}
                  className="rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {/* Metrics cards */}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/45">Total Products</span>
                    <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-white">{stats.totalProducts}</p>
                </div>

                <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/45">Categories</span>
                    <span className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-white">{stats.totalCategories}</p>
                </div>

                <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/45">Enquiries</span>
                    <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-white">{stats.totalEnquiries}</p>
                </div>

                <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/45">Low/Out of Stock</span>
                    <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-white">
                    {stats.lowStockProducts.length + stats.outOfStockProducts.length}
                  </p>
                </div>
              </div>
            )}

            {/* Split Screen alert boxes */}
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Critical Alerts: Low & Out of Stock */}
              <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl backdrop-blur-md">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Critical Stock Alerts</h3>
                  <p className="text-xs text-white/50 mt-1">Directly replenish products with low or missing inventory.</p>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {stats && [...stats.outOfStockProducts, ...stats.lowStockProducts].length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-sm text-white/40">
                      👍 All tyres are adequately stocked!
                    </div>
                  ) : (
                    stats && [...stats.outOfStockProducts, ...stats.lowStockProducts].map((tyre) => (
                      <div key={tyre._id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(tyre.image)}
                            alt={tyre.name}
                            loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/151515/FACC15?text=No+Photo'; }}
                            className="h-10 w-10 rounded-xl object-contain border border-white/10 bg-white/5"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{tyre.name}</h4>
                            <p className="text-[10px] text-white/50">{tyre.brand} • {tyre.size}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tyre.stock === 0 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {tyre.stock} left
                          </span>
                          <button
                            onClick={() => handleStockAdjustment(tyre._id, 5)}
                            className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10px] font-extrabold text-white transition duration-200 hover:bg-primary hover:text-black hover:border-primary"
                          >
                            +5 Stock
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Unresolved Enquiries */}
              <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl backdrop-blur-md">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Recent Active Enquiries</h3>
                  <p className="text-xs text-white/50 mt-1">Latest customer callback requests that require feedback.</p>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {stats && stats.recentEnquiries.filter(e => !e.resolved).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-sm text-white/40">
                      🎉 No pending customer enquiries!
                    </div>
                  ) : (
                    stats && stats.recentEnquiries.filter(e => !e.resolved).slice(0, 3).map((enquiry) => (
                      <div key={enquiry._id} className="rounded-2xl border border-primary/10 bg-primary/5 p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-bold text-white">{enquiry.name}</h4>
                            <p className="text-xs text-primary font-bold">
                              <a href={`tel:${enquiry.phone}`} className="hover:underline">📞 {enquiry.phone}</a>
                            </p>
                          </div>
                          <button
                            onClick={() => handleResolveEnquiry(enquiry._id)}
                            className="rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold text-black hover:bg-white transition"
                          >
                            Resolve
                          </button>
                        </div>
                        <p className="text-xs text-white/70 italic bg-black/30 rounded-lg p-2 border border-white/5 leading-snug">
                          "{enquiry.message}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              {/* Search and Filters */}
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-white/40">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, brand, size..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:border-primary focus:bg-black/60 transition"
                  />
                </div>

                {/* Brand Selector */}
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-primary transition"
                >
                  <option value="All" className="bg-[#111111]">All Brands</option>
                  {brands.filter(b => b !== 'All').map((brand) => (
                    <option key={brand} value={brand} className="bg-[#111111]">{brand}</option>
                  ))}
                </select>

                {/* Category Selector */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-primary transition"
                >
                  <option value="All" className="bg-[#111111]">All Categories</option>
                  {categories.filter(c => c !== 'All').map((cat) => (
                    <option key={cat} value={cat} className="bg-[#111111]">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate('/admin/product/new')}
                className="rounded-full bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white hover:shadow-lg self-end sm:self-auto"
              >
                Add New Tyre
              </button>
            </div>

            {/* Products catalog list */}
            {productsLoading && <p className="text-sm text-white/50">Loading products catalog…</p>}
            {productsError && (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{productsError}</p>
                <button
                  onClick={fetchProducts}
                  className="rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {!productsLoading && !productsError && (
              <div className="rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-xl backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/50">
                        <th className="px-6 py-4">Tyre Photo</th>
                        <th className="px-6 py-4">Product Details</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4">Stock Control</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-sm text-white/45">
                            No tyres found matching the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <tr key={product._id} className="hover:bg-white/5 transition duration-200">
                            {/* Photo */}
                            <td className="px-6 py-3.5">
                              <img
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                loading="lazy"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/151515/FACC15?text=No+Photo'; }}
                                className="h-12 w-12 rounded-xl object-contain border border-white/10 shadow-md bg-white/5 p-1"
                              />
                            </td>

                            {/* Details */}
                            <td className="px-6 py-3.5">
                              <h4 className="text-sm font-bold text-white leading-tight">{product.name}</h4>
                              <p className="text-[11px] text-white/50 mt-0.5">
                                Brand: <span className="text-white/70">{product.brand}</span> • Size: <span className="text-white/70">{product.size}</span>
                              </p>
                            </td>

                            {/* Category */}
                            <td className="px-6 py-3.5 text-xs text-white/70">
                              {product.category}
                            </td>

                            {/* Price */}
                            <td className="px-6 py-3.5 text-sm font-extrabold text-primary">
                              ₹{product.price}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-3.5 text-center">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getStockBadgeClass(product.stock)}`}>
                                {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>

                            {/* Stock Control */}
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleStockAdjustment(product._id, -1)}
                                  disabled={product.stock === 0}
                                  className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white transition hover:bg-white/10 disabled:opacity-30"
                                >
                                  -1
                                </button>
                                <span className="w-8 text-center text-xs font-bold font-mono text-white">
                                  {product.stock}
                                </span>
                                <button
                                  onClick={() => handleStockAdjustment(product._id, 1)}
                                  className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white transition hover:bg-white/10"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => handleStockAdjustment(product._id, 5)}
                                  className="ml-1 rounded bg-white/10 border border-white/15 px-2 py-0.5 text-[10px] font-extrabold text-white transition hover:bg-primary hover:text-black"
                                >
                                  +5
                                </button>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => navigate(`/admin/product/${product._id}/edit`)}
                                  className="text-white/60 hover:text-primary transition"
                                  title="Edit tyre details"
                                >
                                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="text-white/40 hover:text-red-500 transition"
                                  title="Delete product"
                                >
                                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. ENQUIRIES TAB */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 p-2 shadow-md max-w-sm">
              <button
                onClick={() => setEnquiryFilter('pending')}
                className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  enquiryFilter === 'pending'
                    ? 'bg-primary text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setEnquiryFilter('resolved')}
                className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  enquiryFilter === 'resolved'
                    ? 'bg-primary text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setEnquiryFilter('all')}
                className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  enquiryFilter === 'all'
                    ? 'bg-primary text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                All
              </button>
            </div>

            {enquiriesLoading && <p className="text-sm text-white/50">Loading customer requests…</p>}
            {enquiriesError && (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{enquiriesError}</p>
                <button
                  onClick={fetchEnquiries}
                  className="rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {!enquiriesLoading && !enquiriesError && (
              <div className="space-y-4">
                {filteredEnquiries.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-black/50 py-16 text-center text-white/50 backdrop-blur-md">
                    No enquiries found in this category.
                  </div>
                ) : (
                  filteredEnquiries.map((enquiry) => (
                    <div
                      key={enquiry._id}
                      className={`rounded-3xl border p-6 shadow-xl backdrop-blur-md transition-all duration-300 ${
                        enquiry.resolved
                          ? 'border-white/5 bg-white/5 opacity-60'
                          : 'border-primary/20 bg-primary/5'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{enquiry.name}</h3>
                            {enquiry.resolved ? (
                              <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                Resolved
                              </span>
                            ) : (
                              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                Active Callback
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-white/50">
                            Requested callback: <span className="text-white font-mono">{enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString() : 'N/A'}</span>
                          </p>
                        </div>

                        {/* Direct Call & Action Buttons */}
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${enquiry.phone}`}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 hover:bg-[#111111] px-4 py-2 text-xs font-bold text-white transition"
                          >
                            <span>📞 Call Now</span>
                            <span className="font-mono text-primary font-bold">{enquiry.phone}</span>
                          </a>

                          {!enquiry.resolved && (
                            <button
                              onClick={() => handleResolveEnquiry(enquiry._id)}
                              className="rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white"
                            >
                              Resolve
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteEnquiry(enquiry._id)}
                            className="rounded-full border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 transition"
                            title="Delete record"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Message body */}
                      <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 py-1.5 italic text-sm text-white/80 bg-black/30 rounded-r-xl pr-3">
                        "{enquiry.message}"
                      </blockquote>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. SALES HISTORY TAB */}
        {activeTab === 'sales' && (
          <SalesTab products={products} onSaleModified={loadAllData} />
        )}
      </main>
    </div>
  );
}
