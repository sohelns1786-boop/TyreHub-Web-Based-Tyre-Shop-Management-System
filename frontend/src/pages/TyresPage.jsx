import { useEffect, useState } from 'react';
import api from '../api/axios';
import { API_BASE_URL } from '../api/config';

const vehicleTypes = ['All', 'Bike', 'Car', 'Auto', 'Lorry'];

export default function TyresPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ vehicleType: 'All', brand: '', size: '', search: '', minPrice: '', maxPrice: '', sort: '' });

  const [selectedTyre, setSelectedTyre] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.vehicleType && filters.vehicleType !== 'All') params.vehicleType = filters.vehicleType;
      if (filters.brand) params.brand = filters.brand;
      if (filters.size) params.size = filters.size;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.search) params.search = filters.search;
      const res = await api.get('/products', { params });
      let data = res.data || [];
      if (filters.sort === 'price_asc') data = data.sort((a, b) => a.price - b.price);
      if (filters.sort === 'price_desc') data = data.sort((a, b) => b.price - a.price);
      setProducts(data);
    } catch (err) {
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const getWhatsAppLink = (tyre) => {
    const text = `Hi Rasheed Tyres Planet! I am enquiring about the tyre: *${tyre.name}* (Brand: *${tyre.brand}*, Size: *${tyre.size}*, Price: *₹${tyre.price}*). Please let me know its availability.`;
    return `https://wa.me/919182736329?text=${encodeURIComponent(text)}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Tyres Catalog</h1>
          <p className="mt-2 text-white/70">Browse tyres by vehicle type, brand, size, and stock availability.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full items-center gap-2 md:w-auto">
          <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search by name or brand" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary md:w-64" />
          <button type="submit" className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-white md:inline-block">Search</button>
        </form>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select name="vehicleType" value={filters.vehicleType} onChange={handleFilterChange} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
          {vehicleTypes.map((v) => (
            <option key={v} value={v} className="bg-[#111111]">{v}</option>
          ))}
        </select>
        <input name="brand" value={filters.brand} onChange={handleFilterChange} placeholder="Brand" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
        <input name="size" value={filters.size} onChange={handleFilterChange} placeholder="Size" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
        <input name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min Price" type="number" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
        <input name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max Price" type="number" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
        <select name="sort" value={filters.sort} onChange={handleFilterChange} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
          <option value="">Sort</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
        <button onClick={fetchProducts} className="ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">Apply</button>
      </div>

      {loading && <p className="text-white/75">Loading products…</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((tyre) => (
          <article 
            key={tyre._id} 
            onClick={() => setSelectedTyre(tyre)}
            className="group cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/10 hover:border-primary/40 transition duration-300 transform hover:-translate-y-1"
          >
            <div className="overflow-hidden relative h-52">
              <img
                src={
                  tyre.image
                    ? tyre.image.startsWith('/')
                      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                        ? tyre.image
                        : `${API_BASE_URL.replace(/\/api$/, '')}${tyre.image}`
                      : tyre.image
                    : 'https://via.placeholder.com/400x300?text=Tyre'
                }
                alt={tyre.name}
                className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-300" />
            </div>
            <div className="p-6">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">{tyre.brand}</span>
              <h2 className="text-xl font-bold text-white mt-1 group-hover:text-primary transition duration-300">{tyre.name}</h2>
              <div className="mt-3 space-y-1 text-sm text-white/70">
                <p>Size: <span className="text-white font-medium">{tyre.size}</span></p>
                <p>Vehicle: <span className="text-white font-medium">{tyre.vehicleType}</span></p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-xl font-extrabold text-primary">₹{tyre.price}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tyre.stock > 5 ? 'bg-green-500/15 text-green-300 border border-green-500/20' : tyre.stock > 0 ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20' : 'bg-red-500/15 text-red-300 border border-red-500/20'}`}>
                  {tyre.stock > 5 ? 'In Stock' : tyre.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Quick View Details Modal */}
      {selectedTyre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
          <div className="relative max-w-3xl w-full rounded-3xl border border-white/10 bg-[#151515] p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedTyre(null)} 
              className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl font-bold transition duration-300 focus:outline-none"
              aria-label="Close details modal"
            >
              &times;
            </button>

            <div className="grid gap-8 md:grid-cols-2 mt-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 h-72 sm:h-96">
                <img 
                  src={
                    selectedTyre.image
                      ? selectedTyre.image.startsWith('/')
                        ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                          ? selectedTyre.image
                          : `${API_BASE_URL.replace(/\/api$/, '')}${selectedTyre.image}`
                        : selectedTyre.image
                      : 'https://via.placeholder.com/500x500?text=Tyre'
                  } 
                  alt={selectedTyre.name} 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-sm font-semibold tracking-widest text-primary uppercase">{selectedTyre.brand}</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{selectedTyre.name}</h2>
                  
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-2xl font-black text-primary">₹{selectedTyre.price}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${selectedTyre.stock > 5 ? 'bg-green-500/15 text-green-300 border border-green-500/20' : selectedTyre.stock > 0 ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20' : 'bg-red-500/15 text-red-300 border border-red-500/20'}`}>
                      {selectedTyre.stock > 5 ? 'In Stock' : selectedTyre.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <hr className="my-5 border-white/10" />

                  <div className="space-y-3 text-white/80">
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-white/50 text-sm">Size:</span>
                      <span className="font-semibold">{selectedTyre.size}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-white/50 text-sm">Vehicle:</span>
                      <span className="font-semibold">{selectedTyre.vehicleType}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-white/50 text-sm">Category:</span>
                      <span className="font-semibold">{selectedTyre.category}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-white/50 text-sm block mb-1">Description:</span>
                      <p className="text-sm leading-relaxed text-white/70">{selectedTyre.description || 'Premium performance tyre built with advanced rubber compound for enhanced mileage, dry/wet grip, and long-term durability.'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <a 
                    href={getWhatsAppLink(selectedTyre)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-green-600 px-6 py-4 text-center font-bold text-white transition hover:bg-green-500 focus:ring-4 focus:ring-green-600/30"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.022-.08-.5-2.036-1.502-2.518-.34-.162-.64-.207-.886-.062-.224.132-.472.548-.722.842-.27.316-.54.348-.82.174-.29-.174-1.228-.452-2.338-1.444-.86-.77-1.44-1.722-1.608-2.012-.17-.29-.018-.448.13-.594.13-.13.29-.34.436-.508.146-.17.194-.286.29-.478.096-.194.048-.362-.024-.508-.072-.146-.6-1.44-.82-1.97-.22-.53-.44-.457-.6-.465-.162-.008-.346-.01-.53-.01-.18 0-.472.067-.72.338-.246.27-.94.918-.94 2.24 0 1.32.96 2.6 1.09 2.77.13.17 1.884 2.876 4.566 4.032.637.276 1.135.44 1.52.562.64.204 1.22.175 1.68.106.513-.077 1.502-.615 1.713-1.21.21-.595.21-1.104.148-1.21zm-5.448 8.042c-2.383 0-4.636-.623-6.595-1.72L1 23l2.355-6.177c-1.22-1.99-1.925-4.333-1.925-6.823 0-7.168 5.832-13 13-13 7.167 0 13 5.832 13 13 0 7.168-5.833 13-13 13z"/>
                    </svg>
                    Enquire on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
