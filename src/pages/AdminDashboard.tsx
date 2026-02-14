import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  Users,
  Truck,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Search,
  Filter,
  Star,
  MessageSquare,
  Eye,
  Plus,
  Edit2,
  Loader2,
  RefreshCw,
  Tag,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Crown,
  Sparkles,
  LogOut,
  Home,
  Shield,
  Settings,
  ClipboardList,
  Gift
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useProducts, Product } from '../hooks/useProducts';
import { useSubscriptionPlans, SubscriptionPlan } from '../hooks/useSubscriptionPlans';
import { useServiceCategories, ServiceCategory } from '../hooks/useServiceCategories';
import { useAuth } from '../contexts/AuthContext';
import { useReviews, Review } from '../hooks/useReviews';
import UserManagement from '../components/UserManagement';
import SettingsAdmin from '../components/SettingsAdmin';
import { OrdersManagement } from '../components/OrdersManagement';
import { OrderMap } from '../components/OrderMap';
import { usePermissions } from '../hooks/usePermissions';
import { useSettings } from '../hooks/useSettings';
import { supabase } from '../lib/supabase';

// Small stat card helper
const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</p>
    <p className="text-xl font-semibold text-gray-900">{value}</p>
  </div>
);

// Map View Component
function MapView() {
  const { orderPins, hotZones, fetchOrderPins, loading } = useAdmin();

  const markers = orderPins
    .map((pin) => {
      const toNum = (value: any) =>
        value === null || value === undefined || value === '' ? null : Number(value);

      const lat =
        toNum((pin as any).pickup_latitude) ??
        toNum((pin as any).latitude) ??
        toNum((pin as any).lat) ??
        null;
      const lng =
        toNum((pin as any).pickup_longitude) ??
        toNum((pin as any).longitude) ??
        toNum((pin as any).lng) ??
        null;

      if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) return null;

      return {
        id: pin.id,
        orderNumber: pin.order_number,
        customerName: pin.customer_name,
        status: pin.status,
        serviceType: pin.service_type,
        lat,
        lng,
      };
    })
    .filter(Boolean) as {
    id: string;
    orderNumber?: string;
    customerName?: string;
    status?: string;
    serviceType?: string;
    lat: number;
    lng: number;
  }[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
      case 'scheduled':
        return 'bg-[#e14171]';
      case 'picked_up':
      case 'cleaning':
      case 'ready':
        return 'bg-yellow-500';
      case 'out_for_delivery':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'scheduled': return 'Scheduled';
      case 'picked_up': return 'Picked Up';
      case 'cleaning': return 'Cleaning';
      case 'ready': return 'Ready';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Live Map View</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchOrderPins()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#e14171] rounded-full"></span>
              Awaiting Pickup
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              In Progress
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              Out for Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <OrderMap markers={markers} />

      {/* Today's Pins */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Active Orders ({orderPins.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
          </div>
        ) : orderPins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No active orders at the moment</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orderPins.map((pin) => (
              <div key={pin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getStatusColor(pin.status)}`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{pin.customer_name}</p>
                    <p className="text-sm text-gray-500">{pin.order_number} • {pin.service_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    pin.status === 'pending' || pin.status === 'confirmed' 
                      ? 'bg-pink-100 text-[#e14171]'
                      : pin.status === 'out_for_delivery'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {getStatusLabel(pin.status)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{pin.landmark?.slice(0, 30)}...</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hot Zones */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Hot Zones (Last 30 Days)</h3>
        {hotZones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No data available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hotZones.map((zone, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{zone.name}</span>
                  <span className="text-gray-500">{zone.orders} orders ({zone.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#e14171] to-pink-400 rounded-full"
                    style={{ width: `${zone.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Revenue Tracking Component
function RevenueTracking() {
  const { dailyStats, serviceBreakdown, recentTransactions, revenueOrders, fetchRevenueStats, loading } = useAdmin();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<'none' | 'customer'>('none');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportFieldOptions = [
    { id: 'order_number', label: 'Order #', getter: (o: any) => o.order_number || o.id || '' },
    { id: 'service_type', label: 'Service', getter: (o: any) => o.service_type || '' },
    { id: 'status', label: 'Status', getter: (o: any) => o.status || '' },
    { id: 'amount', label: 'Amount', getter: (o: any) => (Number(o.total ?? o.total_amount ?? 0)).toFixed(2) },
    { id: 'subtotal', label: 'Subtotal', getter: (o: any) => (Number(o.subtotal ?? 0)).toFixed(2) },
    { id: 'delivery_fee', label: 'Delivery Fee', getter: (o: any) => (Number(o.delivery_fee ?? 0)).toFixed(2) },
    { id: 'discount', label: 'Discount', getter: (o: any) => (Number(o.discount ?? 0)).toFixed(2) },
    { id: 'created_at', label: 'Created At', getter: (o: any) => (o.created_at ? new Date(o.created_at).toISOString() : '') },
    { id: 'delivery_date', label: 'Delivery Date', getter: (o: any) => o.delivery_date || '' },
    { id: 'user_id', label: 'User ID', getter: (o: any) => o.user_id || '' }
  ];
  const [selectedFields, setSelectedFields] = useState<string[]>(['order_number', 'service_type', 'status', 'amount', 'created_at']);

  useEffect(() => {
    if (period !== 'custom') {
      fetchRevenueStats(period);
    }
  }, [period, fetchRevenueStats]);

  useEffect(() => {
    setRangeError(null);
  }, [period]);

  const toggleField = (id: string) => {
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const selectAllFields = () => setSelectedFields(exportFieldOptions.map((f) => f.id));
  const clearFields = () => setSelectedFields([]);

  const applyCustomRange = () => {
    if (!customRange.start || !customRange.end) {
      setRangeError('Select a start and end date');
      return;
    }
    setRangeError(null);
    fetchRevenueStats('custom', customRange);
  };

  const exportCsv = () => {
    if (!selectedFields.length) {
      setRangeError('Choose at least one column to export');
      setShowExportOptions(true);
      return;
    }
    if (!revenueOrders || revenueOrders.length === 0) {
      setRangeError('No revenue data to export for this period');
      return;
    }
    const headers = selectedFields.map(
      (id) => exportFieldOptions.find((f) => f.id === id)?.label || id
    );
    const rows = revenueOrders.map((o: any) =>
      selectedFields.map((id) => {
        const field = exportFieldOptions.find((f) => f.id === id);
        return field ? field.getter(o) : '';
      })
    );
    const escapeCell = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
    const csv = [headers.map(escapeCell).join(','), ...rows.map(r => r.map(escapeCell).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-${period}${period === 'custom' ? '' : `-${new Date().toISOString().slice(0,10)}`}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Revenue Tracking</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <div className="relative">
            <button
              onClick={() => setShowExportOptions((s) => !s)}
              className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              Export CSV
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Choose columns</span>
                  <button
                    onClick={() => setShowExportOptions(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    âœ•
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {exportFieldOptions.map((field) => (
                    <label key={field.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleField(field.id)}
                        className="rounded border-gray-300 text-[#e14171] focus:ring-[#e14171]"
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                  <div className="flex gap-2">
                    <button onClick={selectAllFields} className="underline hover:text-gray-900">Select all</button>
                    <button onClick={clearFields} className="underline hover:text-gray-900">Clear</button>
                  </div>
                  <button
                    onClick={() => { setShowExportOptions(false); exportCsv(); }}
                    className="px-3 py-1.5 bg-[#e14171] text-white rounded-lg text-xs font-semibold hover:bg-[#c73562]"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {period === 'custom' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
            />
          </div>
          <button
            onClick={applyCustomRange}
            className="h-11 px-6 bg-[#e14171] text-white rounded-xl font-semibold hover:bg-[#c73562] transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {rangeError && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {rangeError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                {dailyStats.growth !== 0 && (
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    dailyStats.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {dailyStats.growth > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {dailyStats.growth > 0 ? '+' : ''}{dailyStats.growth}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">${dailyStats.total.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                {period === 'today' ? "Today's" : period === 'week' ? 'This Week\'s' : period === 'month' ? 'This Month\'s' : 'This Year\'s'} Revenue
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="bg-pink-100 p-3 rounded-xl w-fit mb-4">
                <Package className="h-6 w-6 text-[#e14171]" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{dailyStats.orders}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="bg-gray-100 p-3 rounded-xl w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">${dailyStats.avgOrder.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Avg. Order Value</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="bg-orange-100 p-3 rounded-xl w-fit mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{dailyStats.newCustomers}</p>
              <p className="text-sm text-gray-500">New Customers</p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue by Service</h3>
            {serviceBreakdown.every(s => s.orders === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No revenue data for this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-900">{item.service}</span>
                        <span className="text-gray-700">${item.amount.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${dailyStats.total > 0 ? (item.amount / dailyStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.orders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Group by</span>
                <select
                  className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                  value={groupMode}
                  onChange={(e) => setGroupMode(e.target.value as typeof groupMode)}
                >
                  <option value="none">None</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {groupMode === 'customer' ? (
                  <div className="space-y-4">
                    {Object.entries(
                      recentTransactions.reduce((acc: any, tx) => {
                        const key = tx.customer_name || 'Unknown';
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(tx);
                        return acc;
                      }, {})
                    ).map(([customer, items]) => {
                      const total = (items as any[]).reduce((sum, tx) => sum + (tx.amount || 0), 0);
                      return (
                        <div key={customer} className="border border-gray-100 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{customer}</p>
                              <p className="text-xs text-gray-500">{(items as any[]).length} orders</p>
                            </div>
                            <p className="font-semibold text-gray-900">${total.toFixed(2)}</p>
                          </div>
                          <table className="w-full">
                            <tbody>
                              {(items as any[]).map((tx) => (
                                <tr key={tx.id} className="border-t last:border-0">
                                  <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">{tx.order_number}</td>
                                  <td className="py-3 px-4 text-gray-600 capitalize">{tx.service_type}</td>
                                  <td className="py-3 px-4 font-medium text-gray-900">${tx.amount.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{tx.time}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      tx.status === 'delivered'
                                        ? 'bg-green-100 text-green-700'
                                        : tx.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {tx.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Order ID</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Service</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Time</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b last:border-0">
                          <td className="py-3 font-medium text-gray-900">{tx.order_number}</td>
                          <td className="py-3 text-gray-700">{tx.customer_name}</td>
                          <td className="py-3 text-gray-600 capitalize">{tx.service_type}</td>
                          <td className="py-3 font-medium text-gray-900">${tx.amount.toFixed(2)}</td>
                          <td className="py-3 text-gray-500">{tx.time}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.status === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : tx.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Customer Notes Component
function CustomerNotes() {
  const { customers, fetchCustomers, updateCustomerNote, loading } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [pinIds, setPinIds] = useState<string[]>([]);
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    pinned: false,
    highValue: false, // total_spent > 150
    repeat: false,    // orders_count >= 3
    notes: false      // has note
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  // Load local-only pin + tags so Blackbook stays unique to this page
  useEffect(() => {
    const storedPins = localStorage.getItem('blackbookPins');
    const storedTags = localStorage.getItem('blackbookTags');
    if (storedPins) setPinIds(JSON.parse(storedPins));
    if (storedTags) setTags(JSON.parse(storedTags));
  }, []);

  useEffect(() => {
    localStorage.setItem('blackbookPins', JSON.stringify(pinIds));
  }, [pinIds]);

  useEffect(() => {
    localStorage.setItem('blackbookTags', JSON.stringify(tags));
  }, [tags]);

  const handleSaveNote = async (userId: string) => {
    setSaving(true);
    const result = await updateCustomerNote(userId, noteText);
    setSaving(false);
    if (result.success) {
      setEditingNote(null);
      setNoteText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Blackbook</h2>
        <button 
          onClick={() => fetchCustomers()}
          className="px-4 py-2 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilters(f => ({ ...f, pinned: !f.pinned }))}
            className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-1 ${filters.pinned ? 'bg-[#e14171] text-white border-[#e14171]' : 'border-gray-200 text-gray-700'}`}
          >
            <Filter className="h-4 w-4" /> Pinned
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, highValue: !f.highValue }))}
            className={`px-3 py-2 rounded-xl border text-sm ${filters.highValue ? 'bg-[#e14171] text-white border-[#e14171]' : 'border-gray-200 text-gray-700'}`}
          >
            High value
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, repeat: !f.repeat }))}
            className={`px-3 py-2 rounded-xl border text-sm ${filters.repeat ? 'bg-[#e14171] text-white border-[#e14171]' : 'border-gray-200 text-gray-700'}`}
          >
            Repeat
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, notes: !f.notes }))}
            className={`px-3 py-2 rounded-xl border text-sm ${filters.notes ? 'bg-[#e14171] text-white border-[#e14171]' : 'border-gray-200 text-gray-700'}`}
          >
            Has notes
          </button>
        </div>
      </div>

      {/* Customer Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No customers found</p>
          <p className="text-sm">Customers will appear here after they place orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customers
            .filter((c) => {
              if (filters.pinned && !pinIds.includes(c.id)) return false;
              if (filters.highValue && c.total_spent <= 150) return false;
              if (filters.repeat && c.orders_count < 3) return false;
              if (filters.notes && !c.notes) return false;
              return true;
            })
            .sort((a, b) => {
              const aPinned = pinIds.includes(a.id) ? 1 : 0;
              const bPinned = pinIds.includes(b.id) ? 1 : 0;
              if (aPinned !== bPinned) return bPinned - aPinned;
              return b.total_spent - a.total_spent;
            })
            .map((customer) => {
              const customerTags = tags[customer.id] || [];
              const avgOrderValue = customer.orders_count > 0 ? customer.total_spent / customer.orders_count : 0;
              return (
            <div key={customer.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#e14171] to-pink-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    )}
                    {customer.average_rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < Math.round(customer.average_rating)
                                ? 'fill-[#e14171] text-[#e14171]' 
                                : 'text-gray-200'
                            }`} 
                          />
                        ))}
                        <span className="text-sm text-gray-500 ml-1">({customer.average_rating})</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${customer.total_spent.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{customer.orders_count} orders</p>
                  <p className="text-xs text-gray-400">AOV ${avgOrderValue.toFixed(2)}</p>
                  <button
                    onClick={() =>
                      setPinIds((prev) =>
                        prev.includes(customer.id)
                          ? prev.filter((id) => id !== customer.id)
                          : [...prev, customer.id]
                      )
                    }
                    className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      pinIds.includes(customer.id)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pinIds.includes(customer.id) ? 'Pinned' : 'Pin'}
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              {editingNote === customer.id ? (
                <div className="mb-4">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add notes about this customer (preferences, special requests, etc.)"
                    className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveNote(customer.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-[#e14171] text-white rounded-lg font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setEditingNote(null);
                        setNoteText('');
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : customer.notes ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">{customer.notes}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingNote(customer.id);
                        setNoteText(customer.notes);
                      }}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingNote(customer.id);
                    setNoteText('');
                  }}
                  className="mb-4 text-sm text-[#e14171] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add customer note
                </button>
              )}

              {/* Preferences + Tags */}
              {(customer.preferences.length > 0 || customerTags.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {customer.preferences.map((pref, idx) => (
                    <span 
                      key={`pref-${idx}`}
                      className="px-3 py-1 bg-pink-50 text-[#e14171] rounded-full text-sm capitalize"
                    >
                      {pref}
                    </span>
                  ))}
                  {customerTags.map((tag, idx) => (
                    <span
                      key={`tag-${idx}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          setTags((prev) => ({
                            ...prev,
                            [customer.id]: (prev[customer.id] || []).filter((t) => t !== tag)
                          }))
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        âœ•
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput[customer.id] || ''}
                  onChange={(e) => setTagInput((prev) => ({ ...prev, [customer.id]: e.target.value }))}
                  placeholder="Add private tag (e.g. VIP, Allergies)"
                  className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
                <button
                  onClick={() => {
                    const text = (tagInput[customer.id] || '').trim();
                    if (!text) return;
                    setTags((prev) => ({
                      ...prev,
                      [customer.id]: [...(prev[customer.id] || []), text]
                    }));
                    setTagInput((prev) => ({ ...prev, [customer.id]: '' }));
                  }}
                  className="px-3 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800"
                >
                  Add tag
                </button>
                <div className="flex gap-2 text-xs text-gray-600">
                  {['VIP', 'Allergies', 'Fragile items'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() =>
                        setTags((prev) => ({
                          ...prev,
                          [customer.id]: prev[customer.id]?.includes(preset)
                            ? prev[customer.id]
                            : [...(prev[customer.id] || []), preset]
                        }))
                      }
                      className="px-2 py-1 border border-gray-200 rounded-lg hover:border-gray-400"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500 space-x-2">
                  <span>Last order: {customer.last_order}</span>
                  <span className="text-gray-300">|</span>
                  <span>Value tier: {customer.total_spent > 300 ? 'Top' : customer.total_spent > 150 ? 'Rising' : 'Standard'}</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-[#e14171] hover:bg-pink-50 rounded-lg">
                    <MessageSquare className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-[#e14171] hover:bg-pink-50 rounded-lg">
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Driver Performance Component
function DriverPerformance() {
  const { drivers, driverStats, addDriver, updateDriverStatus, loading, fetchDriverTrips } = useAdmin();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [reportDriver, setReportDriver] = useState<any | null>(null);
  const [reportTrips, setReportTrips] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [exportColumns, setExportColumns] = useState<string[]>([
    'trip_type',
    'order_number',
    'customer_name',
    'started_at',
    'completed_at',
    'duration_minutes'
  ]);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const handleAddDriver = async () => {
    if (!newDriver.name.trim()) return;
    setSaving(true);
    const result = await addDriver(newDriver);
    setSaving(false);
    if (result.success) {
      setShowAddModal(false);
      setNewDriver({ name: '', phone: '' });
    }
  };

  const handleStatusChange = async (driverId: string, status: string) => {
    await updateDriverStatus(driverId, status);
  };

  const openReport = async (driver: any) => {
    setReportDriver(driver);
    setReportLoading(true);
    const trips = await fetchDriverTrips(driver.id);
    setReportTrips(trips);
    setReportLoading(false);
  };

  const closeReport = () => {
    setReportDriver(null);
    setReportTrips([]);
    setReportLoading(false);
  };

  const toggleExportColumn = (col: string) => {
    setExportColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const exportCsv = async (allDrivers = false) => {
    let rows: any[] = [];
    if (allDrivers) {
      const { data, error } = await supabase
        .from('driver_trips')
        .select(`
          *,
          drivers(name, phone),
          orders(order_number, users(full_name))
        `)
        .order('started_at', { ascending: false })
        .limit(5000);
      if (error) return;
      rows = (data || []).map((t) => ({
        driver: (t as any).drivers?.name || '',
        driver_phone: (t as any).drivers?.phone || '',
        trip_type: t.trip_type,
        order_number: (t as any).orders?.order_number || t.order_id,
        customer_name: (t as any).orders?.users?.full_name || '',
        started_at: t.started_at,
        completed_at: t.completed_at,
        duration_minutes:
          t.started_at && t.completed_at
            ? Math.round(
                ((new Date(t.completed_at).getTime() -
                  new Date(t.started_at).getTime()) /
                  60000) * 10
              ) / 10
            : ''
      }));
    } else {
      rows = reportTrips.map((t) => ({
        driver: reportDriver?.name || '',
        driver_phone: reportDriver?.phone || '',
        trip_type: t.trip_type,
        order_number: t.order_number || t.order_id,
        customer_name: t.customer_name || '',
        started_at: t.started_at,
        completed_at: t.completed_at,
        duration_minutes: t.duration_minutes ?? ''
      }));
    }

    const header = exportColumns.map((c) => c);
    const csvRows = [
      header.join(','),
      ...rows.map((r) =>
        exportColumns
          .map((c) => {
            const val = r[c] ?? '';
            const s = String(val);
            return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = allDrivers ? 'driver-trips-all.csv' : `driver-trips-${reportDriver?.name || 'driver'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const pickupCount = reportTrips.filter((t) => t.trip_type === 'pickup').length;
  const deliveryCount = reportTrips.filter((t) => t.trip_type === 'delivery').length;
  const avgDuration = Math.round(
    reportTrips
      .filter((t) => t.duration_minutes !== null)
      .reduce((sum, t) => sum + (t.duration_minutes || 0), 0) /
      (reportTrips.filter((t) => t.duration_minutes !== null).length || 1)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Driver Performance</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Break
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Offline
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Driver
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{driverStats.total}</p>
          <p className="text-sm text-gray-500">Total Drivers</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{driverStats.active}</p>
          <p className="text-sm text-gray-500">Active Now</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{driverStats.todayPickups}</p>
          <p className="text-sm text-gray-500">Today's Pickups</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{driverStats.todayDeliveries}</p>
          <p className="text-sm text-gray-500">Today's Deliveries</p>
        </div>
      </div>

      {/* Driver Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No drivers added yet</p>
          <p className="text-sm">Click "Add Driver" to add your first driver</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {drivers.map((driver) => (
            <div key={driver.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#e14171] to-pink-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      driver.status === 'active' 
                        ? 'bg-green-500' 
                        : driver.status === 'break'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                    {driver.phone && (
                      <p className="text-sm text-gray-500">{driver.phone}</p>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#e14171] text-[#e14171]" />
                      <span className="text-sm text-gray-600">{driver.rating}</span>
                    </div>
                  </div>
                </div>
                <select
                  value={driver.status}
                  onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize border-0 cursor-pointer ${
                    driver.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : driver.status === 'break'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="break">Break</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{driver.today_pickups}</p>
                  <p className="text-xs text-gray-500">Pickups Today</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{driver.today_deliveries}</p>
                  <p className="text-xs text-gray-500">Deliveries Today</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Avg. Pickup â†’ Facility</span>
                    <span className="font-medium">{driver.avg_pickup_time} min</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        driver.avg_pickup_time <= 15 ? 'bg-green-500' :
                        driver.avg_pickup_time <= 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, (30 - driver.avg_pickup_time) / 30 * 100 + 50)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">On-Time Rate</span>
                    <span className="font-medium">{driver.on_time_rate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        driver.on_time_rate >= 95 ? 'bg-green-500' :
                        driver.on_time_rate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${driver.on_time_rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openReport(driver)}
                className="mt-4 w-full py-2 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
              >
                View Full Report
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Driver Report Modal */}
      {reportDriver && (
        <>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Driver Report</h3>
                <p className="text-sm text-gray-500">
                  {reportDriver.name} • {reportDriver.phone || 'No phone'}
                </p>
              </div>
              <button
                onClick={closeReport}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <style>
              {`
                @media screen {
                  .print-only { display: none; }
                }
                @media print {
                  .no-print { display: none !important; }
                  .print-only { display: block !important; }
                  #driver-print { display: block !important; }
                  #driver-print .print-table { width: 100%; border-collapse: collapse; }
                  #driver-print .print-table th, #driver-print .print-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
                  @page { margin: 12mm; }
                }
                .print-table { width: 100%; border-collapse: collapse; }
                .print-table th, .print-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
              `}
            </style>

            <div className="p-6 space-y-4" ref={reportRef}>
              {reportLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#e14171]" />
                </div>
              ) : reportTrips.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No trips found for this driver.</p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <StatCard label="Trips" value={reportTrips.length} />
                    <StatCard label="Pickups" value={pickupCount} />
                    <StatCard label="Deliveries" value={deliveryCount} />
                    <StatCard label="Avg Duration" value={`${avgDuration} min`} />
                  </div>

                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2">Trip Type</th>
                          <th className="text-left px-4 py-2">Order</th>
                          <th className="text-left px-4 py-2">Started</th>
                          <th className="text-left px-4 py-2">Completed</th>
                          <th className="text-left px-4 py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportTrips.map(trip => (
                          <tr key={trip.id} className="border-t last:border-0">
                            <td className="px-4 py-2 capitalize">{trip.trip_type}</td>
                            <td className="px-4 py-2">
                              <div className="text-sm font-semibold text-gray-900">
                                {trip.order_number || trip.order_id}
                              </div>
                              <div className="text-xs text-gray-500">
                                {trip.customer_name || '—'}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {trip.started_at
                                ? new Date(trip.started_at).toLocaleString()
                                : '—'}
                            </td>
                            <td className="px-4 py-2">
                              {trip.completed_at
                                ? new Date(trip.completed_at).toLocaleString()
                                : '—'}
                            </td>
                            <td className="px-4 py-2">
                              {trip.duration_minutes !== null
                                ? `${trip.duration_minutes} min`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {[
                  { id: 'trip_type', label: 'Trip Type' },
                  { id: 'order_number', label: 'Order #' },
                  { id: 'customer_name', label: 'Customer' },
                  { id: 'started_at', label: 'Started' },
                  { id: 'completed_at', label: 'Completed' },
                  { id: 'duration_minutes', label: 'Duration (min)' },
                  { id: 'driver', label: 'Driver (all export)' },
                  { id: 'driver_phone', label: 'Driver Phone' }
                ].map((col) => (
                  <label key={col.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#e14171] focus:ring-[#e14171]"
                      checked={exportColumns.includes(col.id)}
                      onChange={() => toggleExportColumn(col.id)}
                    />
                    <span className="text-gray-700">{col.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-100"
                >
                  Print
                </button>
                <button
                  onClick={() => exportCsv(false)}
                  className="px-3 py-2 bg-[#e14171] text-white rounded-lg text-sm hover:bg-[#c73562]"
                >
                  Export CSV (Driver)
                </button>
                <button
                  onClick={() => exportCsv(true)}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-100"
                >
                  Export CSV (All Drivers)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Printable layout (shown only when printing) */}
        <div
          id="driver-print"
          className="printable-driver-report print-only"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '12mm 0',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            color: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <img
              src="https://af6815798a.imgdist.com/pub/bfra/knkjywkm/2no/pvb/dgk/logocroped-removebg-preview.png"
              alt="Bubble Box"
              style={{ height: '52px', width: '52px', borderRadius: '50%' }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Driver Report</h2>
              <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '13px' }}>
                {reportDriver.name} {reportDriver.phone ? `• ${reportDriver.phone}` : ''}
              </p>
            </div>
          </div>

          {reportTrips.length === 0 ? (
            <p style={{ marginTop: '12px', color: '#475569' }}>No trips found for this driver.</p>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '12px',
                  marginBottom: '14px'
                }}
              >
                {[
                  { label: 'Trips', value: reportTrips.length },
                  { label: 'Pickups', value: pickupCount },
                  { label: 'Deliveries', value: deliveryCount },
                  { label: 'Avg Duration', value: `${avgDuration} min` }
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th>Trip Type</th>
                    <th>Order</th>
                    <th>Started</th>
                    <th>Completed</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {reportTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td style={{ textTransform: 'capitalize' }}>{trip.trip_type}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{trip.order_number || trip.order_id}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{trip.customer_name || '—'}</div>
                      </td>
                      <td>{trip.started_at ? new Date(trip.started_at).toLocaleString() : '—'}</td>
                      <td>{trip.completed_at ? new Date(trip.completed_at).toLocaleString() : '—'}</td>
                      <td>{trip.duration_minutes !== null ? `${trip.duration_minutes} min` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        </>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Driver</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder="Enter driver name"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddDriver}
                disabled={saving || !newDriver.name.trim()}
                className="flex-1 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Driver
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Products & Pricing Component
function ProductPricing() {
  const { 
    products, 
    loading, 
    fetchProducts,
    getAllProductsByCategory, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductActive 
  } = useProducts();
  
  const [activeCategory, setActiveCategory] = useState('laundry');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'per_item'
  });

  const categories = [
    { id: 'laundry', label: 'Laundry', icon: 'ðŸ§º' },
    { id: 'suit', label: 'Suit Cleaning', icon: 'ðŸ¤µ' },
    { id: 'shoe', label: 'Shoe Cleaning', icon: 'ðŸ‘Ÿ' },
    { id: 'dry-clean', label: 'Dry Cleaning', icon: 'ðŸ‘”' },
    { id: 'addon', label: 'Add-ons', icon: 'âœ¨' }
  ];

  const unitLabels: Record<string, string> = {
    'per_item': 'Per Item',
    'per_kg': 'Per Kg',
    'per_bag': 'Per Bag',
    'per_pair': 'Per Pair'
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    const result = await addProduct({
      category: activeCategory,
      name: newProduct.name,
      description: newProduct.description || undefined,
      price: parseFloat(newProduct.price),
      unit: newProduct.unit
    });
    setSaving(false);

    if (result.success) {
      showNotification('success', 'Product added successfully');
      setShowAddModal(false);
      setNewProduct({ name: '', description: '', price: '', unit: 'per_item' });
    } else {
      showNotification('error', result.message);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setSaving(true);
    const result = await updateProduct(editingProduct.id, {
      name: editingProduct.name,
      description: editingProduct.description || undefined,
      price: editingProduct.price,
      unit: editingProduct.unit
    });
    setSaving(false);

    if (result.success) {
      showNotification('success', 'Product updated successfully');
      setShowEditModal(false);
      setEditingProduct(null);
    } else {
      showNotification('error', result.message);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    const result = await deleteProduct(product.id);
    if (result.success) {
      showNotification('success', 'Product deleted');
    } else {
      showNotification('error', result.message);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const result = await toggleProductActive(product.id, !product.is_active);
    if (!result.success) {
      showNotification('error', result.message);
    }
  };

  const categoryProducts = getAllProductsByCategory(activeCategory);

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products & Pricing</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchProducts()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'bg-[#e14171] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
          </div>
        ) : categoryProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No products in this category</p>
            <p className="text-sm">Click "Add Product" to create one</p>
          </div>
        ) : (
          <div className="divide-y">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-500">
              <div className="col-span-5">Product</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-1 text-center">Active</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Products */}
            {categoryProducts.map((product) => (
              <div 
                key={product.id} 
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 ${
                  !product.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="col-span-5">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  {product.description && (
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-lg font-semibold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">
                    {unitLabels[product.unit] || product.unit}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="focus:outline-none"
                  >
                    {product.is_active ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct({ ...product });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-[#e14171] hover:bg-pink-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
          <p className="text-sm text-gray-500">Total Products</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{products.filter(p => p.is_active).length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-400">{products.filter(p => !p.is_active).length}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-[#e14171]">{categories.length}</p>
          <p className="text-sm text-gray-500">Categories</p>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium">
                  {categories.find(c => c.id === activeCategory)?.icon} {categories.find(c => c.id === activeCategory)?.label}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g., Regular Bag, 2-Piece Suit"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                  >
                    <option value="per_item">Per Item</option>
                    <option value="per_kg">Per Kg</option>
                    <option value="per_bag">Per Bag</option>
                    <option value="per_pair">Per Pair</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddProduct}
                disabled={saving || !newProduct.name.trim() || !newProduct.price}
                className="flex-1 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Product
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                  >
                    <option value="per_item">Per Item</option>
                    <option value="per_kg">Per Kg</option>
                    <option value="per_bag">Per Bag</option>
                    <option value="per_pair">Per Pair</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateProduct}
                disabled={saving || !editingProduct.name.trim()}
                className="flex-1 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subscription Plans Component
function SubscriptionPlansAdmin() {
  const { 
    plans, 
    loading, 
    fetchPlans,
    updatePlan, 
    addFeature,
    removeFeature,
    setPopularPlan
  } = useSubscriptionPlans();
  
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Form state for editing - separate from editingPlan to ensure reactivity
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMonthlyPrice, setFormMonthlyPrice] = useState('');
  const [formYearlyPrice, setFormYearlyPrice] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormDescription(plan.description);
    setFormMonthlyPrice(plan.monthly_price.toString());
    setFormYearlyPrice(plan.yearly_price.toString());
    setModalError(null);
    setShowEditModal(true);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    const updateData = {
      name: formName,
      description: formDescription,
      monthly_price: parseFloat(formMonthlyPrice) || 0,
      yearly_price: parseFloat(formYearlyPrice) || 0
    };

    console.log('Saving plan with data:', {
      id: editingPlan.id,
      ...updateData
    });

    setSaving(true);
    
    try {
      setModalError(null);
      
      const result = await updatePlan(editingPlan.id, updateData);
      
      console.log('Update result:', result);
      
      if (result.success) {
        showNotification('success', 'Plan updated successfully');
        setShowEditModal(false);
        setEditingPlan(null);
        setModalError(null);
        await fetchPlans(); // Force refresh
      } else {
        setModalError(result.message);
        showNotification('error', `Failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Error in handleUpdatePlan:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setModalError(errMsg);
      showNotification('error', `Error: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    if (!editingPlan || !newFeature.trim()) return;

    setSaving(true);
    const result = await addFeature(editingPlan.id, newFeature.trim());
    setSaving(false);

    if (result.success) {
      setNewFeature('');
      await fetchPlans();
    } else {
      showNotification('error', result.message);
    }
  };

  const handleRemoveFeature = async (featureIndex: number) => {
    if (!editingPlan) return;

    const result = await removeFeature(editingPlan.id, featureIndex);
    if (result.success) {
      await fetchPlans();
    } else {
      showNotification('error', result.message);
    }
  };

  const handleSetPopular = async (planId: string) => {
    const result = await setPopularPlan(planId);
    if (result.success) {
      showNotification('success', 'Popular plan updated');
    } else {
      showNotification('error', result.message);
    }
  };

  // Refresh editingPlan for features modal when plans change
  useEffect(() => {
    if (editingPlan && showFeatureModal) {
      const updatedPlan = plans.find(p => p.id === editingPlan.id);
      if (updatedPlan) {
        setEditingPlan(updatedPlan);
      }
    }
  }, [plans, editingPlan, showFeatureModal]);

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
          <p className="text-gray-500">Manage Bubble Pass pricing and features</p>
        </div>
        <button
          onClick={() => fetchPlans()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Crown className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No subscription plans found</p>
          <p className="text-sm">Run the SQL setup to create default plans</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full ${
                plan.is_popular ? 'ring-2 ring-[#e14171]' : ''
              }`}
            >
              {/* Plan Header */}
              <div className={`p-6 ${plan.is_popular ? 'bg-gradient-to-r from-[#e14171] to-pink-500 text-white' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {plan.slug === 'basic' && <Package className="h-6 w-6" />}
                    {plan.slug === 'bubble-pass' && <Crown className="h-6 w-6" />}
                    {plan.slug === 'family-pass' && <Sparkles className="h-6 w-6" />}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  {plan.is_popular && (
                    <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className={`text-sm ${plan.is_popular ? 'text-white/80' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="p-6 border-b">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {plan.monthly_price === 0 ? 'Free' : `$${plan.monthly_price.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Yearly</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        {plan.yearly_price === 0 ? 'Free' : `$${plan.yearly_price.toFixed(2)}`}
                      </span>
                      {plan.yearly_price > 0 && plan.monthly_price > 0 && (
                        <p className="text-xs text-green-600">
                          Save ${((plan.monthly_price * 12) - plan.yearly_price).toFixed(2)}/year
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 border-b flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Features ({plan.features.length})</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 items-center justify-between mt-auto">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex-1 h-12 px-4 bg-[#e14171] text-white rounded-full font-semibold hover:bg-[#c73562] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Pricing
                </button>
                <button
                  onClick={() => {
                    setEditingPlan({ ...plan });
                    setShowFeatureModal(true);
                  }}
                  className="flex-1 h-12 px-4 border border-gray-300 rounded-full font-semibold bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Features
                </button>
              </div>

              {/* Set as Popular */}
              {!plan.is_popular && plan.slug !== 'basic' && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleSetPopular(plan.id)}
                    className="w-full h-11 text-sm font-semibold text-[#e14171] hover:bg-pink-50 border border-pink-100 rounded-full transition-colors"
                  >
                    Set as Popular
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-[#e14171] p-3 rounded-xl">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Subscription Management</h3>
            <p className="text-gray-600 text-sm mb-3">
              Changes to pricing and features will immediately reflect on the Bubble Pass page. 
              Basic plan pricing is always $0 and cannot be changed.
            </p>
            <p className="text-xs text-gray-500">
              Note: Existing subscribers will keep their current pricing until their subscription renews.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Pricing Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit {editingPlan.name}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPlan(null);
                  setModalError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Display */}
            {modalError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600">{modalError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              {editingPlan.slug !== 'basic' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formMonthlyPrice}
                        onChange={(e) => setFormMonthlyPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yearly Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formYearlyPrice}
                        onChange={(e) => setFormYearlyPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                      />
                    </div>
                    {parseFloat(formMonthlyPrice) > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested yearly price: ${(parseFloat(formMonthlyPrice) * 10).toFixed(2)} (save 2 months)
                      </p>
                    )}
                  </div>
                </>
              )}

              {editingPlan.slug === 'basic' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">
                    The Basic plan is always free. You can only edit the name and description.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdatePlan}
                disabled={saving}
                className="flex-1 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPlan(null);
                }}
                className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Features Modal */}
      {showFeatureModal && editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingPlan.name} Features</h3>
              <button
                onClick={() => {
                  setShowFeatureModal(false);
                  setEditingPlan(null);
                  setNewFeature('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Add New Feature */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a new feature..."
                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <button
                onClick={handleAddFeature}
                disabled={saving || !newFeature.trim()}
                className="px-4 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </div>
            
            {/* Features List */}
            <div className="space-y-2">
              {editingPlan.features.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No features added yet</p>
                </div>
              ) : (
                editingPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowFeatureModal(false);
                  setEditingPlan(null);
                  setNewFeature('');
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Service Categories Component (Price Ranges for Services Page)
function ServiceCategoriesAdmin() {
  const { 
    categories, 
    loading, 
    fetchCategories,
    updateCategory,
    addFeature,
    removeFeature
  } = useServiceCategories();
  
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Form state for editing
  const [formName, setFormName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceRange, setFormPriceRange] = useState('');
  const [formPriceNote, setFormPriceNote] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'laundry': return 'ðŸ§º';
      case 'suit': return 'ðŸ¤µ';
      case 'shoe': return 'ðŸ‘Ÿ';
      case 'dry-clean': return 'ðŸ‘”';
      default: return 'âœ¨';
    }
  };

  const openEditModal = (category: ServiceCategory) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormTagline(category.tagline || '');
    setFormDescription(category.description || '');
    setFormPriceRange(category.price_range);
    setFormPriceNote(category.price_note || '');
    setModalError(null);
    setShowEditModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    const updateData = {
      name: formName,
      tagline: formTagline,
      description: formDescription,
      price_range: formPriceRange,
      price_note: formPriceNote
    };

    console.log('Saving category with data:', {
      id: editingCategory.id,
      ...updateData
    });

    setSaving(true);
    
    try {
      setModalError(null);
      
      const result = await updateCategory(editingCategory.id, updateData);
      
      console.log('Update result:', result);
      
      if (result.success) {
        showNotification('success', 'Service category updated successfully');
        setShowEditModal(false);
        setEditingCategory(null);
        setModalError(null);
        await fetchCategories();
      } else {
        setModalError(result.message);
        showNotification('error', `Failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Error in handleUpdateCategory:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setModalError(errMsg);
      showNotification('error', `Error: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    if (!editingCategory || !newFeature.trim()) return;

    setSaving(true);
    const result = await addFeature(editingCategory.id, newFeature.trim());
    setSaving(false);

    if (result.success) {
      setNewFeature('');
      await fetchCategories();
      // Update the editing category with new features
      const updated = categories.find(c => c.id === editingCategory.id);
      if (updated) setEditingCategory(updated);
    } else {
      showNotification('error', result.message);
    }
  };

  const handleRemoveFeature = async (featureIndex: number) => {
    if (!editingCategory) return;

    const result = await removeFeature(editingCategory.id, featureIndex);
    if (result.success) {
      await fetchCategories();
    } else {
      showNotification('error', result.message);
    }
  };

  // Refresh editingCategory for features modal when categories change
  useEffect(() => {
    if (editingCategory && showFeatureModal) {
      const updatedCategory = categories.find(c => c.id === editingCategory.id);
      if (updatedCategory) {
        setEditingCategory(updatedCategory);
      }
    }
  }, [categories, editingCategory, showFeatureModal]);

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Categories</h2>
          <p className="text-gray-500">Manage price ranges displayed on the Services page</p>
        </div>
        <button
          onClick={() => fetchCategories()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No service categories found</p>
          <p className="text-sm">Run the SQL setup to create default categories</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Category Header */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{getCategoryIcon(category.slug)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                    {category.tagline && (
                      <p className="text-sm text-gray-500">{category.tagline}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Price Range</span>
                  <span className="text-2xl font-bold text-[#e14171]">
                    {category.price_range}
                  </span>
                </div>
                {category.price_note && (
                  <p className="text-sm text-gray-500 text-right">{category.price_note}</p>
                )}
              </div>

              {/* Description */}
              {category.description && (
                <div className="px-6 py-4 border-b">
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              )}

              {/* Features */}
              <div className="p-6 border-b bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Features ({category.features.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {category.features.slice(0, 4).map((feature, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-white text-gray-600 text-sm rounded-full border"
                    >
                      {feature}
                    </span>
                  ))}
                  {category.features.length > 4 && (
                    <span className="px-3 py-1 bg-[#e14171] text-white text-sm rounded-full">
                      +{category.features.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 flex gap-2">
                <button
                  onClick={() => openEditModal(category)}
                  className="flex-1 py-2 px-4 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Details
                </button>
                <button
                  onClick={() => {
                    setEditingCategory({ ...category });
                    setShowFeatureModal(true);
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Features
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-[#e14171] p-3 rounded-xl">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Service Categories Management</h3>
            <p className="text-gray-600 text-sm mb-3">
              These price ranges are displayed on the Services page. Edit the price range text 
              to update what customers see when browsing your services.
            </p>
            <p className="text-xs text-gray-500">
              Example: "$2.50/kg or $12/bag" or "$18-$30 per suit"
            </p>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(editingCategory.slug)}</span>
                <h3 className="text-xl font-bold text-gray-900">Edit {editingCategory.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setModalError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Display */}
            {modalError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600">{modalError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="e.g., Fresh, Clean, Perfectly Folded"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] resize-none"
                />
              </div>

              <div className="bg-pink-50 rounded-xl p-4 space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#e14171]" />
                  Pricing Display
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range *
                  </label>
                  <input
                    type="text"
                    value={formPriceRange}
                    onChange={(e) => setFormPriceRange(e.target.value)}
                    placeholder="e.g., $2.50/kg or $12/bag"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is what customers see on the Services page
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Note
                  </label>
                  <input
                    type="text"
                    value={formPriceNote}
                    onChange={(e) => setFormPriceNote(e.target.value)}
                    placeholder="e.g., Priced by weight or bag"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] bg-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateCategory}
                disabled={saving || !formPriceRange.trim()}
                className="flex-1 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                }}
                className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Features Modal */}
      {showFeatureModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(editingCategory.slug)}</span>
                <h3 className="text-xl font-bold text-gray-900">{editingCategory.name} Features</h3>
              </div>
              <button
                onClick={() => {
                  setShowFeatureModal(false);
                  setEditingCategory(null);
                  setNewFeature('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Add New Feature */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a new feature..."
                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <button
                onClick={handleAddFeature}
                disabled={saving || !newFeature.trim()}
                className="px-4 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </div>
            
            {/* Features List */}
            <div className="space-y-2">
              {editingCategory.features.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No features added yet</p>
                </div>
              ) : (
                editingCategory.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowFeatureModal(false);
                  setEditingCategory(null);
                  setNewFeature('');
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reviews Management Component
function ReviewsManagement() {
  const { 
    reviews, 
    loading, 
    stats,
    fetchReviews,
    addReview, 
    updateReview, 
    deleteReview, 
    toggleFeatured,
    toggleApproved
  } = useReviews();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerLocation, setFormCustomerLocation] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formServiceType, setFormServiceType] = useState('laundry');
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [formIsApproved, setFormIsApproved] = useState(true);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormCustomerName('');
    setFormCustomerLocation('');
    setFormRating(5);
    setFormComment('');
    setFormServiceType('laundry');
    setFormIsFeatured(true);
    setFormIsApproved(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setFormCustomerName(review.customer_name);
    setFormCustomerLocation(review.customer_location || '');
    setFormRating(review.rating);
    setFormComment(review.comment);
    setFormServiceType(review.service_type);
    setFormIsFeatured(review.is_featured);
    setFormIsApproved(review.is_approved);
    setShowEditModal(true);
  };

  const handleAddReview = async () => {
    if (!formCustomerName.trim() || !formComment.trim()) {
      showNotification('error', 'Please fill in customer name and comment');
      return;
    }

    setSaving(true);
    const result = await addReview({
      customer_name: formCustomerName,
      customer_location: formCustomerLocation || undefined,
      rating: formRating,
      comment: formComment,
      service_type: formServiceType,
      is_featured: formIsFeatured,
      is_approved: formIsApproved
    });
    setSaving(false);

    if (result.success) {
      showNotification('success', 'Review added successfully');
      setShowAddModal(false);
      resetForm();
    } else {
      showNotification('error', result.message);
    }
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    setSaving(true);
    const result = await updateReview(editingReview.id, {
      customer_name: formCustomerName,
      customer_location: formCustomerLocation || undefined,
      rating: formRating,
      comment: formComment,
      service_type: formServiceType,
      is_featured: formIsFeatured,
      is_approved: formIsApproved
    });
    setSaving(false);

    if (result.success) {
      showNotification('success', 'Review updated successfully');
      setShowEditModal(false);
      setEditingReview(null);
    } else {
      showNotification('error', result.message);
    }
  };

  const handleDeleteReview = async (review: Review) => {
    if (!confirm(`Are you sure you want to delete the review from "${review.customer_name}"?`)) return;

    const result = await deleteReview(review.id);
    if (result.success) {
      showNotification('success', 'Review deleted');
    } else {
      showNotification('error', result.message);
    }
  };

  const handleToggleFeatured = async (review: Review) => {
    const result = await toggleFeatured(review.id, !review.is_featured);
    if (!result.success) {
      showNotification('error', result.message);
    }
  };

  const handleToggleApproved = async (review: Review) => {
    const result = await toggleApproved(review.id, !review.is_approved);
    if (!result.success) {
      showNotification('error', result.message);
    }
  };

  const serviceTypeLabels: Record<string, string> = {
    'laundry': 'Laundry',
    'suit': 'Suit Cleaning',
    'shoe': 'Shoe Cleaning',
    'dry-clean': 'Dry Cleaning'
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          <p className="text-gray-500">Manage testimonials displayed on the homepage</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviews()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Review
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Reviews</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-[#e14171]">{stats.featured}</p>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
          </div>
          <p className="text-sm text-gray-500">Avg Rating</p>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No reviews yet</p>
          <p className="text-sm">Click "Add Review" to create your first testimonial</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className={`bg-white rounded-2xl p-6 shadow-sm ${
                !review.is_approved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#e14171] to-pink-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {review.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{review.customer_name}</h3>
                      {review.is_featured && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500" />
                          Featured
                        </span>
                      )}
                      {!review.is_approved && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>
                    {review.customer_location && (
                      <p className="text-sm text-gray-500">{review.customer_location}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-200'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeatured(review)}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_featured 
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={review.is_featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <Star className={`h-4 w-4 ${review.is_featured ? 'fill-yellow-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleToggleApproved(review)}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_approved 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={review.is_approved ? 'Hide review' : 'Approve review'}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(review)}
                    className="p-2 text-gray-400 hover:text-[#e14171] hover:bg-pink-50 rounded-lg"
                    title="Edit review"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="px-3 py-1 bg-pink-50 text-[#e14171] rounded-full text-sm capitalize">
                  {serviceTypeLabels[review.service_type] || review.service_type}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-[#e14171] p-3 rounded-xl">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Reviews Management</h3>
            <p className="text-gray-600 text-sm mb-3">
              Only reviews that are both <strong>Featured</strong> and <strong>Approved</strong> will appear 
              on the homepage in the "What Our Customers Say" section.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="text-gray-600">= Featured</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">= Approved (visible)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Review Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {showAddModal ? 'Add New Review' : 'Edit Review'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingReview(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g., Sarah Johnson"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formCustomerLocation}
                    onChange={(e) => setFormCustomerLocation(e.target.value)}
                    placeholder="e.g., Downtown, Westside"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormRating(rating)}
                      className="p-1 focus:outline-none"
                    >
                      <Star 
                        className={`h-8 w-8 transition-colors ${
                          rating <= formRating
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-200 hover:text-yellow-300'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-gray-600 font-medium">{formRating}/5</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Comment *
                </label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Write the customer's review here..."
                  rows={4}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={formServiceType}
                  onChange={(e) => setFormServiceType(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                >
                  <option value="laundry">Laundry Services</option>
                  <option value="suit">Suit Cleaning</option>
                  <option value="shoe">Shoe Cleaning</option>
                  <option value="dry-clean">Dry Cleaning</option>
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-5 h-5 text-[#e14171] rounded focus:ring-[#e14171]"
                  />
                  <span className="text-gray-700">Featured on Homepage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsApproved}
                    onChange={(e) => setFormIsApproved(e.target.checked)}
                    className="w-5 h-5 text-[#e14171] rounded focus:ring-[#e14171]"
                  />
                  <span className="text-gray-700">Approved</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={showAddModal ? handleAddReview : handleUpdateReview}
                disabled={saving || !formCustomerName.trim() || !formComment.trim()}
                className="flex-1 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {showAddModal ? 'Add Review' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingReview(null);
                }}
                className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Referral earnings table
function ReferralEarnings() {
  const { getNumberSetting } = useSettings();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, creditsRes] = await Promise.all([
        supabase.from('users').select('id, full_name, email'),
        supabase.from('user_credits').select('user_id, amount, source_type, type, created_at')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (creditsRes.error) throw creditsRes.error;

      const awardMin = getNumberSetting('award_min_lifetime_earnings', 1000);
      const users = usersRes.data || [];
      const credits = creditsRes.data || [];

      const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
      const toTs = dateTo ? new Date(dateTo).getTime() : null;

      const data = users
        .map((u) => {
          const myCredits = credits.filter((c) => c.user_id === u.id);

          const lifetimeEarned = myCredits
            .filter((c) => Number(c.amount) > 0)
            .reduce((sum, c) => sum + Number(c.amount), 0);
          const referralEarned = myCredits
            .filter((c) => Number(c.amount) > 0 && c.source_type === 'referral')
            .reduce((sum, c) => sum + Number(c.amount), 0);
          const balance = myCredits.reduce((sum, c) => sum + Number(c.amount), 0);
          const lastCreditTs = myCredits.reduce((latest, c) => {
            const t = new Date(c.created_at || 0).getTime();
            return t > latest ? t : latest;
          }, 0);

          // Apply last-credit date filter on the user row (inclusive)
          if (fromTs && (!lastCreditTs || lastCreditTs < fromTs)) return null;
          if (toTs && (!lastCreditTs || lastCreditTs > toTs)) return null;

          return {
            id: u.id,
            name: u.full_name || '—',
            email: u.email || '—',
            lifetimeEarned,
            referralEarned,
            balance,
            lastCreditAt: lastCreditTs ? new Date(lastCreditTs).toLocaleString() : '—',
            qualifies: lifetimeEarned >= awardMin
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b as any).lifetimeEarned - (a as any).lifetimeEarned);

      setRows(data);
    } catch (err) {
      console.error('Error loading referral earnings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const handleExportCsv = () => {
    const header = ['User','Email','Lifetime Earned','Referral Earned','Balance','Last Credit','Qualifies'];
    const lines = rows.map(r => [
      `"${(r.name || '').replace(/"/g,'""')}"`,
      `"${(r.email || '').replace(/"/g,'""')}"`,
      r.lifetimeEarned.toFixed(2),
      r.referralEarned.toFixed(2),
      r.balance.toFixed(2),
      `"${r.lastCreditAt}"`,
      r.qualifies ? 'Yes' : 'No'
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'referral_earnings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Referral Earnings</h3>
          <p className="text-sm text-gray-500">Lifetime earnings, balances, and award eligibility</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            aria-label="From date"
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            aria-label="To date"
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshingâ€¦' : 'Refresh'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={loading || rows.length === 0}
            className="px-3 py-2 bg-[#e14171] text-white rounded-lg text-sm hover:bg-[#c73562] disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500">
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Lifetime Earned</th>
              <th className="py-2 pr-4">Referral Earned</th>
              <th className="py-2 pr-4">Balance</th>
              <th className="py-2 pr-4">Last Credit</th>
              <th className="py-2 pr-4">Qualifies</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  <Loader2 className="h-5 w-5 inline animate-spin text-[#e14171] mr-2" />
                  Loadingâ€¦
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">No data yet</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 pr-4 font-medium text-gray-900">{row.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{row.email}</td>
                  <td className="py-2 pr-4">${row.lifetimeEarned.toFixed(2)}</td>
                  <td className="py-2 pr-4">${row.referralEarned.toFixed(2)}</td>
                  <td className="py-2 pr-4">${row.balance.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-gray-500">{row.lastCreditAt}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      row.qualifies ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {row.qualifies ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Admin Dashboard Component
export function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dailyStats, orderPins, driverStats } = useAdmin();
  const { user, signOut } = useAuth();
  const { canAccessAdmin, loading: permsLoading } = usePermissions();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!permsLoading && !canAccessAdmin()) {
      navigate('/');
    }
  }, [permsLoading, canAccessAdmin, navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', label: 'Map View', icon: MapPin },
    { path: '/admin/orders', label: 'All Orders', icon: ClipboardList },
    { path: '/admin/revenue', label: 'Revenue', icon: DollarSign },
    { path: '/admin/customers', label: 'Customer Notes', icon: Users },
    { path: '/admin/referrals', label: 'Referral Earnings', icon: Gift },
    { path: '/admin/drivers', label: 'Driver Performance', icon: Truck },
    { path: '/admin/products', label: 'Products & Pricing', icon: Tag },
    { path: '/admin/subscriptions', label: 'Subscription Plans', icon: Crown },
    { path: '/admin/services', label: 'Service Categories', icon: Sparkles },
    { path: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
    { path: '/admin/users', label: 'User Management', icon: Shield },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Quick stats for header
  const quickStats = [
    { label: 'Active Orders', value: orderPins.length, icon: Package, color: 'text-[#e14171]' },
    { label: 'Today\'s Revenue', value: `$${dailyStats.total.toFixed(0)}`, icon: DollarSign, color: 'text-green-500' },
    { label: 'Total Orders', value: dailyStats.orders, icon: Clock, color: 'text-orange-500' },
    { label: 'Drivers Active', value: driverStats.active, icon: Truck, color: 'text-blue-500' },
  ];

  if (permsLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loadingâ€¦</div>;
  }

  if (!canAccessAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-black text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Back to Home"
              >
                <Home className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">The Bubble Box Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {quickStats.map((stat, idx) => (
                <div key={idx} className="hidden lg:flex items-center gap-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                </div>
              ))}
              
              {/* User & Logout */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-700">
                {user && (
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Logout"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm sticky top-24">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive(item.path)
                        ? 'bg-[#e14171] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </button>
                ))}
              </nav>

              <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">System Status</span>
                </div>
                <p className="text-sm text-gray-600">All services operational</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <Routes>
              <Route path="/" element={<MapView />} />
              <Route path="/orders" element={<OrdersManagement />} />
              <Route path="/revenue" element={<RevenueTracking />} />
              <Route path="/customers" element={<CustomerNotes />} />
              <Route path="/drivers" element={<DriverPerformance />} />
              <Route path="/products" element={<ProductPricing />} />
              <Route path="/subscriptions" element={<SubscriptionPlansAdmin />} />
              <Route path="/services" element={<ServiceCategoriesAdmin />} />
              <Route path="/reviews" element={<ReviewsManagement />} />
              <Route path="/referrals" element={<ReferralEarnings />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<SettingsAdmin />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}


