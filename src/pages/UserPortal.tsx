import { useState, useEffect, useRef } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Settings,
  Gift,
  History,
  ChevronRight,
  MapPin,
  Truck,
  Sparkles,
  CheckCircle,
  RefreshCw,
  Copy,
  Share2,
  User,
  Bell,
  Droplets,
  Shirt,
  Loader2,
  X,
  Download,
  Printer,
  XCircle,
  AlertTriangle,
  Plus,
  Home,
  Briefcase,
  Star,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders, OrderWithItems } from '../hooks/useOrders';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useReferrals } from '../hooks/useReferrals';
import { useAddresses, Address } from '../hooks/useAddresses';
import { AuthModal } from '../components/AuthModal';

// Receipt Modal Component
function ReceiptModal({ order, onClose }: { order: OrderWithItems; onClose: () => void }) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${order.order_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #e14171; }
              .order-number { color: #666; margin-top: 5px; }
              .section { margin-bottom: 20px; }
              .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              .item { display: flex; justify-content: space-between; padding: 5px 0; }
              .item-name { color: #333; }
              .item-price { color: #333; }
              .total-section { border-top: 2px solid #333; padding-top: 15px; margin-top: 15px; }
              .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .status { display: inline-block; padding: 5px 15px; border-radius: 15px; font-size: 12px; }
              .status-delivered { background: #d4edda; color: #155724; }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-cancelled { background: #f8d7da; color: #721c24; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const content = `
THE BUBBLE BOX
====================
Order Receipt
${order.order_number}
${new Date(order.created_at).toLocaleDateString()}

Status: ${order.status.toUpperCase()}

ITEMS
--------------------
${order.order_items?.map(item => 
  `${item.item_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} x${item.quantity} - $${item.total_price.toFixed(2)}`
).join('\n') || 'No items'}

${order.order_addons?.length ? `ADD-ONS
--------------------
${order.order_addons.map(addon => 
  `${addon.addon_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - $${addon.price.toFixed(2)}`
).join('\n')}
` : ''}
SUMMARY
--------------------
Subtotal: $${order.subtotal.toFixed(2)}
Delivery Fee: $${order.delivery_fee.toFixed(2)}
${order.discount > 0 ? `Discount: -$${order.discount.toFixed(2)}` : ''}
${order.applied_credit && order.applied_credit > 0 ? `Credits Applied: -$${order.applied_credit.toFixed(2)}` : ''}
--------------------
TOTAL PAID: $${order.total.toFixed(2)}

Thank you for choosing The Bubble Box!
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatItemName = (itemName: string) => {
    return itemName
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900">Order Receipt</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-6">
          {/* Header */}
          <div className="header text-center border-b-2 border-dashed border-gray-200 pb-6 mb-6">
            <div className="logo text-2xl font-bold text-[#e14171] mb-1">The Bubble Box</div>
            <p className="text-gray-500 text-sm">Premium Laundry Services</p>
            <p className="order-number text-gray-600 mt-3 font-medium">{order.order_number}</p>
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <div className={`status inline-block mt-3 px-4 py-1 rounded-full text-sm font-medium ${
              order.status === 'delivered'
                ? 'status-delivered bg-green-100 text-green-700'
                : order.status === 'cancelled'
                ? 'status-cancelled bg-red-100 text-red-700'
                : 'status-pending bg-yellow-100 text-yellow-700'
            }`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
            </div>
          </div>

          {/* Service Type */}
          <div className="section mb-6">
            <div className="section-title font-semibold text-gray-900 mb-2 pb-2 border-b">Service</div>
            <p className="text-gray-700 capitalize">{order.service_type.replace('-', ' ')} Service</p>
          </div>

          {/* Items */}
          <div className="section mb-6">
            <div className="section-title font-semibold text-gray-900 mb-3 pb-2 border-b">Items</div>
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-2">
                {order.order_items.map((item, index) => (
                  <div key={item.id || index} className="item flex justify-between py-1">
                    <span className="item-name text-gray-700">
                      {formatItemName(item.item_name)} x{item.quantity}
                    </span>
                    <span className="item-price text-gray-900 font-medium">
                      ${item.total_price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No items recorded</p>
            )}
          </div>

          {/* Add-ons */}
          {order.order_addons && order.order_addons.length > 0 && (
            <div className="section mb-6">
              <div className="section-title font-semibold text-gray-900 mb-3 pb-2 border-b">Add-ons</div>
              <div className="space-y-2">
                {order.order_addons.map((addon, index) => (
                  <div key={addon.id || index} className="item flex justify-between py-1">
                    <span className="item-name text-gray-700">
                      {addon.addon_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="item-price text-gray-900 font-medium">
                      ${addon.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferences */}
          {order.order_preferences && (
            <div className="section mb-6">
              <div className="section-title font-semibold text-gray-900 mb-3 pb-2 border-b">Preferences</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {order.order_preferences.detergent_type && (
                  <p><span className="text-gray-500">Detergent:</span> <span className="capitalize">{order.order_preferences.detergent_type}</span></p>
                )}
                {order.order_preferences.folding_style && (
                  <p><span className="text-gray-500">Folding:</span> <span className="capitalize">{order.order_preferences.folding_style}</span></p>
                )}
                {order.order_preferences.water_temp && (
                  <p><span className="text-gray-500">Water:</span> <span className="capitalize">{order.order_preferences.water_temp}</span></p>
                )}
                {order.order_preferences.packaging_type && (
                  <p><span className="text-gray-500">Packaging:</span> <span className="capitalize">{order.order_preferences.packaging_type}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Delivery Details */}
          <div className="section mb-6">
            <div className="section-title font-semibold text-gray-900 mb-3 pb-2 border-b">Delivery Details</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{order.pickup_address}</span>
              </div>
              {order.pickup_landmark && (
                <p className="text-gray-500 ml-6">Landmark: {order.pickup_landmark}</p>
              )}
              <div className="flex justify-between mt-2">
                <span className="text-gray-500">Pickup Date:</span>
                <span>{order.pickup_date || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Date:</span>
                <span>{order.delivery_date || 'TBD'}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="total-section border-t-2 border-gray-300 pt-4">
            <div className="space-y-2">
              <div className="item flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="item flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="text-gray-900">${order.delivery_fee.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="item flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.applied_credit && order.applied_credit > 0 && (
                <div className="item flex justify-between text-[#e14171]">
                  <span>Credits Applied</span>
                  <span>- ${order.applied_credit.toFixed(2)}</span>
                </div>
              )}
              <div className="total flex justify-between text-lg font-bold pt-3 border-t mt-3">
                <span className="text-gray-900">Total Paid</span>
                <span className="text-[#e14171]">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer text-center mt-8 text-gray-500 text-sm">
            <p>Thank you for choosing The Bubble Box!</p>
            <p className="mt-1">Questions? Contact us at support@bubblebox.com</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#e14171] text-white rounded-xl hover:bg-[#c73562] font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

// Cancel Order Modal Component
function CancelOrderModal({ 
  order, 
  onClose, 
  onConfirm, 
  loading 
}: { 
  order: OrderWithItems; 
  onClose: () => void; 
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Order?</h3>
          <p className="text-gray-600">
            Are you sure you want to cancel order <span className="font-semibold">{order.order_number}</span>?
          </p>
        </div>

        {/* Order Summary */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Service</span>
              <span className="capitalize">{order.service_type.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Items</span>
              <span>{order.order_items?.length || 0} item(s)</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-700">Total</span>
              <span className="text-[#e14171]">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If you've already paid, your payment will be refunded within 3-5 business days.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Cancel Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Active Tracking Component
function ActiveTracking() {
  const { user } = useAuth();
  const { loading, getActiveOrders, subscribeToOrderUpdates, fetchOrders } = useOrders(user?.id);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const activeOrders = getActiveOrders();
  const activeOrder = activeOrders.find(o => o.id === selectedOrderId) || activeOrders[0];
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!selectedOrderId && activeOrders.length > 0) {
      setSelectedOrderId(activeOrders[0].id);
    }
  }, [activeOrders, selectedOrderId]);

  // Live sync with admin updates
  useEffect(() => {
    if (!activeOrder) return;
    const unsubscribe = subscribeToOrderUpdates(activeOrder.id, () => {
      fetchOrders();
    });
    return () => unsubscribe();
  }, [activeOrder?.id, subscribeToOrderUpdates, fetchOrders]);

  const statusOrder = [
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

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    scheduled: 'Scheduled',
    picked_up: 'Picked Up',
    at_facility: 'At Facility',
    cleaning: 'Being Cleaned',
    ready: 'Ready for Delivery',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered'
  };

  const orderStatus = activeOrder ? (() => {
    const idx = statusOrder.indexOf(activeOrder.status);
    const currentIndex = idx >= 0 ? idx : 0;
    const progress = Math.max(0, Math.min(1, currentIndex / (statusOrder.length - 1)));

    const doneAtOrAfter = (minStatus: string) => {
      const a = statusOrder.indexOf(activeOrder.status);
      const b = statusOrder.indexOf(minStatus);
      return a >= b && b >= 0;
    };

    const isCurrent = (status: string) => activeOrder.status === status;

    return {
      orderId: activeOrder.order_number,
      status: activeOrder.status,
      statusLabel: statusLabels[activeOrder.status] || activeOrder.status,
      progress,
      items: `Order #${activeOrder.order_number}`,
      pickup: activeOrder.pickup_date || 'Pending',
      estimatedDelivery: activeOrder.delivery_date || 'Pending',
      steps: [
        {
          id: 'placed',
          label: 'Order Placed',
          time: new Date(activeOrder.created_at).toLocaleString(),
          done: true,
          current: activeOrder.status === 'pending'
        },
        {
          id: 'pickup',
          label: 'Picked Up',
          time: doneAtOrAfter('picked_up') ? 'Completed' : '',
          done: doneAtOrAfter('picked_up'),
          current: isCurrent('picked_up')
        },
        {
          id: 'facility',
          label: 'At Facility',
          time: '',
          done: doneAtOrAfter('at_facility'),
          current: isCurrent('at_facility')
        },
        {
          id: 'cleaning',
          label: 'Being Cleaned',
          time: '',
          done: doneAtOrAfter('cleaning'),
          current: isCurrent('cleaning')
        },
        {
          id: 'ready',
          label: 'Ready for Delivery',
          time: '',
          done: doneAtOrAfter('ready'),
          current: isCurrent('ready')
        },
        {
          id: 'delivery',
          label: 'Out for Delivery',
          time: '',
          done: doneAtOrAfter('out_for_delivery'),
          current: isCurrent('out_for_delivery')
        },
        {
          id: 'delivered',
          label: 'Delivered',
          time: '',
          done: doneAtOrAfter('delivered'),
          current: isCurrent('delivered')
        },
      ]
    };
  })() : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
      </div>
    );
  }

  if (!orderStatus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
          <button
            onClick={async () => {
              setRefreshing(true);
              await fetchOrders();
              setRefreshing(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Orders</h3>
          <p className="text-gray-600 mb-6">You don't have any orders in progress.</p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-[#e14171] text-white px-6 py-3 rounded-full font-medium hover:bg-[#c73562]"
          >
            Place an Order
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={async () => {
              setRefreshing(true);
              await fetchOrders();
              setRefreshing(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          {activeOrders.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {activeOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`px-3 py-2 rounded-full border text-sm ${
                    activeOrder?.id === o.id
                      ? 'bg-[#e14171] text-white border-[#e14171]'
                      : 'border-gray-200 text-gray-700 hover:border-[#e14171]'
                  }`}
                >
                  {(o.order_number || o.id.slice(0, 6))} • {o.status.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-semibold text-gray-900">{orderStatus.orderId}</p>
          </div>
          <div className="bg-pink-100 text-[#e14171] px-4 py-2 rounded-full font-medium">
            {orderStatus.statusLabel}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Picked Up</span>
            <span>Est. Delivery</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#e14171] rounded-full" style={{ width: `${orderStatus.progress * 100}%` }}></div>
          </div>
          <div className="flex justify-between text-sm font-medium mt-2">
            <span>{orderStatus.pickup}</span>
            <span>{orderStatus.estimatedDelivery}</span>
          </div>
        </div>

        <div className="space-y-4">
          {orderStatus.steps.map((step, idx) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.done
                      ? 'bg-green-500 text-white'
                      : step.current
                      ? 'bg-[#e14171] text-white animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : step.current ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <span className="text-xs">{idx + 1}</span>
                  )}
                </div>
                {idx < orderStatus.steps.length - 1 && (
                  <div className={`w-0.5 h-8 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className={`font-medium ${step.done || step.current ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {step.time && (
                  <p className={`text-sm ${step.current ? 'text-[#e14171]' : 'text-gray-500'}`}>
                    {step.time}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
        
        {/* Items in the order */}
        {activeOrder?.order_items && activeOrder.order_items.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Items ({activeOrder.order_items.length})</p>
            <div className="space-y-2">
              {activeOrder.order_items.map((item, index) => (
                <div key={item.id || index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#e14171]" />
                    <span className="text-gray-700 capitalize">
                      {item.item_name.replace(/_/g, ' ').replace(/-/g, ' ')}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{activeOrder?.pickup_address || 'Address not available'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">Standard Delivery</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-lg text-[#e14171]">${activeOrder?.total.toFixed(2)}</span>
          </div>
        </div>
        {activeOrder && (
          <div className="mt-4 space-y-2">
            <a
              href={`mailto:support@bubblebox.com?subject=${encodeURIComponent(
                `Support request for Order ${activeOrder.order_number}`
              )}&body=${encodeURIComponent(
                `Hi Bubble Box Support,%0D%0A%0D%0A` +
                `I need help with order ${activeOrder.order_number}.%0D%0A` +
                `Status: ${activeOrder.status}%0D%0A` +
                `Pickup: ${activeOrder.pickup_date || 'n/a'}%0D%0A` +
                `Delivery: ${activeOrder.delivery_date || 'n/a'}%0D%0A%0D%0A` +
                `Please describe your issue here...`
              )}`}
              className="block w-full text-center py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
            >
              Contact Support
            </a>
            <p className="text-xs text-gray-500 text-center">
              If your email app doesn’t open, email <span className="font-medium text-gray-700">support@bubblebox.com</span> and include order <span className="font-semibold">{activeOrder.order_number}</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Preference Center Component
function PreferenceCenter() {
  const { user } = useAuth();
  const { preferences, loading, updatePreferences } = useUserPreferences(user?.id);
  const [saving, setSaving] = useState(false);
  const [localPrefs, setLocalPrefs] = useState({
    detergent: 'standard',
    softener: true,
    waterTemp: 'cold',
    dryingHeat: 'low',
    foldingStyle: 'square',
    shirtsHung: false,
    pantsCreased: false,
    notifications: {
      whatsapp: true,
      email: true,
      sms: false
    },
    defaultPackaging: 'plastic'
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        detergent: preferences.detergent_type || 'standard',
        softener: preferences.fabric_softener ?? true,
        waterTemp: preferences.water_temp || 'cold',
        dryingHeat: preferences.drying_heat || 'low',
        foldingStyle: preferences.folding_style || 'square',
        shirtsHung: preferences.shirts_hung ?? false,
        pantsCreased: preferences.pants_creased ?? false,
        notifications: {
          whatsapp: preferences.notification_whatsapp ?? true,
          email: preferences.notification_email ?? true,
          sms: preferences.notification_sms ?? false
        },
        defaultPackaging: preferences.default_packaging || 'plastic'
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    await updatePreferences({
      detergent_type: localPrefs.detergent as 'standard' | 'hypoallergenic' | 'eco',
      fabric_softener: localPrefs.softener,
      water_temp: localPrefs.waterTemp as 'cold' | 'warm',
      drying_heat: localPrefs.dryingHeat as 'low' | 'medium',
      folding_style: localPrefs.foldingStyle as 'square' | 'kondo' | 'rolled',
      shirts_hung: localPrefs.shirtsHung,
      pants_creased: localPrefs.pantsCreased,
      notification_whatsapp: localPrefs.notifications.whatsapp,
      notification_email: localPrefs.notifications.email,
      notification_sms: localPrefs.notifications.sms,
      default_packaging: localPrefs.defaultPackaging as 'plastic' | 'paper' | 'reusable'
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Preference Center</h2>
      <p className="text-gray-600">Set your default preferences. These will be applied to all future orders.</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Droplets className="h-5 w-5 text-[#e14171]" />
            Cleaning Preferences
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Detergent</label>
              <select
                value={localPrefs.detergent}
                onChange={(e) => setLocalPrefs({ ...localPrefs, detergent: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
              >
                <option value="standard">Standard (Premium Scented)</option>
                <option value="hypoallergenic">Hypoallergenic (Scent-free)</option>
                <option value="eco">Eco-Friendly (Plant-based)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Water Temperature</label>
                <select
                  value={localPrefs.waterTemp}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, waterTemp: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                >
                  <option value="cold">Cold (Color safe)</option>
                  <option value="warm">Warm (For whites)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Drying Heat</label>
                <select
                  value={localPrefs.dryingHeat}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, dryingHeat: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                >
                  <option value="low">Low (Prevents shrinking)</option>
                  <option value="medium">Medium/High</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.softener}
                onChange={(e) => setLocalPrefs({ ...localPrefs, softener: e.target.checked })}
                className="w-5 h-5 rounded text-[#e14171]"
              />
              <span className="text-gray-700">Add fabric softener by default</span>
            </label>
          </div>
        </div>

        <hr />

        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shirt className="h-5 w-5 text-[#e14171]" />
            Finishing Preferences
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Folding Style</label>
              <select
                value={localPrefs.foldingStyle}
                onChange={(e) => setLocalPrefs({ ...localPrefs, foldingStyle: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
              >
                <option value="square">Square Fold (Classic)</option>
                <option value="kondo">Marie Kondo (Vertical)</option>
                <option value="rolled">Rolled (For travel)</option>
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.shirtsHung}
                onChange={(e) => setLocalPrefs({ ...localPrefs, shirtsHung: e.target.checked })}
                className="w-5 h-5 rounded text-[#e14171]"
              />
              <div>
                <span className="text-gray-700">Shirts on hangers by default</span>
                <span className="text-sm text-gray-500 block">+$1 per shirt</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.pantsCreased}
                onChange={(e) => setLocalPrefs({ ...localPrefs, pantsCreased: e.target.checked })}
                className="w-5 h-5 rounded text-[#e14171]"
              />
              <span className="text-gray-700">Crease pants/trousers by default</span>
            </label>
          </div>
        </div>

        <hr />

        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#e14171]" />
            Notification Preferences
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.notifications.whatsapp}
                onChange={(e) => setLocalPrefs({ 
                  ...localPrefs, 
                  notifications: { ...localPrefs.notifications, whatsapp: e.target.checked }
                })}
                className="w-5 h-5 rounded text-[#e14171]"
              />
              <span className="text-gray-700">WhatsApp updates</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.notifications.email}
                onChange={(e) => setLocalPrefs({ 
                  ...localPrefs, 
                  notifications: { ...localPrefs.notifications, email: e.target.checked }
                })}
                className="w-5 h-5 rounded text-[#e14171]"
              />
              <span className="text-gray-700">Email notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.notifications.sms}
                onChange={(e) => setLocalPrefs({ 
                  ...localPrefs, 
                  notifications: { ...localPrefs.notifications, sms: e.target.checked }
                })}
                className="w-5 h-5 rounded text-[#e14171]"
              />
              <span className="text-gray-700">SMS notifications</span>
            </label>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// Order History Component
function OrderHistory() {
  const { user } = useAuth();
  const { orders, loading, cancelOrder } = useOrders(user?.id);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderWithItems | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderWithItems | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setCancelling(true);
    
    try {
      const result = await cancelOrder(orderToCancel.id);
      
      if (result.success) {
        setNotification({ type: 'success', message: result.message });
        setOrderToCancel(null);
      } else {
        setNotification({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      setNotification({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setCancelling(false);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleReorder = (order: OrderWithItems) => {
    // Store order details in sessionStorage for the booking page to use
    sessionStorage.setItem('reorderData', JSON.stringify({
      serviceType: order.service_type,
      items: order.order_items,
      preferences: order.order_preferences,
      addons: order.order_addons
    }));
    navigate('/booking');
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed', 'scheduled'].includes(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-gray-600 mb-6">Your order history will appear here.</p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-[#e14171] text-white px-6 py-3 rounded-full font-medium hover:bg-[#c73562]"
          >
            Place Your First Order
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  const formatItemName = (itemName: string) => {
    return itemName
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'laundry': return '🧺';
      case 'suit': return '🤵';
      case 'shoe': return '👟';
      case 'dry-clean': return '👔';
      case 'multiple': return '📦';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Order History</h2>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <p>{notification.message}</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Order Header */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getServiceIcon(order.service_type)}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-600'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-pink-100 text-[#e14171]'
                  }`}>
                    {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 capitalize">{order.service_type.replace('-', ' ')} Service</p>
                  <p className="text-sm text-gray-500">
                    {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Expanded Order Details */}
            {expandedOrder === order.id && (
              <div className="border-t border-gray-100">
                {/* Items List */}
                <div className="p-6 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-4">Items in this Order</h4>
                  
                  {order.order_items && order.order_items.length > 0 ? (
                    <div className="space-y-3">
                      {order.order_items.map((item, index) => (
                        <div key={item.id || index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-[#e14171]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{formatItemName(item.item_name)}</p>
                              <p className="text-sm text-gray-500 capitalize">{item.item_type.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">${item.total_price.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No items recorded</p>
                  )}

                  {/* Addons */}
                  {order.order_addons && order.order_addons.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">Add-ons</h5>
                      <div className="flex flex-wrap gap-2">
                        {order.order_addons.map((addon, index) => (
                          <span key={addon.id || index} className="px-3 py-1 bg-pink-100 text-[#e14171] rounded-full text-sm">
                            {addon.addon_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (+${addon.price})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Preferences */}
                  {order.order_preferences && (
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2">Preferences</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {order.order_preferences.detergent_type && (
                          <p><span className="text-gray-500">Detergent:</span> <span className="capitalize">{order.order_preferences.detergent_type}</span></p>
                        )}
                        {order.order_preferences.folding_style && (
                          <p><span className="text-gray-500">Folding:</span> <span className="capitalize">{order.order_preferences.folding_style}</span></p>
                        )}
                        {order.order_preferences.water_temp && (
                          <p><span className="text-gray-500">Water:</span> <span className="capitalize">{order.order_preferences.water_temp}</span></p>
                        )}
                        {order.order_preferences.packaging_type && (
                          <p><span className="text-gray-500">Packaging:</span> <span className="capitalize">{order.order_preferences.packaging_type}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">Price Breakdown</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>${order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Fee</span>
                        <span>${order.delivery_fee.toFixed(2)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-${order.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.applied_credit && order.applied_credit > 0 && (
                        <div className="flex justify-between text-[#e14171]">
                          <span>Credits Applied</span>
                          <span>- ${order.applied_credit.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total Paid</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 flex flex-wrap gap-3 border-t">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorder(order);
                    }}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reorder
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReceiptOrder(order);
                    }}
                    className="flex-1 min-w-[140px] px-4 py-3 text-[#e14171] border border-[#e14171] rounded-xl hover:bg-pink-50 font-medium transition-colors"
                  >
                    View Receipt
                  </button>
                  {canCancelOrder(order.status) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderToCancel(order);
                      }}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 font-medium transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal 
          order={selectedReceiptOrder} 
          onClose={() => setSelectedReceiptOrder(null)} 
        />
      )}

      {/* Cancel Order Modal */}
      {orderToCancel && (
        <CancelOrderModal
          order={orderToCancel}
          onClose={() => setOrderToCancel(null)}
          onConfirm={handleCancelOrder}
          loading={cancelling}
        />
      )}
    </div>
  );
}

// Saved Addresses Component
function SavedAddresses() {
  const { addresses, loading, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    landmark: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_default: false
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      label: '',
      address: '',
      landmark: '',
      latitude: null,
      longitude: null,
      is_default: false
    });
    setModalError(null);
    setGeoError(null);
  };

  const openAddModal = () => {
    resetForm();
    setEditingAddress(null);
    setShowAddModal(true);
  };

  const openEditModal = (address: Address) => {
    setFormData({
      label: address.label,
      address: address.address,
      landmark: address.landmark,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      is_default: address.is_default
    });
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.address) {
      setModalError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setModalError(null);
    
    try {
      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.id, formData);
      } else {
        result = await addAddress(formData);
      }

      if (result.success) {
        setNotification({ type: 'success', message: result.message });
        setShowAddModal(false);
        resetForm();
        setEditingAddress(null);
      } else {
        // Show error in modal instead of behind it
        setModalError(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setModalError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const fillWithCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported in this browser.');
      return;
    }
    if (!window.isSecureContext) {
      setGeoError('Location requires HTTPS or localhost. Please open the site over https:// or http://localhost.');
      return;
    }

    setGeoError(null);
    setGeoLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&email=dev@bubblebox.com`;
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'bubblebox-app/1.0' } });
      const data = await res.json();

      const display = data?.display_name as string | undefined;
      const landmark =
        data?.address?.suburb ||
        data?.address?.neighbourhood ||
        data?.address?.city ||
        data?.address?.road ||
        '';

      setFormData((prev) => ({
        ...prev,
        address: display || `Pinned location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        landmark: prev.landmark || landmark,
        latitude,
        longitude,
      }));
    } catch (error: any) {
      console.error('Geo error', error);
      if (error?.code === 1) {
        setGeoError('Permission denied. Allow location (browser lock icon) then try again.');
      } else if (error?.code === 2) {
        setGeoError('Position unavailable. Check connection/GPS and retry.');
      } else if (error?.code === 3) {
        setGeoError('Timed out fetching location. Please retry.');
      } else {
        setGeoError(error?.message || 'Unable to fetch current location. Please allow location access.');
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    setDeleting(addressId);
    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        setNotification({ type: 'success', message: result.message });
      } else {
        setNotification({ type: 'error', message: result.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete address' });
    } finally {
      setDeleting(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        setNotification({ type: 'success', message: 'Default address updated' });
      } else {
        setNotification({ type: 'error', message: result.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to set default address' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const getLabelIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return <Home className="h-5 w-5" />;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return <Briefcase className="h-5 w-5" />;
    return <MapPin className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Address
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <p>{notification.message}</p>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Addresses</h3>
          <p className="text-gray-600 mb-6">Add your first address to speed up checkout.</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#e14171] text-white px-6 py-3 rounded-full font-medium hover:bg-[#c73562]"
          >
            <Plus className="h-5 w-5" />
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${
                address.is_default ? 'border-[#e14171]' : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    address.is_default ? 'bg-pink-100 text-[#e14171]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getLabelIcon(address.label)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{address.label}</h3>
                      {address.is_default && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-[#e14171] rounded-full text-xs font-medium">
                          <Star className="h-3 w-3 fill-current" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{address.address}</p>
                    {address.landmark && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Landmark:</span> {address.landmark}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="p-2 text-gray-400 hover:text-[#e14171] hover:bg-pink-50 rounded-lg transition-colors"
                      title="Set as default"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(address)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={deleting === address.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === address.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Error message inside modal */}
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Error saving address</p>
                    <p className="text-sm text-red-600 mt-1">{modalError}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  {['Home', 'Work', 'Other'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({ ...formData, label })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.label === label
                          ? 'bg-[#e14171] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Or enter custom label..."
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mb-2 text-sm">
                  <button
                    type="button"
                    onClick={fillWithCurrentLocation}
                    className="flex items-center gap-2 text-[#e14171] font-medium hover:underline disabled:text-gray-400"
                    disabled={geoLoading}
                  >
                    {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    Use my current location
                  </button>
                  {geoError && <span className="text-red-500 text-xs">{geoError}</span>}
                </div>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your full address"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
                {(formData.latitude !== null && formData.longitude !== null) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Saved pin: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Landmark
                </label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="e.g., Near the Red Mosque, 2nd floor"
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5 rounded text-[#e14171]"
                />
                <span className="text-gray-700">Set as default address</span>
              </label>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.label || !formData.address}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#e14171] text-white rounded-xl hover:bg-[#c73562] font-medium transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                {editingAddress ? 'Save Changes' : 'Add Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Completed orders list
function CompletedOrders() {
  const { user } = useAuth();
  const { orders, loading } = useOrders(user?.id);
  const navigate = useNavigate();

  const completed = orders.filter(o => o.status === 'delivered').sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
      </div>
    );
  }

  if (completed.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Completed Orders</h2>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed orders yet</h3>
          <p className="text-gray-600 mb-6">Once your orders are delivered, they will appear here.</p>
          <button
            onClick={() => navigate('/booking')}
            className="inline-flex items-center gap-2 bg-[#e14171] text-white px-6 py-3 rounded-full font-medium hover:bg-[#c73562]"
          >
            Book a Pickup
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Completed Orders</h2>
      <div className="space-y-4">
        {completed.map(order => (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{order.order_number}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-500 capitalize mt-1">{order.service_type.replace('-', ' ')} Service</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">Delivered</span>
                <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {order.order_items && order.order_items.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  {order.order_items.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full">
                      {item.item_name.replace(/_/g, ' ')} x{item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Referral Program Component
function ReferralProgram() {
  const { 
    referralCode, 
    referrals, 
    stats,
    referrerBonus,
    refereeBonus,
    loading,
    copyCode,
    shareOnWhatsApp,
    getShareUrl
  } = useReferrals();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyCode = async () => {
    const success = await copyCode();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Referral Program</h2>

      <div className="bg-gradient-to-r from-[#e14171] to-pink-600 rounded-2xl p-8 text-white">
        <div className="text-center mb-6">
          <Gift className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">
            Give ${refereeBonus.toFixed(0)}, Get ${referrerBonus.toFixed(0)}
          </h3>
          <p className="text-pink-100">
            Share your code with friends. When they complete their first order, you both get credit!
          </p>
        </div>

        <div className="bg-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-pink-100">Your referral code</p>
              <p className="text-2xl font-bold">{referralCode?.code || 'Loading...'}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Copy className="h-5 w-5" />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          
          {/* Share Options */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {linkCopied ? 'Link Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Your Stats</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
            <p className="text-sm text-gray-500">Friends Referred</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">${stats.totalEarned.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Earned</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-[#e14171]">${stats.creditBalance.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Available</p>
          </div>
        </div>

        {/* Pending vs Completed */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
            <p className="text-sm text-yellow-700">Pending (waiting for first order)</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-2xl font-bold text-green-600">{stats.completedReferrals}</p>
            <p className="text-sm text-green-700">Completed</p>
          </div>
        </div>

        {referrals.length > 0 && (
          <>
            <h4 className="font-medium text-gray-900 mb-3">Recent Referrals</h4>
            <div className="space-y-3">
              {referrals.slice(0, 5).map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ref.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <User className={`h-5 w-5 ${
                        ref.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {ref.referee?.full_name || `Friend #${ref.referee_id.slice(0, 6)}`}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      ref.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ref.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    <p className="font-medium mt-1">
                      {ref.status === 'completed' ? `+$${ref.referrer_credit_amount}` : 'Waiting...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {referrals.length === 0 && (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No referrals yet. Share your code to start earning!</p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-[#e14171] font-bold">1</div>
            <div>
              <p className="font-medium text-gray-900">Share your code</p>
              <p className="text-sm text-gray-500">Send your unique code to friends and family</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-[#e14171] font-bold">2</div>
            <div>
              <p className="font-medium text-gray-900">Friend signs up</p>
              <p className="text-sm text-gray-500">
                They get ${refereeBonus.toFixed(2)} credit instantly when they use your code
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-[#e14171] font-bold">3</div>
            <div>
              <p className="font-medium text-gray-900">You earn ${referrerBonus.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                When they complete their first order, you get credit too!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Portal Component
export function UserPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { stats } = useReferrals();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const totalCredits = user ? stats.creditBalance : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e14171]" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access your account and track your orders.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signin"
        />
      </>
    );
  }

  const menuItems = [
    { path: '/portal', label: 'Active Orders', icon: Package },
    { path: '/portal/completed', label: 'Completed Orders', icon: CheckCircle },
    { path: '/portal/addresses', label: 'My Addresses', icon: MapPin },
    { path: '/portal/preferences', label: 'Preferences', icon: Settings },
    { path: '/portal/history', label: 'Order History', icon: History },
    { path: '/portal/referrals', label: 'Referral Program', icon: Gift },
  ];

  const isActive = (path: string) => location.pathname === path;
  const userName = profile?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#e14171] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">Credit Balance</p>
                <p className="text-2xl font-bold text-[#e14171]">${totalCredits.toFixed(2)}</p>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive(item.path)
                        ? 'bg-pink-50 text-[#e14171]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </button>
                ))}
              </nav>
            </div>

            <Link
              to="/booking"
              className="block w-full py-3 bg-[#e14171] text-white text-center rounded-xl font-medium hover:bg-[#c73562] transition-colors"
            >
              New Order
            </Link>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route path="/" element={<ActiveTracking />} />
              <Route path="/completed" element={<CompletedOrders />} />
              <Route path="/addresses" element={<SavedAddresses />} />
              <Route path="/preferences" element={<PreferenceCenter />} />
              <Route path="/history" element={<OrderHistory />} />
              <Route path="/referrals" element={<ReferralProgram />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
