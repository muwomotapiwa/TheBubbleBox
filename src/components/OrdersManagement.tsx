import { useState, useEffect } from 'react';
import {
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  DollarSign,
  Truck,
  MessageSquare,
  Download,
  Printer,
  RefreshCw,
  History,
  UserCheck,
  Flag,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { useOrders, OrderWithItems } from '../hooks/useOrders';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';

interface OrderStatusHistory {
  id: string;
  status: string;
  notes?: string;
  created_at: string;
  changed_by?: string;
}

interface Driver {
  id: string;
  name: string;
  phone?: string;
  status: string;
  current_orders?: number;
  max_orders?: number;
}

export function OrdersManagement() {
  const { user } = useAuth();
  const { 
    fetchAllOrders, 
    updateOrderStatus, 
    assignDriver, 
    togglePriority, 
    updateInternalNotes,
    getOrderHistory 
  } = useOrders();
  const { drivers, fetchDrivers } = useAdmin();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [_showBulkActions, _setShowBulkActions] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState<string[]>([
    'order_number', 'date', 'status', 'service', 'total', 'customer_name', 'customer_email', 'address'
  ]);
  const [exportRange, setExportRange] = useState<'all' | 'filtered' | 'selected' | 'date_range'>('filtered');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  
  // Available columns for export
  const availableColumns = [
    { id: 'order_number', label: 'Order Number', category: 'Order' },
    { id: 'date', label: 'Order Date', category: 'Order' },
    { id: 'status', label: 'Status', category: 'Order' },
    { id: 'service', label: 'Service Type', category: 'Order' },
    { id: 'items_count', label: 'Items Count', category: 'Order' },
    { id: 'subtotal', label: 'Subtotal', category: 'Pricing' },
    { id: 'delivery_fee', label: 'Delivery Fee', category: 'Pricing' },
    { id: 'discount', label: 'Discount', category: 'Pricing' },
    { id: 'total', label: 'Total', category: 'Pricing' },
    { id: 'promo_code', label: 'Promo Code', category: 'Pricing' },
    { id: 'customer_name', label: 'Customer Name', category: 'Customer' },
    { id: 'customer_email', label: 'Customer Email', category: 'Customer' },
    { id: 'customer_phone', label: 'Customer Phone', category: 'Customer' },
    { id: 'address', label: 'Pickup Address', category: 'Delivery' },
    { id: 'landmark', label: 'Landmark', category: 'Delivery' },
    { id: 'pickup_date', label: 'Pickup Date', category: 'Delivery' },
    { id: 'delivery_date', label: 'Delivery Date', category: 'Delivery' },
    { id: 'driver_name', label: 'Assigned Driver', category: 'Operations' },
    { id: 'is_priority', label: 'Priority', category: 'Operations' },
    { id: 'internal_notes', label: 'Internal Notes', category: 'Operations' },
  ];
  
  // Order detail states
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    fetchDrivers();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoading(false);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesService = serviceFilter === 'all' || order.service_type === serviceFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        matchesDate = orderDate >= today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = orderDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesStatus && matchesService && matchesDate;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    inProgress: orders.filter(o => ['confirmed', 'scheduled', 'picked_up', 'at_facility', 'cleaning', 'ready'].includes(o.status)).length,
    outForDelivery: orders.filter(o => o.status === 'out_for_delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    priority: orders.filter(o => (o as any).is_priority).length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0)
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-purple-100 text-purple-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    at_facility: 'bg-cyan-100 text-cyan-800',
    cleaning: 'bg-pink-100 text-pink-800',
    ready: 'bg-teal-100 text-teal-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusFlow = [
    'pending',
    'confirmed',
    'scheduled',
    'picked_up',
    'at_facility',
    'cleaning',
    'ready',
    'out_for_delivery',
    'delivered'
  ];

  const serviceIcons: Record<string, string> = {
    laundry: '🧺',
    suit: '🤵',
    shoe: '👟',
    'dry-clean': '👔',
    multiple: '📦'
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // Guard: out_for_delivery requires assigned driver
    const targetOrder = orders.find(o => o.id === orderId);
    const driverId = (targetOrder as any)?.driver_id;
    if (newStatus === 'out_for_delivery' && !driverId) {
      setNotification({ type: 'error', message: 'Please assign a driver before marking Out for Delivery.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setNotification({ type: 'success', message: `Order status updated to ${newStatus}` });
      loadOrders();
    } else {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    if (!user) return;
    const result = await assignDriver(orderId, driverId || null, user.id);
    if (result.success) {
      setNotification({ type: 'success', message: 'Driver assigned successfully' });
      setAssigningDriver(null);
      loadOrders();
    } else {
      setNotification({ type: 'error', message: 'Failed to assign driver' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTogglePriority = async (orderId: string, currentPriority: boolean) => {
    const result = await togglePriority(orderId, !currentPriority);
    if (result.success) {
      setNotification({ type: 'success', message: currentPriority ? 'Priority removed' : 'Marked as priority' });
      loadOrders();
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveNotes = async (orderId: string) => {
    const result = await updateInternalNotes(orderId, notesText);
    if (result.success) {
      setNotification({ type: 'success', message: 'Notes saved' });
      setEditingNotes(null);
      loadOrders();
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleViewHistory = async (orderId: string) => {
    if (showHistory === orderId) {
      setShowHistory(null);
      return;
    }
    const history = await getOrderHistory(orderId);
    setOrderHistory(history);
    setShowHistory(orderId);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    for (const orderId of selectedOrders) {
      await updateOrderStatus(orderId, newStatus);
    }
    setSelectedOrders([]);
    _setShowBulkActions(false);
    setNotification({ type: 'success', message: `${selectedOrders.length} orders updated` });
    loadOrders();
    setTimeout(() => setNotification(null), 3000);
  };

  const getExportData = () => {
    let ordersToExport: OrderWithItems[] = [];
    
    switch (exportRange) {
      case 'all':
        ordersToExport = orders;
        break;
      case 'filtered':
        ordersToExport = filteredOrders;
        break;
      case 'selected':
        ordersToExport = orders.filter(o => selectedOrders.includes(o.id));
        break;
      case 'date_range':
        ordersToExport = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          const from = exportDateFrom ? new Date(exportDateFrom) : new Date(0);
          const to = exportDateTo ? new Date(exportDateTo + 'T23:59:59') : new Date();
          return orderDate >= from && orderDate <= to;
        });
        break;
    }
    
    return ordersToExport;
  };

  const getColumnValue = (order: OrderWithItems, columnId: string): string => {
    const assignedDriver = drivers.find((d: Driver) => d.id === (order as any).driver_id);
    
    switch (columnId) {
      case 'order_number': return order.order_number || '';
      case 'date': return new Date(order.created_at).toLocaleDateString();
      case 'status': return order.status.replace(/_/g, ' ').toUpperCase();
      case 'service': return order.service_type || '';
      case 'items_count': return String(order.order_items?.length || 0);
      case 'subtotal': return String(order.subtotal || 0);
      case 'delivery_fee': return String(order.delivery_fee || 0);
      case 'discount': return String(order.discount || 0);
      case 'total': return String(order.total || 0);
      case 'promo_code': return (order as any).promo_code || '';
      case 'customer_name': return order.customer?.full_name || '';
      case 'customer_email': return order.customer?.email || '';
      case 'customer_phone': return order.customer?.phone || '';
      case 'address': return order.pickup_address || '';
      case 'landmark': return order.pickup_landmark || '';
      case 'pickup_date': return order.pickup_date || '';
      case 'delivery_date': return order.delivery_date || '';
      case 'driver_name': return assignedDriver?.name || '';
      case 'is_priority': return (order as any).is_priority ? 'Yes' : 'No';
      case 'internal_notes': return (order as any).internal_notes || '';
      default: return '';
    }
  };

  const handleExport = () => {
    const ordersToExport = getExportData();
    
    if (ordersToExport.length === 0) {
      setNotification({ type: 'error', message: 'No orders to export with current selection' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    if (exportColumns.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one column to export' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // Build header row
    const headers = exportColumns.map(colId => {
      const col = availableColumns.find(c => c.id === colId);
      return col?.label || colId;
    });
    
    // Build data rows
    const rows = ordersToExport.map(order => 
      exportColumns.map(colId => {
        const value = getColumnValue(order, colId);
        // Escape quotes and wrap in quotes if contains comma
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
    );
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${exportRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    setShowExportModal(false);
    setNotification({ type: 'success', message: `Exported ${ordersToExport.length} orders` });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const toggleExportColumn = (columnId: string) => {
    setExportColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(c => c !== columnId)
        : [...prev, columnId]
    );
  };
  
  const selectAllColumns = () => {
    setExportColumns(availableColumns.map(c => c.id));
  };
  
  const clearAllColumns = () => {
    setExportColumns([]);
  };
  
  const selectColumnsByCategory = (category: string) => {
    const categoryColumns = availableColumns.filter(c => c.category === category).map(c => c.id);
    const allSelected = categoryColumns.every(c => exportColumns.includes(c));
    
    if (allSelected) {
      setExportColumns(prev => prev.filter(c => !categoryColumns.includes(c)));
    } else {
      setExportColumns(prev => [...new Set([...prev, ...categoryColumns])]);
    }
  };

  // Removed - replaced by handleExport with modal
  const _exportOrdersLegacy = () => {
    const csv = [
      ['Order #', 'Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Service', 'Status', 'Total', 'Address'].join(','),
      ...filteredOrders.map(o => [
        o.order_number,
        new Date(o.created_at).toLocaleDateString(),
        `"${o.customer?.full_name || ''}"`,
        o.customer?.email || '',
        o.customer?.phone || '',
        o.service_type,
        o.status,
        o.total,
        `"${o.pickup_address || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-sm">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Truck className="w-4 h-4" />
            <span className="text-sm">Out for Delivery</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{stats.outForDelivery}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-700">${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e14171] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e14171]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="scheduled">Scheduled</option>
              <option value="picked_up">Picked Up</option>
              <option value="at_facility">At Facility</option>
              <option value="cleaning">Cleaning</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e14171]"
            >
              <option value="all">All Services</option>
              <option value="laundry">Laundry</option>
              <option value="suit">Suit Cleaning</option>
              <option value="shoe">Shoe Cleaning</option>
              <option value="dry-clean">Dry Cleaning</option>
              <option value="multiple">Multiple</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e14171]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button
              onClick={loadOrders}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-3 bg-[#e14171]/10 rounded-lg flex items-center justify-between">
            <span className="text-[#e14171] font-medium">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                  }
                }}
                className="px-3 py-1 border rounded-lg text-sm"
                defaultValue=""
              >
                <option value="" disabled>Update Status...</option>
                {statusFlow.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-[#e14171] mx-auto mb-4" />
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isExpanded = expandedOrder === order.id;
            const isPriority = (order as any).is_priority;
            const driverId = (order as any).driver_id;
            const internalNotes = (order as any).internal_notes;
            const assignedDriver = drivers.find((d: Driver) => d.id === driverId);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  isPriority ? 'ring-2 ring-red-400' : ''
                }`}
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedOrders(prev =>
                          prev.includes(order.id)
                            ? prev.filter(id => id !== order.id)
                            : [...prev, order.id]
                        );
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#e14171] focus:ring-[#e14171]"
                    />

                    {/* Priority Flag */}
                    {isPriority && (
                      <Flag className="w-5 h-5 text-red-500 fill-red-500" />
                    )}

                    {/* Service Icon */}
                    <span className="text-2xl">{serviceIcons[order.service_type] || '📦'}</span>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{order.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {order.customer?.full_name && (
                          <span className="text-sm text-gray-600">
                            • {order.customer.full_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {order.pickup_address}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.created_at)} {order.customer?.email && `• ${order.customer.email}`}
                      </p>
                    </div>

                    {/* Driver Badge */}
                    {assignedDriver && (
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">{assignedDriver.name}</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${order.total?.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{order.order_items?.length || 0} items</p>
                    </div>

                    {/* Expand Icon */}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => handleTogglePriority(order.id, isPriority)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                          isPriority
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Flag className="w-4 h-4" />
                        {isPriority ? 'Remove Priority' : 'Mark Priority'}
                      </button>

                      <button
                        onClick={() => setAssigningDriver(assigningDriver === order.id ? null : order.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                      >
                        <UserCheck className="w-4 h-4" />
                        {assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingNotes(editingNotes === order.id ? null : order.id);
                          setNotesText(internalNotes || '');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Notes
                      </button>

                      <button
                        onClick={() => handleViewHistory(order.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                      >
                        <History className="w-4 h-4" />
                        History
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    </div>

                    {/* Driver Assignment */}
                    {assigningDriver === order.id && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Assign Driver</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {drivers.filter((d: Driver) => d.status === 'active').map((driver: Driver) => (
                            <button
                              key={driver.id}
                              onClick={() => handleAssignDriver(order.id, driver.id)}
                              className={`p-2 rounded-lg text-left text-sm ${
                                driverId === driver.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white hover:bg-blue-100'
                              }`}
                            >
                              <p className="font-medium">{driver.name}</p>
                              <p className="text-xs opacity-75">
                                {driver.current_orders || 0}/{driver.max_orders || 10} orders
                              </p>
                            </button>
                          ))}
                          {driverId && (
                            <button
                              onClick={() => handleAssignDriver(order.id, '')}
                              className="p-2 rounded-lg text-left text-sm bg-red-50 hover:bg-red-100 text-red-700"
                            >
                              <p className="font-medium">Unassign</p>
                              <p className="text-xs">Remove driver</p>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Internal Notes */}
                    {editingNotes === order.id && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">Internal Notes (Staff Only)</h4>
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add notes about this order..."
                          className="w-full p-2 border rounded-lg text-sm"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveNotes(order.id)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                          >
                            Save Notes
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing Notes Display */}
                    {internalNotes && editingNotes !== order.id && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">Internal Notes</p>
                            <p className="text-sm text-yellow-700">{internalNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order History Timeline */}
                    {showHistory === order.id && (
                      <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-3">Order Timeline</h4>
                        <div className="space-y-3">
                          {orderHistory.length === 0 ? (
                            <p className="text-sm text-purple-600">No history available</p>
                          ) : (
                            orderHistory.map((entry, index) => (
                              <div key={entry.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${
                                    index === orderHistory.length - 1 ? 'bg-purple-500' : 'bg-purple-300'
                                  }`} />
                                  {index < orderHistory.length - 1 && (
                                    <div className="w-0.5 h-full bg-purple-200" />
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-purple-900">
                                    {entry.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                  </p>
                                  {entry.notes && (
                                    <p className="text-xs text-purple-600">{entry.notes}</p>
                                  )}
                                  <p className="text-xs text-purple-400">
                                    {formatDate(entry.created_at)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status Update Workflow */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {statusFlow.map((status, index) => {
                          const currentIndex = statusFlow.indexOf(order.status);
                          const isActive = status === order.status;
                          const isPast = index < currentIndex;
                          const isNext = index === currentIndex + 1;

                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(order.id, status)}
                              disabled={isActive}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isActive
                                  ? 'bg-[#e14171] text-white cursor-default'
                                  : isPast
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : isNext
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 ring-2 ring-blue-300'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          disabled={order.status === 'cancelled' || order.status === 'delivered'}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel Order
                        </button>
                      </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Customer Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4" /> Customer Details
                        </h4>
                        <div className="bg-white p-3 rounded-lg text-sm space-y-2">
                          <p className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <strong>Name:</strong> {order.customer?.full_name || 'N/A'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <strong>Email:</strong> 
                            <a href={`mailto:${order.customer?.email}`} className="text-[#e14171] hover:underline">
                              {order.customer?.email || 'N/A'}
                            </a>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <strong>Phone:</strong> 
                            {order.customer?.phone ? (
                              <a href={`tel:${order.customer.phone}`} className="text-[#e14171] hover:underline">
                                {order.customer.phone}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Delivery Details
                        </h4>
                        <div className="bg-white p-3 rounded-lg text-sm space-y-2">
                          <p><strong>Address:</strong> {order.pickup_address}</p>
                          {order.pickup_landmark && (
                            <p><strong>Landmark:</strong> {order.pickup_landmark}</p>
                          )}
                          <p><strong>Pickup:</strong> {order.pickup_date}</p>
                          <p><strong>Delivery:</strong> {order.delivery_date}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Items
                        </h4>
                        <div className="bg-white p-3 rounded-lg text-sm">
                          {order.order_items?.map((item, i) => (
                            <div key={i} className="flex justify-between py-1 border-b last:border-0">
                              <span>{item.item_name} x{item.quantity}</span>
                              <span className="font-medium">${item.total_price?.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between py-1 mt-2 border-t font-bold">
                            <span>Total</span>
                            <span>${order.total?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Info */}
      <div className="text-center text-sm text-gray-500">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#e14171] to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Export Orders</h3>
                  <p className="text-white/80 text-sm">Select columns and records to export</p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Record Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Select Records to Export</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setExportRange('filtered')}
                    className={`p-3 rounded-lg border text-left ${
                      exportRange === 'filtered' 
                        ? 'border-[#e14171] bg-pink-50 text-[#e14171]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium">Filtered</p>
                    <p className="text-xs text-gray-500">{filteredOrders.length} orders</p>
                  </button>
                  
                  <button
                    onClick={() => setExportRange('all')}
                    className={`p-3 rounded-lg border text-left ${
                      exportRange === 'all' 
                        ? 'border-[#e14171] bg-pink-50 text-[#e14171]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium">All Orders</p>
                    <p className="text-xs text-gray-500">{orders.length} orders</p>
                  </button>
                  
                  <button
                    onClick={() => setExportRange('selected')}
                    className={`p-3 rounded-lg border text-left ${
                      exportRange === 'selected' 
                        ? 'border-[#e14171] bg-pink-50 text-[#e14171]' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${selectedOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={selectedOrders.length === 0}
                  >
                    <p className="font-medium">Selected</p>
                    <p className="text-xs text-gray-500">{selectedOrders.length} orders</p>
                  </button>
                  
                  <button
                    onClick={() => setExportRange('date_range')}
                    className={`p-3 rounded-lg border text-left ${
                      exportRange === 'date_range' 
                        ? 'border-[#e14171] bg-pink-50 text-[#e14171]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium">Date Range</p>
                    <p className="text-xs text-gray-500">Custom dates</p>
                  </button>
                </div>
                
                {/* Date Range Inputs */}
                {exportRange === 'date_range' && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">From Date</label>
                      <input
                        type="date"
                        value={exportDateFrom}
                        onChange={(e) => setExportDateFrom(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e14171]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">To Date</label>
                      <input
                        type="date"
                        value={exportDateTo}
                        onChange={(e) => setExportDateTo(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#e14171]"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Column Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Select Columns to Export</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllColumns}
                      className="text-sm text-[#e14171] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={clearAllColumns}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Category Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Order', 'Pricing', 'Customer', 'Delivery', 'Operations'].map(category => {
                    const categoryColumns = availableColumns.filter(c => c.category === category);
                    const selectedCount = categoryColumns.filter(c => exportColumns.includes(c.id)).length;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => selectColumnsByCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          selectedCount === categoryColumns.length
                            ? 'bg-[#e14171] text-white'
                            : selectedCount > 0
                            ? 'bg-pink-100 text-[#e14171]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category} ({selectedCount}/{categoryColumns.length})
                      </button>
                    );
                  })}
                </div>
                
                {/* Column Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableColumns.map(col => (
                    <label
                      key={col.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                        exportColumns.includes(col.id) 
                          ? 'bg-pink-50 border border-[#e14171]' 
                          : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={exportColumns.includes(col.id)}
                        onChange={() => toggleExportColumn(col.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#e14171] focus:ring-[#e14171]"
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t p-4 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-500">
                {exportColumns.length} columns selected • {getExportData().length} records
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exportColumns.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-[#e14171] text-white rounded-lg hover:bg-[#c73562] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
