import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { API_BASE_URL } from '../api/config';

const initialState = {
  name: '',
  brand: '',
  category: '',
  vehicleType: 'Bike',
  size: '',
  price: '',
  stock: '',
  description: '',
  image: '',
  imageFile: null,
  imagePreview: '',
};

export default function ProductFormPage() {
  const [product, setProduct] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct({
          ...response.data,
          price: response.data.price,
          stock: response.data.stock,
          image: response.data.image || '',
          imageFile: null,
          imagePreview: response.data.image || '',
        });
      } catch (err) {
        setError('Unable to load product');
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProduct((prev) => ({
      ...prev,
      imageFile: file || null,
      imagePreview: file ? URL.createObjectURL(file) : prev.imagePreview,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('brand', product.brand);
      formData.append('category', product.category);
      formData.append('vehicleType', product.vehicleType);
      formData.append('size', product.size);
      formData.append('price', product.price);
      formData.append('stock', product.stock);
      formData.append('description', product.description);
      if (product.imageFile) {
        formData.append('image', product.imageFile);
      } else if (product.image) {
        formData.append('image', product.image);
      }

      if (id) {
        await api.put(`/products/${id}`, formData);
        setSuccess('Product updated successfully');
      } else {
        await api.post('/products', formData);
        setSuccess('Product created successfully');
      }

      navigate('/admin');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save product');
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = product.imagePreview
    ? product.imagePreview.startsWith('/')
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? product.imagePreview
        : `${API_BASE_URL.replace(/\/api$/, '')}${product.imagePreview}`
      : product.imagePreview
    : '';

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
        <h1 className="text-3xl font-semibold text-white">{id ? 'Edit Product' : 'Add Product'}</h1>
        {error && <p className="mt-4 text-red-400">{error}</p>}
        {success && <p className="mt-4 text-green-400">{success}</p>}
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <input name="name" value={product.name} onChange={handleChange} required placeholder="Product Name" className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          <select name="brand" value={product.brand} onChange={handleChange} required className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary">
            <option value="" disabled>Select Brand</option>
            <option value="MRF">MRF</option>
            <option value="CEAT">CEAT</option>
            <option value="Apollo Tyres">Apollo Tyres</option>
            <option value="JK Tyre">JK Tyre</option>
            <option value="Bridgestone">Bridgestone</option>
          </select>
          <select name="category" value={product.category} onChange={handleChange} required className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary">
            <option value="" disabled>Select Category</option>
            <option value="Bike Tyres">Bike Tyres</option>
            <option value="Car Tyres">Car Tyres</option>
            <option value="Auto Tyres">Auto Tyres</option>
            <option value="Lorry Tyres">Lorry Tyres</option>
          </select>
          <select name="vehicleType" value={product.vehicleType} onChange={handleChange} className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary">
            <option value="Bike">Bike</option>
            <option value="Car">Car</option>
            <option value="Auto">Auto</option>
            <option value="Lorry">Lorry</option>
          </select>
          <input name="size" value={product.size} onChange={handleChange} required placeholder="Size" className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          <input name="price" value={product.price} onChange={handleChange} required type="number" placeholder="Price" className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          <input name="stock" value={product.stock} onChange={handleChange} required type="number" placeholder="Stock" className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          <textarea name="description" value={product.description} onChange={handleChange} rows="4" placeholder="Description" className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          <input name="image" value={product.image} onChange={handleChange} placeholder="Image URL" className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          <div>
            <label className="mb-2 block text-sm text-white/80" htmlFor="imageFile">Upload Image</label>
            <input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-white/80 file:cursor-pointer file:rounded-full file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-white" />
          </div>
          {previewUrl && (
            <div className="rounded-3xl border border-white/10 bg-black/80 p-4">
              <p className="text-sm text-white/70">Image preview</p>
              <img src={previewUrl} alt="Product preview" className="mt-4 h-64 w-full rounded-2xl object-cover" />
            </div>
          )}
          <button disabled={loading} type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50">
            {loading ? 'Saving…' : id ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </div>
    </section>
  );
}
