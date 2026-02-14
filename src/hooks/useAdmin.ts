import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
interface OrderPin {
  id: string;
  order_number: string;
  customer_name: string;
  address: string;
  landmark: string;
  status: string;
  service_type: string;
  pickup_date: string;
  pickup_time_slot: string;
  delivery_date: string;
  delivery_time_slot: string;
  total_amount: number;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
}

interface DailyStats {
  total: number;
  orders: number;
  avgOrder: number;
  growth: number;
  newCustomers: number;
}

interface ServiceBreakdown {
  service: string;
  amount: number;
  orders: number;
  color: string;
}

type RevenuePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface RecentTransaction {
  id: string;
  order_number: string;
  customer_name: string;
  amount: number;
  time: string;
  status: string;
  service_type: string;
}

interface CustomerNote {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  orders_count: number;
  total_spent: number;
  notes: string;
  preferences: string[];
  last_order: string;
  average_rating: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
  zone_id: string;
  today_pickups: number;
  today_deliveries: number;
  avg_pickup_time: number;
  avg_delivery_time: number;
  rating: number;
  on_time_rate: number;
}

interface HotZone {
  name: string;
  orders: number;
  percentage: number;
}

export interface DriverTrip {
  id: string;
  order_id: string;
  order_number?: string | null;
  customer_name?: string | null;
  trip_type: string;
  started_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
}

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map View Data
  const [orderPins, setOrderPins] = useState<OrderPin[]>([]);
  const [hotZones, setHotZones] = useState<HotZone[]>([]);
  
  // Revenue Data
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    total: 0,
    orders: 0,
    avgOrder: 0,
    growth: 0,
    newCustomers: 0
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [revenueOrders, setRevenueOrders] = useState<any[]>([]);
  
  // Customer Notes
  const [customers, setCustomers] = useState<CustomerNote[]>([]);
  
  // Drivers
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverStats, setDriverStats] = useState({
    total: 0,
    active: 0,
    todayPickups: 0,
    todayDeliveries: 0
  });

  // Fetch active orders for map view
  const fetchOrderPins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          address,
          landmark,
          status,
          service_type,
          pickup_date,
          pickup_time_slot,
          delivery_date,
          delivery_time_slot,
          total_amount,
          created_at,
          users!inner(full_name)
        `)
        .in('status', ['pending', 'confirmed', 'scheduled', 'picked_up', 'cleaning', 'ready', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order pins:', error);
        // Try without the inner join if users table join fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .in('status', ['pending', 'confirmed', 'scheduled', 'picked_up', 'cleaning', 'ready', 'out_for_delivery'])
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        
        setOrderPins(fallbackData?.map(order => ({
          ...order,
          customer_name: 'Customer'
        })) || []);
      } else {
        setOrderPins(data?.map(order => ({
          ...order,
          customer_name: (order.users as any)?.full_name || 'Customer'
        })) || []);
      }
    } catch (err: any) {
      console.error('Error fetching order pins:', err);
    }
  }, []);

  // Fetch hot zones (group orders by landmark/area)
  const fetchHotZones = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('orders')
        .select('landmark')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Group by landmark and count
      const zoneCounts: Record<string, number> = {};
      data?.forEach(order => {
        const zone = order.landmark?.split(',')[0]?.trim() || 'Unknown Area';
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      });

      const totalOrders = Object.values(zoneCounts).reduce((a, b) => a + b, 0);
      const zones = Object.entries(zoneCounts)
        .map(([name, orders]) => ({
          name,
          orders,
          percentage: totalOrders > 0 ? Math.round((orders / totalOrders) * 100) : 0
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      setHotZones(zones);
    } catch (err: any) {
      console.error('Error fetching hot zones:', err);
    }
  }, []);

  // Fetch revenue statistics
  const fetchRevenueStats = useCallback(async (
    period: RevenuePeriod = 'today',
    range?: { start: string; end: string }
  ) => {
    try {
      const revenueStatuses = ['delivered', 'completed', 'closed'];
      const now = new Date();
      let startDate = new Date(now);
      let endDate = new Date(now);
      let previousStartDate = new Date(now);
      let previousEndDate = new Date(now);

      if (period === 'custom' && range?.start && range?.end) {
        startDate = new Date(range.start);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(range.end);
        endDate.setHours(23, 59, 59, 999);
      } else {
        switch (period) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        }
      }

      // previous period (same length)
      const periodLength = endDate.getTime() - startDate.getTime();
      previousEndDate = new Date(startDate);
      previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1);
      previousStartDate = new Date(previousEndDate.getTime() - periodLength);

      // Helper to safely read order total
      const getOrderTotal = (order: any) =>
        Number(
          order.total ??
          order.total_amount ??
          ((Number(order.subtotal) || 0) + (Number(order.delivery_fee) || 0) - (Number(order.discount) || 0))
        ) || 0;

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      const startDateOnly = startISO.slice(0, 10);
      const endDateOnly = endISO.slice(0, 10);
      const prevStartISO = previousStartDate.toISOString();
      const prevEndISO = previousEndDate.toISOString();
      const prevStartDateOnly = prevStartISO.slice(0, 10);
      const prevEndDateOnly = prevEndISO.slice(0, 10);

      // Get current period orders (delivery_date window OR created_at fallback), exclude cancelled
      const { data: currentOrders, error: currentError } = await supabase
        .from('orders')
        .select('*')
        .or(
          `and(delivery_date.gte.${startDateOnly},delivery_date.lte.${endDateOnly}),` +
          `and(delivery_date.is.null,created_at.gte.${startISO},created_at.lte.${endISO})`
        )
        .neq('status', 'cancelled');

      if (currentError) throw currentError;

      // Get previous period orders for growth calculation
      const { data: previousOrders, error: previousError } = await supabase
        .from('orders')
        .select('total_amount, total, subtotal, delivery_fee, discount')
        .or(
          `and(delivery_date.gte.${prevStartDateOnly},delivery_date.lte.${prevEndDateOnly}),` +
          `and(delivery_date.is.null,created_at.gte.${prevStartISO},created_at.lte.${prevEndISO})`
        )
        .neq('status', 'cancelled');

      if (previousError) throw previousError;

      // Get new customers (users created in this period)
      const { data: newUsers } = await supabase
        .from('users')
        .select('id')
        .gte('created_at', startDate.toISOString());

      // Calculate stats
      const total = currentOrders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
      const safeTotal = currentOrders?.reduce((sum, order) => sum + getOrderTotal(order), 0) || 0;
      const ordersCount = currentOrders?.length || 0;
      const avgOrder = ordersCount > 0 ? safeTotal / ordersCount : 0;
      
      const previousTotal = previousOrders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
      const growth = previousTotal > 0 ? ((safeTotal - previousTotal) / previousTotal) * 100 : 0;

      setDailyStats({
        total: safeTotal,
        orders: ordersCount,
        avgOrder,
        growth: Math.round(growth * 10) / 10,
        newCustomers: newUsers?.length || 0
      });
      setRevenueOrders(currentOrders || []);

      // Calculate service breakdown (auto-create buckets)
      const breakdown: Record<string, { amount: number; orders: number }> = {};

      currentOrders?.forEach(order => {
        const rawService = (order.service_type || 'other').toString();
        const normalized =
          rawService === 'dry-clean' || rawService === 'dry_clean' ? 'dryclean' : rawService;
        if (!breakdown[normalized]) {
          breakdown[normalized] = { amount: 0, orders: 0 };
        }
        breakdown[normalized].amount += getOrderTotal(order);
        breakdown[normalized].orders += 1;
      });

      const colors: Record<string, string> = {
        laundry: 'bg-[#e14171]',
        suit: 'bg-gray-800',
        shoe: 'bg-pink-400',
        dryclean: 'bg-gray-600',
        other: 'bg-gray-400'
      };

      const labels: Record<string, string> = {
        laundry: 'Laundry Services',
        suit: 'Suit Cleaning',
        shoe: 'Shoe Cleaning',
        dryclean: 'Dry Cleaning',
        other: 'Other'
      };

      setServiceBreakdown(
        Object.entries(breakdown).map(([key, value]) => ({
          service: labels[key] || key,
          amount: value.amount,
          orders: value.orders,
          color: colors[key] || 'bg-gray-400'
        }))
      );

    } catch (err: any) {
      console.error('Error fetching revenue stats:', err);
    }
  }, []);

  // Fetch recent transactions
  const fetchRecentTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          service_type,
          created_at,
          users(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        // Fallback without user join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (fallbackError) throw fallbackError;
        
        setRecentTransactions(fallbackData?.map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: 'Customer',
          amount: order.total_amount || 0,
          time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: order.status,
          service_type: order.service_type
        })) || []);
      } else {
        setRecentTransactions(data?.map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: (order.users as any)?.full_name || 'Customer',
          amount: order.total_amount || 0,
          time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: order.status,
          service_type: order.service_type
        })) || []);
      }
    } catch (err: any) {
      console.error('Error fetching recent transactions:', err);
    }
  }, []);

  // Fetch customers with their order stats and notes
  const fetchCustomers = useCallback(async (searchQuery?: string) => {
    try {
      // Get all users with their preferences
      let query = supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          created_at,
          user_preferences(
            detergent_type,
            fabric_softener,
            water_temp,
            folding_style,
            drying_heat,
            default_packaging,
            shirts_hung,
            pants_creased
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: users, error: usersError } = await query;

      if (usersError) throw usersError;

      // For each user, get their order stats
      const customersWithStats = await Promise.all(
        (users || []).map(async (user) => {
          // Get order count and total spent
          const { data: orders } = await supabase
            .from('orders')
            .select('id, total_amount, created_at, status')
            .eq('user_id', user.id)
            .neq('status', 'cancelled');

          const ordersCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
          const lastOrder = orders?.[0]?.created_at;

          // Get customer notes
          const { data: notes } = await supabase
            .from('customer_notes')
            .select('note')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          // Get reviews
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('user_id', user.id);

          const avgRating = reviews?.length 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;

          // Build preferences array
          const prefs: string[] = [];
          const userPrefs = (user.user_preferences as any)?.[0];
          const formatLabel = (value?: string | null) =>
            value ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null;

          if (userPrefs) {
            if (userPrefs.detergent_type) prefs.push(`${formatLabel(userPrefs.detergent_type)} detergent`);
            if (userPrefs.fabric_softener) prefs.push('Fabric softener');
            if (userPrefs.water_temp) prefs.push(`${formatLabel(userPrefs.water_temp)} water`);
            if (userPrefs.folding_style) prefs.push(`${formatLabel(userPrefs.folding_style)} fold`);
            if (userPrefs.drying_heat) prefs.push(`${formatLabel(userPrefs.drying_heat)} dry`);
            if (userPrefs.default_packaging) prefs.push(`${formatLabel(userPrefs.default_packaging)} packaging`);
            if (userPrefs.shirts_hung) prefs.push('Shirts hung');
            if (userPrefs.pants_creased) prefs.push('Pants creased');
          }

          return {
            id: user.id,
            user_id: user.id,
            name: user.full_name || 'Unknown',
            email: user.email || '',
            phone: user.phone || '',
            orders_count: ordersCount,
            total_spent: totalSpent,
            notes: notes?.note || '',
            preferences: prefs,
            last_order: lastOrder ? getRelativeTime(new Date(lastOrder)) : 'Never',
            average_rating: Math.round(avgRating * 10) / 10
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  // Add or update customer note
  const updateCustomerNote = async (userId: string, note: string) => {
    try {
      // Check if note exists
      const { data: existing } = await supabase
        .from('customer_notes')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (existing) {
        // Update existing note
        const { error } = await supabase
          .from('customer_notes')
          .update({ note, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new note
        const { error } = await supabase
          .from('customer_notes')
          .insert({ user_id: userId, note });
        
        if (error) throw error;
      }

      // Refresh customers
      await fetchCustomers();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating customer note:', err);
      return { success: false, message: err.message };
    }
  };

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      const { data: driversData, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get today's trips for each driver
      const today = new Date().toISOString().split('T')[0];
      
      const driversWithStats = await Promise.all(
        (driversData || []).map(async (driver) => {
          const { data: trips } = await supabase
            .from('driver_trips')
            .select('*')
            .eq('driver_id', driver.id)
            .gte('started_at', today);

          const pickups = trips?.filter(t => t.trip_type === 'pickup').length || 0;
          const deliveries = trips?.filter(t => t.trip_type === 'delivery').length || 0;

          // Calculate average times
          const completedTrips = trips?.filter(t => t.completed_at) || [];
          const pickupTrips = completedTrips.filter(t => t.trip_type === 'pickup');
          const avgPickupTime = pickupTrips.length > 0
            ? pickupTrips.reduce((sum, t) => {
                const start = new Date(t.started_at!).getTime();
                const end = new Date(t.completed_at!).getTime();
                return sum + (end - start) / 60000; // minutes
              }, 0) / pickupTrips.length
            : 20;

          // On-time rate (computed if trips exist, else fall back to column/default)
          const slaPickupMins = 30;
          const slaDeliveryMins = 45;
          const completedWithSLA = completedTrips.length > 0
            ? completedTrips.filter(t => {
                const duration = (new Date(t.completed_at!).getTime() - new Date(t.started_at!).getTime()) / 60000;
                return t.trip_type === 'pickup'
                  ? duration <= slaPickupMins
                  : duration <= slaDeliveryMins;
              })
            : [];
          const computedOnTime = completedTrips.length > 0
            ? Math.round((completedWithSLA.length / completedTrips.length) * 100)
            : (driver.on_time_rate as number) || 95;

          return {
            id: driver.id,
            name: driver.name,
            phone: driver.phone || '',
            status: driver.status || 'offline',
            zone_id: driver.zone_id || '',
            today_pickups: pickups,
            today_deliveries: deliveries,
            avg_pickup_time: Math.round(avgPickupTime),
            avg_delivery_time: Math.round(avgPickupTime * 1.2), // Estimate
            rating: driver.rating || 4.5,
            on_time_rate: computedOnTime
          };
        })
      );

      setDrivers(driversWithStats);

      // Calculate driver stats
      const activeDrivers = driversWithStats.filter(d => d.status === 'active').length;
      const totalPickups = driversWithStats.reduce((sum, d) => sum + d.today_pickups, 0);
      const totalDeliveries = driversWithStats.reduce((sum, d) => sum + d.today_deliveries, 0);

      setDriverStats({
        total: driversWithStats.length,
        active: activeDrivers,
        todayPickups: totalPickups,
        todayDeliveries: totalDeliveries
      });

    } catch (err: any) {
      console.error('Error fetching drivers:', err);
    }
  }, []);

  // Add new driver
  const addDriver = async (driverData: { name: string; phone: string; zone_id?: string }) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .insert({
          ...driverData,
          status: 'offline',
          rating: 5.0,
          on_time_rate: 100
        });

      if (error) throw error;
      
      await fetchDrivers();
      return { success: true };
    } catch (err: any) {
      console.error('Error adding driver:', err);
      return { success: false, message: err.message };
    }
  };

  // Fetch trips for a driver (recent, optional date filter)
  const fetchDriverTrips = useCallback(
    async (driverId: string, dateFrom?: string, dateTo?: string): Promise<DriverTrip[]> => {
      try {
        let query = supabase
          .from('driver_trips')
          .select(`
            *,
            orders:order_id (
              order_number,
              users:users!orders_user_id_fkey(full_name)
            )
          `)
          .eq('driver_id', driverId)
          .order('started_at', { ascending: false })
          .limit(100);

        if (dateFrom) query = query.gte('started_at', dateFrom);
        if (dateTo) query = query.lte('started_at', dateTo);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(trip => {
          const duration =
            trip.started_at && trip.completed_at
              ? (new Date(trip.completed_at).getTime() - new Date(trip.started_at).getTime()) / 60000
              : null;
          return {
            id: trip.id,
            order_id: trip.order_id,
            order_number: (trip as any).orders?.order_number || null,
            customer_name: (trip as any).orders?.users?.full_name || null,
            trip_type: trip.trip_type,
            started_at: trip.started_at,
            completed_at: trip.completed_at,
            duration_minutes: duration ? Math.round(duration * 10) / 10 : null
          };
        });
      } catch (err) {
        console.error('Error fetching driver trips:', err);
        return [];
      }
    },
    []
  );

  // Update driver status
  const updateDriverStatus = async (driverId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status })
        .eq('id', driverId);

      if (error) throw error;
      
      await fetchDrivers();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating driver status:', err);
      return { success: false, message: err.message };
    }
  };

  // Helper function for relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  // Fetch all data on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchOrderPins(),
          fetchHotZones(),
          fetchRevenueStats('today'),
          fetchRecentTransactions(),
          fetchCustomers(),
          fetchDrivers()
        ]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [fetchOrderPins, fetchHotZones, fetchRevenueStats, fetchRecentTransactions, fetchCustomers, fetchDrivers]);

  return {
    loading,
    error,
    // Map View
    orderPins,
    hotZones,
    fetchOrderPins,
    fetchHotZones,
    // Revenue
    dailyStats,
    revenueOrders,
    serviceBreakdown,
    recentTransactions,
    fetchRevenueStats,
    fetchRecentTransactions,
    // Customers
    customers,
    fetchCustomers,
    updateCustomerNote,
    // Drivers
    drivers,
    driverStats,
    fetchDrivers,
    addDriver,
    updateDriverStatus,
    fetchDriverTrips
  };
}
