import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import TyresPage from './pages/TyresPage';
import ContactPage from './pages/ContactPage';
import CategoryPage from './pages/CategoryPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProductFormPage from './pages/ProductFormPage';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/tyres" element={<TyresPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/category/:vehicleType" element={<CategoryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/product/new" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
        <Route path="/admin/product/:id/edit" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
