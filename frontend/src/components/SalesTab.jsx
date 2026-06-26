import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SalesTab({ products, onSaleModified }) {
  // Sales List & Stats State
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Chart Toggle State
  const [chartInterval, setChartInterval] = useState('daily'); // daily, weekly, monthly, yearly
  const [chartType, setChartType] = useState('line'); // line, bar

  // Modals & Action States
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  const [selectedSale, setSelectedSale] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Record Sale Form state
  const [recordForm, setRecordForm] = useState({
    productId: '',
    customerName: '',
    customerPhone: '',
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'Cash',
    status: 'Completed'
  });

  // Edit Sale Form state
  const [editForm, setEditForm] = useState({
    id: '',
    customerName: '',
    customerPhone: '',
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'Cash',
    status: 'Completed'
  });

  // Unique list of categories and brands from existing products for filtering
  const uniqueBrands = ['All', ...new Set(products.map(p => p.brand))];
  const uniqueCategories = ['All', ...new Set(products.map(p => p.category))];

  // Fetch Sales and Stats
  const fetchSalesAndStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch sales list with pagination & current filters
      const listParams = {
        page: currentPage,
        limit,
        search: search || undefined,
        brand: brandFilter !== 'All' ? brandFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        paymentMethod: paymentFilter !== 'All' ? paymentFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const listResponse = await api.get('/sales', { params: listParams });
      setSales(listResponse.data.sales);
      setTotalPages(listResponse.data.totalPages);
      setTotalCount(listResponse.data.totalCount);

      // 2. Fetch aggregation stats for cards & charts
      const statsResponse = await api.get('/sales/stats');
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to load sales data', err);
      setError(err?.response?.data?.message || 'Failed to load sales history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndStats();
  }, [currentPage, brandFilter, categoryFilter, paymentFilter, statusFilter, startDate, endDate]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSalesAndStats();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setBrandFilter('All');
    setCategoryFilter('All');
    setPaymentFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Record Sale Form calculations
  useEffect(() => {
    if (recordForm.productId) {
      const selectedProduct = products.find(p => p._id === recordForm.productId);
      if (selectedProduct) {
        setRecordForm(prev => ({
          ...prev,
          unitPrice: selectedProduct.price
        }));
      }
    }
  }, [recordForm.productId]);

  // Handle Record Sale Submission
  const handleRecordSale = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Validate stock locally first to avoid unnecessary server hit
    if (recordForm.status === 'Completed') {
      const product = products.find(p => p._id === recordForm.productId);
      if (product && product.stock < recordForm.quantity) {
        setFormError(`Only ${product.stock} items left in stock for ${product.name}. Cannot record sale.`);
        setFormLoading(false);
        return;
      }
    }

    try {
      await api.post('/sales', recordForm);
      setShowRecordModal(false);
      // Reset form
      setRecordForm({
        productId: '',
        customerName: '',
        customerPhone: '',
        quantity: 1,
        unitPrice: 0,
        paymentMethod: 'Cash',
        status: 'Completed'
      });
      // Refresh parent (inventory stock counts) and local sales data
      if (onSaleModified) onSaleModified();
      fetchSalesAndStats();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to record sale.');
    } finally {
      setFormLoading(false);
    }
  };

  // Populate Edit Modal
  const openEditModal = (sale) => {
    setSelectedSale(sale);
    setEditForm({
      id: sale._id,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      paymentMethod: sale.paymentMethod,
      status: sale.status
    });
    setFormError(null);
    setShowEditModal(true);
  };

  // Handle Edit Submission
  const handleEditSale = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await api.put(`/sales/${editForm.id}`, editForm);
      setShowEditModal(false);
      if (onSaleModified) onSaleModified();
      fetchSalesAndStats();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to update sale.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete Sale
  const handleDeleteSale = async (id, invoiceNumber) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoiceNumber} permanently? This will restore the stock if it was Completed.`)) {
      return;
    }

    try {
      await api.delete(`/sales/${id}`);
      if (onSaleModified) onSaleModified();
      fetchSalesAndStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete sale.');
    }
  };

  // Trigger Print for specific invoice
  const handlePrintInvoice = (sale) => {
    setSelectedSale(sale);
    setShowInvoiceModal(true);
    // Let modal render, then trigger print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      // Fetch all matching records without pagination for a full report
      const params = {
        limit: 10000, // Large number to get all records
        search: search || undefined,
        brand: brandFilter !== 'All' ? brandFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        paymentMethod: paymentFilter !== 'All' ? paymentFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      
      const response = await api.get('/sales', { params });
      const exportSales = response.data.sales;

      if (!exportSales || exportSales.length === 0) {
        alert('No sales records found to export.');
        return;
      }

      const headers = [
        'Invoice Number', 'Sale Date', 'Customer Name', 'Customer Phone',
        'Product Name', 'Brand', 'Category', 'Tyre Size',
        'Quantity Sold', 'Unit Price (INR)', 'Total Amount (INR)', 'Payment Method',
        'Salesperson', 'Status'
      ];

      const csvRows = [headers.join(',')];

      exportSales.forEach(s => {
        const row = [
          s.invoiceNumber,
          new Date(s.createdAt).toLocaleString(),
          `"${s.customerName.replace(/"/g, '""')}"`,
          s.customerPhone,
          `"${s.productName.replace(/"/g, '""')}"`,
          s.brand,
          s.category,
          s.size,
          s.quantity,
          s.unitPrice,
          s.totalAmount,
          s.paymentMethod,
          `"${s.salesperson.replace(/"/g, '""')}"`,
          s.status
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `TyreHub_Sales_History_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV Export failed', err);
      alert('CSV Export failed.');
    }
  };

  // Get status color CSS classes
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Refunded':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-white/10 text-white/70 border border-white/5';
    }
  };

  // Chart configuration
  const currentChartData = stats?.charts?.[chartInterval] || [];
  const chartLabels = currentChartData.map(item => item.label);
  const revenueData = currentChartData.map(item => item.revenue);
  const quantityData = currentChartData.map(item => item.quantity);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: revenueData,
        borderColor: '#E10600',
        backgroundColor: 'rgba(225, 6, 0, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: chartType === 'line',
        yAxisID: 'y',
      },
      {
        label: 'Tyres Sold',
        data: quantityData,
        borderColor: '#3b82f6',
        backgroundColor: chartType === 'bar' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: chartType === 'line',
        type: chartType === 'bar' ? 'bar' : 'line',
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { family: 'Inter', weight: 'bold', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#111111',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        bodySpacing: 6,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.datasetIndex === 0) {
              label += '₹' + context.raw.toLocaleString();
            } else {
              label += context.raw + ' pcs';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'Inter', size: 10 } }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: { family: 'Inter', size: 10 },
          callback: (value) => '₹' + value.toLocaleString()
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: { family: 'Inter', size: 10 }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Printable Area for Invoice */}
      {selectedSale && showInvoiceModal && (
        <div id="print-section" className="hidden print:block bg-white text-black p-8 font-sans max-w-4xl mx-auto">
          <div className="flex justify-between border-b-2 border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-widest text-[#E10600]">TYREHUB</h1>
              <p className="text-xs text-gray-500 mt-1">Premium Tyre Solutions & Alignment Center</p>
              <p className="text-xs text-gray-500">123 Highway Bypass Road, Industrial Area</p>
              <p className="text-xs text-gray-500">Call: +91 98765 43210 | info@tyrehub.com</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase text-gray-800">RETAIL INVOICE</h2>
              <p className="text-sm font-semibold mt-2">Invoice: {selectedSale.invoiceNumber}</p>
              <p className="text-xs text-gray-500">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Salesperson: {selectedSale.salesperson}</p>
            </div>
          </div>

          <div className="my-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Customer Details</h3>
              <p className="text-sm font-bold">{selectedSale.customerName}</p>
              <p className="text-xs text-gray-600 mt-1">Phone: {selectedSale.customerPhone}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-right">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Payment Details</h3>
              <p className="text-sm font-bold">Method: {selectedSale.paymentMethod}</p>
              <p className="text-xs mt-1">
                Status:{' '}
                <span className={`font-bold uppercase ${selectedSale.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedSale.status}
                </span>
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse my-6">
            <thead>
              <tr className="border-b-2 border-gray-300 text-xs font-bold uppercase text-gray-700 bg-gray-100">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Size</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 px-4">
                  <div className="font-bold">{selectedSale.productName}</div>
                  <div className="text-xs text-gray-500">{selectedSale.brand} • {selectedSale.category}</div>
                </td>
                <td className="py-4 px-4 text-center text-sm font-semibold">{selectedSale.size}</td>
                <td className="py-4 px-4 text-right text-sm font-semibold">{selectedSale.quantity}</td>
                <td className="py-4 px-4 text-right text-sm font-semibold">₹{selectedSale.unitPrice.toLocaleString()}</td>
                <td className="py-4 px-4 text-right text-sm font-extrabold">₹{selectedSale.totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end pt-4 border-t-2 border-gray-200">
            <div className="w-64 text-right space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span>
                <span>₹{selectedSale.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST (0% - Inclusive):</span>
                <span>₹0</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-black text-gray-900">
                <span>Total Amount:</span>
                <span>₹{selectedSale.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center border-t border-gray-100 pt-6">
            <p className="text-sm font-bold text-gray-800">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-1">Please visit us again. Safe travels on your new tyres!</p>
          </div>
        </div>
      )}

      {/* Screen View */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">Sales History & Reports</h2>
          <p className="text-xs text-white/50 mt-1">Track customer invoice transactions, stock reduction, and analytics.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 hover:border-white/20"
          >
            📂 Export CSV / Excel
          </button>
          <button
            onClick={() => setShowRecordModal(true)}
            className="rounded-full bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-white"
          >
            ➕ Record New Sale
          </button>
        </div>
      </div>

      {/* 1. ANALYTICS CARD CAROUSEL / GRID */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Revenue */}
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-5 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Revenue</p>
            <p className="mt-2.5 text-2xl font-black text-white">₹{stats.cards.totalRevenue.toLocaleString()}</p>
            <div className="mt-2 text-[10px] text-white/50">Cumulative net sales</div>
          </div>

          {/* Today's Sales */}
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-5 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Today's Sales</p>
            <p className="mt-2.5 text-2xl font-black text-primary">₹{stats.cards.todaySales.revenue.toLocaleString()}</p>
            <div className="mt-2 text-[10px] text-white/50">{stats.cards.todaySales.quantity} tyres sold today</div>
          </div>

          {/* Monthly Sales */}
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-5 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">30-Day Sales</p>
            <p className="mt-2.5 text-2xl font-black text-white">₹{stats.cards.monthlySales.revenue.toLocaleString()}</p>
            <div className="mt-2 text-[10px] text-white/50">{stats.cards.monthlySales.quantity} tyres sold last 30d</div>
          </div>

          {/* Total Tyres Sold */}
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-5 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Tyres Sold</p>
            <p className="mt-2.5 text-2xl font-black text-blue-400">{stats.cards.totalTyresSold} Pcs</p>
            <div className="mt-2 text-[10px] text-white/50">Top Brand: {stats.cards.topBrand.name}</div>
          </div>
        </div>
      )}

      {/* 2. SALES CHART & TREND VISUALIZATIONS */}
      {stats && (
        <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sales Revenue & Volume Trends</h3>
              <p className="text-[10px] text-white/50 mt-0.5">Toggle filters below to query trend timelines.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Interval selector */}
              <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
                {['daily', 'weekly', 'monthly', 'yearly'].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setChartInterval(interval)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                      chartInterval === interval
                        ? 'bg-primary text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>

              {/* Chart type selector */}
              <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
                <button
                  onClick={() => setChartType('line')}
                  className={`rounded-lg p-1.5 transition ${chartType === 'line' ? 'bg-primary text-black' : 'text-white/60 hover:text-white'}`}
                  title="Line Chart"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`rounded-lg p-1.5 transition ${chartType === 'bar' ? 'bg-primary text-black' : 'text-white/60 hover:text-white'}`}
                  title="Bar Chart"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="h-72 w-full relative">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* 3. CONTROLS HEADER (SEARCH & FILTER FORM) */}
      <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl backdrop-blur-md space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Search box */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Search Sales Records</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-white/40">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Invoice #, customer name, or tyre model..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:border-primary focus:bg-black/60 transition"
              />
            </div>
          </div>

          {/* Date range picker */}
          <div className="grid grid-cols-2 gap-2 sm:max-w-md">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:border-primary transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:border-primary transition"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-primary border border-primary px-5 py-2.5 text-xs font-black uppercase text-black hover:bg-white hover:border-white transition lg:flex-initial"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 hover:border-white/20 transition"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Detailed drop downs for filters */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 border-t border-white/5 pt-4">
          {/* Brand Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40">Filter by Brand</label>
            <select
              value={brandFilter}
              onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-primary transition"
            >
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand} className="bg-[#111]">{brand}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-primary transition"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat} className="bg-[#111]">{cat}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40">Payment Mode</label>
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-primary transition"
            >
              <option value="All" className="bg-[#111]">All Methods</option>
              <option value="Cash" className="bg-[#111]">Cash</option>
              <option value="UPI" className="bg-[#111]">UPI</option>
              <option value="Card" className="bg-[#111]">Card</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40">Sale Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-primary transition"
            >
              <option value="All" className="bg-[#111]">All Statuses</option>
              <option value="Completed" className="bg-[#111]">Completed</option>
              <option value="Cancelled" className="bg-[#111]">Cancelled</option>
              <option value="Refunded" className="bg-[#111]">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. SALES HISTORY DATA TABLE */}
      {loading && sales.length === 0 ? (
        <p className="text-sm text-white/50 animate-pulse">Loading transaction records…</p>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-xl backdrop-blur-md space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/50">
                  <th className="px-5 py-4">Invoice #</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4">Customer Details</th>
                  <th className="px-5 py-4">Tyre Model / Snapshot</th>
                  <th className="px-5 py-4 text-center">Qty</th>
                  <th className="px-5 py-4 text-right">Unit Price</th>
                  <th className="px-5 py-4 text-right">Total Amount</th>
                  <th className="px-5 py-4 text-center">Payment</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-sm text-white/45">
                      No sales records logged.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-white/5 transition duration-200">
                      {/* Invoice */}
                      <td className="px-5 py-3.5 font-bold font-mono text-white tracking-wide">
                        {sale.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-white/60 font-mono">
                        {new Date(sale.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>

                      {/* Customer info */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white leading-tight">{sale.customerName}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{sale.customerPhone}</div>
                      </td>

                      {/* Product details */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white leading-tight">{sale.productName}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{sale.brand} • {sale.size} • {sale.category}</div>
                      </td>

                      {/* Quantity */}
                      <td className="px-5 py-3.5 text-center font-bold text-white">
                        {sale.quantity}
                      </td>

                      {/* Unit price */}
                      <td className="px-5 py-3.5 text-right font-mono text-white/80">
                        ₹{sale.unitPrice.toLocaleString()}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 text-right font-black font-mono text-primary">
                        ₹{sale.totalAmount.toLocaleString()}
                      </td>

                      {/* Payment Method */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/70">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${getStatusClass(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => handlePrintInvoice(sale)}
                            className="text-white/60 hover:text-primary transition"
                            title="Print / View Invoice"
                          >
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openEditModal(sale)}
                            className="text-white/60 hover:text-blue-400 transition"
                            title="Modify Transaction"
                          >
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale._id, sale.invoiceNumber)}
                            className="text-white/40 hover:text-red-500 transition"
                            title="Delete Record"
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

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
              <span className="text-xs text-white/50">
                Showing page <span className="text-white font-bold">{currentPage}</span> of{' '}
                <span className="text-white font-bold">{totalPages}</span> ({totalCount} total sales)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-30"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: RECORD NEW SALE */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#161616] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowRecordModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition duration-200 text-xl font-bold"
            >
              &times;
            </button>

            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Record Manual Sale</h3>
            <p className="text-xs text-white/50 mb-6">Select a product and details below to create an invoice and deduct stock.</p>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleRecordSale} className="space-y-4">
              {/* Product Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Select Tyre Product</label>
                <select
                  required
                  value={recordForm.productId}
                  onChange={(e) => setRecordForm({ ...recordForm, productId: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id} disabled={p.stock === 0} className="bg-[#111]">
                      {p.name} ({p.brand}) • Size: {p.size} • Stock: {p.stock} pcs • ₹{p.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info Row */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Customer Name</label>
                  <input
                    required
                    type="text"
                    value={recordForm.customerName}
                    onChange={(e) => setRecordForm({ ...recordForm, customerName: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Customer Phone</label>
                  <input
                    required
                    type="tel"
                    value={recordForm.customerPhone}
                    onChange={(e) => setRecordForm({ ...recordForm, customerPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Quantities & Price Row */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Quantity Sold</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={recordForm.quantity}
                    onChange={(e) => setRecordForm({ ...recordForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Unit Price (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={recordForm.unitPrice}
                    onChange={(e) => setRecordForm({ ...recordForm, unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Total Amount</label>
                  <div className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-black text-primary">
                    ₹{(recordForm.quantity * recordForm.unitPrice).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Payment and Status Row */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Payment Method</label>
                  <select
                    value={recordForm.paymentMethod}
                    onChange={(e) => setRecordForm({ ...recordForm, paymentMethod: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  >
                    <option value="Cash" className="bg-[#111]">Cash</option>
                    <option value="UPI" className="bg-[#111]">UPI</option>
                    <option value="Card" className="bg-[#111]">Card</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Sale Status</label>
                  <select
                    value={recordForm.status}
                    onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  >
                    <option value="Completed" className="bg-[#111]">Completed</option>
                    <option value="Cancelled" className="bg-[#111]">Cancelled</option>
                    <option value="Refunded" className="bg-[#111]">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 justify-end border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={formLoading}
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-xs font-black uppercase text-black hover:bg-white transition disabled:opacity-50"
                >
                  {formLoading ? 'Submitting…' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TRANSACTION DETAILS */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#161616] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition duration-200 text-xl font-bold"
            >
              &times;
            </button>

            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Modify Sale Record</h3>
            <p className="text-xs text-white/50 mb-6">Modify customer details, quantities, or cancellation status.</p>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleEditSale} className="space-y-4">
              {/* Product Info Display Only */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Product Details (Unmodifiable)</label>
                <div className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/70 font-semibold">
                  {selectedSale?.productName} ({selectedSale?.brand}) • Size: {selectedSale?.size}
                </div>
              </div>

              {/* Customer Info Row */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Customer Name</label>
                  <input
                    required
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Customer Phone</label>
                  <input
                    required
                    type="tel"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Quantities & Price Row */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Quantity Sold</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Unit Price (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editForm.unitPrice}
                    onChange={(e) => setEditForm({ ...editForm, unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Total Amount</label>
                  <div className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-black text-primary">
                    ₹{(editForm.quantity * editForm.unitPrice).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Payment and Status Row */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Payment Method</label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  >
                    <option value="Cash" className="bg-[#111]">Cash</option>
                    <option value="UPI" className="bg-[#111]">UPI</option>
                    <option value="Card" className="bg-[#111]">Card</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Sale Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white focus:border-primary transition"
                  >
                    <option value="Completed" className="bg-[#111]">Completed</option>
                    <option value="Cancelled" className="bg-[#111]">Cancelled</option>
                    <option value="Refunded" className="bg-[#111]">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 justify-end border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={formLoading}
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-xs font-black uppercase text-black hover:bg-white transition disabled:opacity-50"
                >
                  {formLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW INVOICE (SCREEN VIEW ONLY, PRINT TRIGGER HIDDEN IN CSS PRINT STYLES) */}
      {showInvoiceModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 print:hidden">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#161616] p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition duration-200 text-xl font-bold"
            >
              &times;
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 text-center">Invoice Preview</h3>

            {/* Receipt Look */}
            <div className="bg-white text-black p-6 rounded-2xl shadow-inner font-mono text-xs">
              <div className="flex justify-between border-b border-gray-300 pb-4">
                <div>
                  <h4 className="text-base font-black uppercase tracking-wider text-[#E10600]">TYREHUB</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Premium Tyre solutions</p>
                  <p className="text-[9px] text-gray-400">123 Highway Bypass Road</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">INVOICE: {selectedSale.invoiceNumber}</p>
                  <p className="text-[9px] text-gray-400">{new Date(selectedSale.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="my-4 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider">Customer Details</p>
                  <p className="font-bold mt-0.5">{selectedSale.customerName}</p>
                  <p className="text-gray-500 mt-0.5">Phone: {selectedSale.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 font-bold uppercase tracking-wider">Payment Details</p>
                  <p className="font-bold mt-0.5">Mode: {selectedSale.paymentMethod}</p>
                  <p className="text-gray-500 mt-0.5">
                    Status:{' '}
                    <span className={`font-bold ${selectedSale.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedSale.status}
                    </span>
                  </p>
                </div>
              </div>

              <table className="w-full text-left mt-4 border-t border-gray-200">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3">
                      <div className="font-bold">{selectedSale.productName}</div>
                      <div className="text-[9px] text-gray-400">{selectedSale.brand} • {selectedSale.size}</div>
                    </td>
                    <td className="py-3 text-right font-bold">{selectedSale.quantity}</td>
                    <td className="py-3 text-right">₹{selectedSale.unitPrice.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold">₹{selectedSale.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-3 text-[10px]">
                <div className="w-48 text-right space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedSale.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1.5 text-sm font-bold text-gray-900">
                    <span>Net Total:</span>
                    <span>₹{selectedSale.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-[9px] text-gray-400">
                <p>Thank you for shopping at TyreHub!</p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-white hover:bg-white/10 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full bg-primary px-6 py-2.5 text-xs font-black uppercase text-black hover:bg-white transition"
              >
                Print Invoice (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
