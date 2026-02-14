import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, OrderPreferences, OrderAddon } from '../types/database';

// Customer info type
export interface CustomerInfo {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

// Extended order type with related items
export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  order_preferences: OrderPreferences | null;
  order_addons: OrderAddon[];
  customer?: CustomerInfo | null;
  applied_credit?: number;
}

interface CreateOrderData {
  serviceType: 'laundry' | 'suit' | 'shoe' | 'dry-clean' | 'multiple';
  items: {
    itemType: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
  }[];
  preferences: {
    detergentType?: 'standard' | 'hypoallergenic' | 'eco';
    fabricSoftener?: boolean;
    waterTemp?: 'cold' | 'warm';
    dryingHeat?: 'low' | 'medium';
    foldingStyle?: 'square' | 'kondo' | 'rolled';
    shirtsHung?: boolean;
    pantsCreased?: boolean;
    dropoffInstructions?: string;
    customDropoffInstruction?: string;
    packagingType?: 'plastic' | 'paper' | 'reusable';
    notificationStyle?: 'whatsapp' | 'sms' | 'quiet';
  };
  addons: {
    stainTreatment?: boolean;
    whitening?: boolean;
    scentBoosters?: boolean;
    repairs?: boolean;
    stainNote?: string;
  };
  pickupAddress: string;
  pickupLandmark?: string;
  pickupSlotId?: string;
  deliverySlotId?: string;
  pickupDate?: string;
  deliveryDate?: string;
  paymentMethod: 'card' | 'cash' | 'wallet';
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  promoCode?: string | null;
  total: number;
}

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper: upsert driver trip start
  const startTrip = async (orderId: string, driverId: string | null, tripType: 'pickup' | 'delivery') => {
    if (!driverId) return;
    // If there's an open trip of this type for the order, just ensure driver + started_at
    const { data: existing } = await supabase
      .from('driver_trips')
      .select('id')
      .eq('order_id', orderId)
      .eq('trip_type', tripType)
      .is('completed_at', null)
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('driver_trips')
        .update({ driver_id: driverId, started_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('driver_trips')
        .insert({
          order_id: orderId,
          driver_id: driverId,
          trip_type: tripType,
          started_at: new Date().toISOString()
        });
    }
  };

  // Helper: complete open trip
  const completeTrip = async (orderId: string, tripType: 'pickup' | 'delivery') => {
    await supabase
      .from('driver_trips')
      .update({ completed_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .eq('trip_type', tripType)
      .is('completed_at', null);
  };

  // Fetch all orders for a user with their items
  const fetchOrders = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch orders with related items, preferences, and addons
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_preferences (*),
          order_addons (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch credits that were applied to these orders (source_id = order id)
      const orderIds = (data || []).map(o => o.id);
      let creditsUsedByOrder: Record<string, number> = {};

      if (orderIds.length > 0) {
        const { data: creditRows, error: creditsError } = await supabase
          .from('user_credits')
          .select('source_id, amount, type, source_type')
          .in('source_id', orderIds)
          .eq('source_type', 'order');

        if (!creditsError && creditRows) {
          creditsUsedByOrder = creditRows.reduce<Record<string, number>>((acc, row) => {
            if (row.source_id) {
              const amt = Number(row.amount) || 0;
              const applied =
                row.type === 'used' && amt > 0
                  ? amt // positive "used" means a debit of amt
                  : amt < 0
                  ? Math.abs(amt) // negative amount is a debit recorded as negative
                  : 0;
              acc[row.source_id] = (acc[row.source_id] || 0) + applied;
            }
            return acc;
          }, {});
        }
      }
      
      // Transform the data to ensure proper structure
      const ordersWithItems: OrderWithItems[] = (data || []).map(order => ({
        ...order,
        order_items: order.order_items || [],
        order_preferences: order.order_preferences?.[0] || order.order_preferences || null,
        order_addons: order.order_addons || [],
        applied_credit: creditsUsedByOrder[order.id] || 0
      }));
      
      setOrders(ordersWithItems);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single order with details
  const fetchOrderDetails = async (orderId: string) => {
    try {
      const [orderResult, itemsResult, prefsResult, addonsResult] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('order_preferences').select('*').eq('order_id', orderId).single(),
        supabase.from('order_addons').select('*').eq('order_id', orderId)
      ]);

      if (orderResult.error) throw orderResult.error;

      return {
        order: orderResult.data as Order,
        items: (itemsResult.data || []) as OrderItem[],
        preferences: prefsResult.data as OrderPreferences | null,
        addons: (addonsResult.data || []) as OrderAddon[]
      };
    } catch (err) {
      throw err;
    }
  };

  // Create new order
  const createOrder = async (data: CreateOrderData) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Generate order number
      const orderNumber = `BB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Format dates properly
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          order_number: orderNumber,
          service_type: data.serviceType,
          status: 'pending',
          subtotal: data.subtotal,
          delivery_fee: data.deliveryFee,
          discount: data.discount || 0,
          promo_code: data.promoCode || null,
          total: data.total,
          pickup_address: data.pickupAddress,
          pickup_landmark: data.pickupLandmark || null,
          pickup_date: data.pickupDate || tomorrow.toISOString().split('T')[0],
          delivery_date: data.deliveryDate || dayAfter.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // 2. Create order items
      if (data.items.length > 0) {
        const orderItems = data.items.map(item => ({
          order_id: order.id,
          item_type: item.itemType,
          item_name: item.itemName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Order items error:', itemsError);
          throw new Error(`Failed to add items: ${itemsError.message}`);
        }
      }

      // 3. Create order preferences (only if we have preferences data)
      const prefsData: Record<string, unknown> = {
        order_id: order.id,
        fabric_softener: data.preferences.fabricSoftener || false,
        shirts_hung: data.preferences.shirtsHung || false,
        pants_creased: data.preferences.pantsCreased || false
      };
      
      // Only add optional fields if they have values
      if (data.preferences.detergentType) prefsData.detergent_type = data.preferences.detergentType;
      if (data.preferences.waterTemp) prefsData.water_temp = data.preferences.waterTemp;
      if (data.preferences.dryingHeat) prefsData.drying_heat = data.preferences.dryingHeat;
      if (data.preferences.foldingStyle) prefsData.folding_style = data.preferences.foldingStyle;
      if (data.preferences.dropoffInstructions) prefsData.dropoff_instructions = data.preferences.dropoffInstructions;
      if (data.preferences.customDropoffInstruction) prefsData.custom_dropoff_instruction = data.preferences.customDropoffInstruction;
      if (data.preferences.packagingType) prefsData.packaging_type = data.preferences.packagingType;
      if (data.preferences.notificationStyle) prefsData.notification_style = data.preferences.notificationStyle;

      const { error: prefsError } = await supabase
        .from('order_preferences')
        .insert(prefsData);

      if (prefsError) {
        console.error('Order preferences error:', prefsError);
        throw new Error(`Failed to save preferences: ${prefsError.message}`);
      }

      // 4. Create addons
      const addons: { order_id: string; addon_type: string; price: number; notes?: string }[] = [];
      if (data.addons.stainTreatment) {
        addons.push({ order_id: order.id, addon_type: 'stain_treatment', price: 3, notes: data.addons.stainNote });
      }
      if (data.addons.whitening) {
        addons.push({ order_id: order.id, addon_type: 'whitening', price: 4 });
      }
      if (data.addons.scentBoosters) {
        addons.push({ order_id: order.id, addon_type: 'scent_boosters', price: 3 });
      }
      if (data.addons.repairs) {
        addons.push({ order_id: order.id, addon_type: 'repairs', price: 5 });
      }

      if (addons.length > 0) {
        const { error: addonsError } = await supabase
          .from('order_addons')
          .insert(addons);

        if (addonsError) {
          console.error('Order addons error:', addonsError);
          throw new Error(`Failed to add addons: ${addonsError.message}`);
        }
      }

      // 5. Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          user_id: userId,
          amount: data.total,
          payment_method: data.paymentMethod,
          status: data.paymentMethod === 'cash' ? 'pending' : 'authorized'
        });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }

      // 6. Create initial status history
      const { error: statusError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Order placed'
        });

      if (statusError) {
        console.error('Status history error:', statusError);
        throw new Error(`Failed to record status: ${statusError.message}`);
      }

      // Refresh orders list
      await fetchOrders();

      return order;
    } catch (err) {
      throw err;
    }
  };

  // Get active order (most recent non-delivered)
  const getActiveOrder = (): OrderWithItems | undefined => {
    return orders.find(o => !['delivered', 'cancelled'].includes(o.status));
  };

  // Get all active (non-delivered / non-cancelled) orders
  const getActiveOrders = (): OrderWithItems[] => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  };

  // Cancel an order
  const cancelOrder = async (orderId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'You must be logged in to cancel an order' };

    try {
      // First check if order can be cancelled (only pending or confirmed orders)
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      
      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // Check if order can be cancelled
      const cancellableStatuses = ['pending', 'confirmed', 'scheduled'];
      if (!cancellableStatuses.includes(order.status)) {
        return { 
          success: false, 
          message: `Cannot cancel order. Order is already "${order.status}". Only pending, confirmed, or scheduled orders can be cancelled.` 
        };
      }

      // Update order status to cancelled
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Add to status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'cancelled',
          notes: 'Cancelled by customer'
        });

      // If there was a payment, update it to refunded
      await supabase
        .from('payments')
        .update({ 
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      // Refresh orders list
      await fetchOrders();

      return { success: true, message: 'Order cancelled successfully. Any payment will be refunded.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order';
      return { success: false, message };
    }
  };

  // Fetch ALL orders (for admin/staff) with customer details
  const fetchAllOrders = async () => {
    try {
      // Step 1: Fetch all orders with related items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_preferences (*),
          order_addons (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Step 2: Get unique user IDs from orders
      const userIds = [...new Set(ordersData.map(o => o.user_id).filter(Boolean))];
      
      // Step 3: Fetch customer details separately
      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name, phone')
          .in('id', userIds);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else if (usersData) {
          usersData.forEach(user => {
            userMap.set(user.id, user);
          });
        }
      }

      // Step 4: Combine orders with customer info
      const ordersWithItems: OrderWithItems[] = ordersData.map(order => ({
        ...order,
        order_items: order.order_items || [],
        order_preferences: order.order_preferences?.[0] || order.order_preferences || null,
        order_addons: order.order_addons || [],
        customer: userMap.get(order.user_id) || null
      }));
      
      return ordersWithItems;
    } catch (err) {
      console.error('Error fetching all orders:', err);
      return [];
    }
  };

  // Award referral bonus when a referee completes their first order
  const awardReferralBonusIfEligible = async (orderId: string) => {
    try {
      // 1) Get order + user
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('id', orderId)
        .single();

      if (orderErr || !order?.user_id) return;

      // 2) Ensure this is the referee's first delivered order
      const { count: deliveredCount } = await supabase
        .from('orders')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', order.user_id)
        .eq('status', 'delivered');

      if ((deliveredCount ?? 0) > 1) return; // already rewarded on a previous order

      // 3) Find the referral record for this referee
      const { data: referral, error: referralErr } = await supabase
        .from('referrals')
        .select('*')
        .eq('referee_id', order.user_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (referralErr || !referral) return;
      if (referral.referrer_credited) return; // already paid out

      // Use dynamic setting at time of credit; fall back to referral row then default 10
      // We store the amount on the referral when created; if missing, use settings
      let bonusAmount = referral.referrer_credit_amount || 0;
      if (!bonusAmount || bonusAmount <= 0) {
        // Fetch setting on the fly
        const { data: setting } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'referral_referrer_bonus')
          .single();
        bonusAmount = setting ? parseFloat(setting.value) || 10 : 10;
      }

      // 4) Credit the referrer
      await supabase.from('user_credits').insert({
        user_id: referral.referrer_id,
        amount: bonusAmount,
        type: 'referral_bonus',
        description: `Referral bonus for order ${order.id}`,
        reference_id: referral.id
      });

      // 5) Mark referral as completed/credited
      await supabase
        .from('referrals')
        .update({
          status: 'completed',
          referrer_credited: true,
          referrer_credit_amount: bonusAmount,
          completed_at: new Date().toISOString()
        })
        .eq('id', referral.id);
    } catch (err) {
      console.error('Error awarding referral bonus:', err);
    }
  };

  // Update order status (for admin/staff)
  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    try {
      // Fetch order to get driver_id for trip tracking
      const { data: orderRow, error: fetchError } = await supabase
        .from('orders')
        .select('id, driver_id')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      const driverId = (orderRow as any)?.driver_id || null;

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Add to status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: newStatus,
          notes: notes || `Status updated to ${newStatus}`
        });

      if (historyError) throw historyError;

      // Trip tracking
      if (newStatus === 'picked_up') {
        await startTrip(orderId, driverId, 'pickup');
      }
      if (newStatus === 'at_facility') {
        await completeTrip(orderId, 'pickup');
      }
      if (newStatus === 'out_for_delivery') {
        await startTrip(orderId, driverId, 'delivery');
      }
      if (newStatus === 'delivered') {
        await completeTrip(orderId, 'delivery');
      }

      // Award referral bonus when the order is delivered
      if (newStatus === 'delivered') {
        await awardReferralBonusIfEligible(orderId);
      }

      return { success: true, message: 'Order status updated' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      return { success: false, message };
    }
  };

  // Subscribe to order updates (real-time)
  const subscribeToOrderUpdates = (orderId: string, callback: (order: Order) => void) => {
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          callback(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  // Assign driver to order
  const assignDriver = async (orderId: string, driverId: string | null, assignedBy: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          assigned_at: driverId ? new Date().toISOString() : null,
          assigned_by: driverId ? assignedBy : null
        })
        .eq('id', orderId);

      if (error) throw error;

      // Add to status history
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: driverId ? 'driver_assigned' : 'driver_unassigned',
        notes: driverId ? `Driver assigned` : 'Driver unassigned',
        changed_by: assignedBy
      });

      // Start pickup trip stub on assignment so it shows in driver report
      if (driverId) {
        await startTrip(orderId, driverId, 'pickup');
      }

      return { success: true };
    } catch (err) {
      console.error('Error assigning driver:', err);
      return { success: false, error: err };
    }
  };

  // Toggle priority
  const togglePriority = async (orderId: string, isPriority: boolean) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ is_priority: isPriority })
        .eq('id', orderId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error toggling priority:', err);
      return { success: false, error: err };
    }
  };

  // Update internal notes
  const updateInternalNotes = async (orderId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ internal_notes: notes })
        .eq('id', orderId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error updating notes:', err);
      return { success: false, error: err };
    }
  };

  // Get order status history
  const getOrderHistory = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching order history:', err);
      return [];
    }
  };

  // Record actual pickup/delivery time
  const recordActualTime = async (orderId: string, type: 'pickup' | 'delivery') => {
    try {
      const field = type === 'pickup' ? 'actual_pickup_time' : 'actual_delivery_time';
      const { error } = await supabase
        .from('orders')
        .update({ [field]: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error recording time:', err);
      return { success: false, error: err };
    }
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchAllOrders,
    fetchOrderDetails,
    createOrder,
    getActiveOrder,
    getActiveOrders,
    cancelOrder,
    updateOrderStatus,
    subscribeToOrderUpdates,
    assignDriver,
    togglePriority,
    updateInternalNotes,
    getOrderHistory,
    recordActualTime
  };
}
