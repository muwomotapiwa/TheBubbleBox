// Database types for The Bubble Box
// These types match the Supabase database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // 1. Users table
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string | null;
          full_name: string;
          avatar_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 2. User addresses
      user_addresses: {
        Row: {
          id: string;
          user_id: string;
          address: string;
          landmark: string | null;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          address: string;
          landmark?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          address?: string;
          landmark?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          label?: string | null;
          created_at?: string;
        };
      };

      // 3. Service zones
      service_zones: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          driver_capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          driver_capacity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          driver_capacity?: number;
          created_at?: string;
        };
      };

      // 4. Orders
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: 'pending' | 'confirmed' | 'picked_up' | 'at_facility' | 'cleaning' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
          service_type: 'laundry' | 'suit' | 'shoe' | 'dry-clean' | 'multiple';
          subtotal: number;
          delivery_fee: number;
          discount: number;
          total: number;
          estimated_weight: number | null;
          actual_weight: number | null;
          pickup_address: string;
          pickup_landmark: string | null;
          pickup_slot_id: string | null;
          delivery_slot_id: string | null;
          pickup_date: string | null;
          delivery_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number?: string;
          status?: 'pending' | 'confirmed' | 'picked_up' | 'at_facility' | 'cleaning' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
          service_type: 'laundry' | 'suit' | 'shoe' | 'dry-clean' | 'multiple';
          subtotal: number;
          delivery_fee?: number;
          discount?: number;
          total: number;
          estimated_weight?: number | null;
          actual_weight?: number | null;
          pickup_address: string;
          pickup_landmark?: string | null;
          pickup_slot_id?: string | null;
          delivery_slot_id?: string | null;
          pickup_date?: string | null;
          delivery_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: 'pending' | 'confirmed' | 'picked_up' | 'at_facility' | 'cleaning' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
          service_type?: 'laundry' | 'suit' | 'shoe' | 'dry-clean' | 'multiple';
          subtotal?: number;
          delivery_fee?: number;
          discount?: number;
          total?: number;
          estimated_weight?: number | null;
          actual_weight?: number | null;
          pickup_address?: string;
          pickup_landmark?: string | null;
          pickup_slot_id?: string | null;
          delivery_slot_id?: string | null;
          pickup_date?: string | null;
          delivery_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 5. Order items
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_type: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_type: string;
          item_name: string;
          quantity?: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_type?: string;
          item_name?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
      };

      // 6. Order preferences
      order_preferences: {
        Row: {
          id: string;
          order_id: string;
          detergent_type: 'standard' | 'hypoallergenic' | 'eco' | null;
          fabric_softener: boolean;
          water_temp: 'cold' | 'warm' | null;
          drying_heat: 'low' | 'medium' | null;
          folding_style: 'square' | 'kondo' | 'rolled' | null;
          shirts_hung: boolean;
          pants_creased: boolean;
          dropoff_instructions: string | null;
          custom_dropoff_instruction: string | null;
          packaging_type: 'plastic' | 'paper' | 'reusable' | null;
          notification_style: 'whatsapp' | 'sms' | 'quiet' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          detergent_type?: 'standard' | 'hypoallergenic' | 'eco' | null;
          fabric_softener?: boolean;
          water_temp?: 'cold' | 'warm' | null;
          drying_heat?: 'low' | 'medium' | null;
          folding_style?: 'square' | 'kondo' | 'rolled' | null;
          shirts_hung?: boolean;
          pants_creased?: boolean;
          dropoff_instructions?: string | null;
          custom_dropoff_instruction?: string | null;
          packaging_type?: 'plastic' | 'paper' | 'reusable' | null;
          notification_style?: 'whatsapp' | 'sms' | 'quiet' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          detergent_type?: 'standard' | 'hypoallergenic' | 'eco' | null;
          fabric_softener?: boolean;
          water_temp?: 'cold' | 'warm' | null;
          drying_heat?: 'low' | 'medium' | null;
          folding_style?: 'square' | 'kondo' | 'rolled' | null;
          shirts_hung?: boolean;
          pants_creased?: boolean;
          dropoff_instructions?: string | null;
          custom_dropoff_instruction?: string | null;
          packaging_type?: 'plastic' | 'paper' | 'reusable' | null;
          notification_style?: 'whatsapp' | 'sms' | 'quiet' | null;
          created_at?: string;
        };
      };

      // 7. Order addons
      order_addons: {
        Row: {
          id: string;
          order_id: string;
          addon_type: 'stain_treatment' | 'whitening' | 'scent_boosters' | 'repairs';
          price: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          addon_type: 'stain_treatment' | 'whitening' | 'scent_boosters' | 'repairs';
          price: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          addon_type?: 'stain_treatment' | 'whitening' | 'scent_boosters' | 'repairs';
          price?: number;
          notes?: string | null;
          created_at?: string;
        };
      };

      // 8. Order status history
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          notes: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          notes?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          notes?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
      };

      // 9. Time slots
      time_slots: {
        Row: {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          zone_id: string | null;
          capacity: number;
          booked_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          start_time: string;
          end_time: string;
          zone_id?: string | null;
          capacity?: number;
          booked_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          zone_id?: string | null;
          capacity?: number;
          booked_count?: number;
          created_at?: string;
        };
      };

      // 10. Payments
      payments: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          amount: number;
          payment_method: 'card' | 'cash' | 'wallet';
          status: 'pending' | 'authorized' | 'completed' | 'refunded' | 'failed';
          gateway_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          amount: number;
          payment_method: 'card' | 'cash' | 'wallet';
          status?: 'pending' | 'authorized' | 'completed' | 'refunded' | 'failed';
          gateway_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          amount?: number;
          payment_method?: 'card' | 'cash' | 'wallet';
          status?: 'pending' | 'authorized' | 'completed' | 'refunded' | 'failed';
          gateway_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 11. User preferences
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          detergent_type: 'standard' | 'hypoallergenic' | 'eco';
          fabric_softener: boolean;
          water_temp: 'cold' | 'warm';
          drying_heat: 'low' | 'medium';
          folding_style: 'square' | 'kondo' | 'rolled';
          shirts_hung: boolean;
          pants_creased: boolean;
          default_packaging: 'plastic' | 'paper' | 'reusable';
          notification_whatsapp: boolean;
          notification_email: boolean;
          notification_sms: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          detergent_type?: 'standard' | 'hypoallergenic' | 'eco';
          fabric_softener?: boolean;
          water_temp?: 'cold' | 'warm';
          drying_heat?: 'low' | 'medium';
          folding_style?: 'square' | 'kondo' | 'rolled';
          shirts_hung?: boolean;
          pants_creased?: boolean;
          default_packaging?: 'plastic' | 'paper' | 'reusable';
          notification_whatsapp?: boolean;
          notification_email?: boolean;
          notification_sms?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          detergent_type?: 'standard' | 'hypoallergenic' | 'eco';
          fabric_softener?: boolean;
          water_temp?: 'cold' | 'warm';
          drying_heat?: 'low' | 'medium';
          folding_style?: 'square' | 'kondo' | 'rolled';
          shirts_hung?: boolean;
          pants_creased?: boolean;
          default_packaging?: 'plastic' | 'paper' | 'reusable';
          notification_whatsapp?: boolean;
          notification_email?: boolean;
          notification_sms?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 12. Subscriptions
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: 'basic' | 'bubble_pass' | 'family_pass';
          billing_cycle: 'monthly' | 'yearly';
          status: 'active' | 'paused' | 'cancelled' | 'expired';
          started_at: string;
          ends_at: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: 'basic' | 'bubble_pass' | 'family_pass';
          billing_cycle: 'monthly' | 'yearly';
          status?: 'active' | 'paused' | 'cancelled' | 'expired';
          started_at?: string;
          ends_at?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: 'basic' | 'bubble_pass' | 'family_pass';
          billing_cycle?: 'monthly' | 'yearly';
          status?: 'active' | 'paused' | 'cancelled' | 'expired';
          started_at?: string;
          ends_at?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 13. Referral codes
      referral_codes: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          uses_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          uses_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          uses_count?: number;
          created_at?: string;
        };
      };

      // 14. Referrals
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referee_id: string;
          code_used: string;
          status: 'pending' | 'completed' | 'expired';
          referrer_credit: number;
          referee_credit: number;
          credited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referee_id: string;
          code_used: string;
          status?: 'pending' | 'completed' | 'expired';
          referrer_credit?: number;
          referee_credit?: number;
          credited_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referee_id?: string;
          code_used?: string;
          status?: 'pending' | 'completed' | 'expired';
          referrer_credit?: number;
          referee_credit?: number;
          credited_at?: string | null;
          created_at?: string;
        };
      };

      // 15. User credits
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: 'referral' | 'promo' | 'refund' | 'admin';
          source_id: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: 'referral' | 'promo' | 'refund' | 'admin';
          source_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: 'referral' | 'promo' | 'refund' | 'admin';
          source_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };

      // 16. Drivers
      drivers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          phone: string;
          email: string | null;
          status: 'active' | 'break' | 'offline';
          zone_id: string | null;
          vehicle_info: string | null;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          phone: string;
          email?: string | null;
          status?: 'active' | 'break' | 'offline';
          zone_id?: string | null;
          vehicle_info?: string | null;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          phone?: string;
          email?: string | null;
          status?: 'active' | 'break' | 'offline';
          zone_id?: string | null;
          vehicle_info?: string | null;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 17. Driver trips
      driver_trips: {
        Row: {
          id: string;
          driver_id: string;
          order_id: string;
          trip_type: 'pickup' | 'delivery';
          started_at: string | null;
          completed_at: string | null;
          distance_km: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          order_id: string;
          trip_type: 'pickup' | 'delivery';
          started_at?: string | null;
          completed_at?: string | null;
          distance_km?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          order_id?: string;
          trip_type?: 'pickup' | 'delivery';
          started_at?: string | null;
          completed_at?: string | null;
          distance_km?: number | null;
          created_at?: string;
        };
      };

      // 18. Order photos
      order_photos: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string | null;
          photo_type: 'pickup' | 'delivery' | 'damage';
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          driver_id?: string | null;
          photo_type: 'pickup' | 'delivery' | 'damage';
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          driver_id?: string | null;
          photo_type?: 'pickup' | 'delivery' | 'damage';
          url?: string;
          created_at?: string;
        };
      };

      // 19. Promo codes
      promo_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          max_uses: number | null;
          uses_count: number;
          min_order_value: number | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          max_uses?: number | null;
          uses_count?: number;
          min_order_value?: number | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: 'percentage' | 'fixed';
          discount_value?: number;
          max_uses?: number | null;
          uses_count?: number;
          min_order_value?: number | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };

      // 20. Reviews
      reviews: {
        Row: {
          id: string;
          user_id: string;
          order_id: string;
          rating: number;
          text: string | null;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id: string;
          rating: number;
          text?: string | null;
          is_approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string;
          rating?: number;
          text?: string | null;
          is_approved?: boolean;
          created_at?: string;
        };
      };

      // 21. Customer notes (Admin blackbook)
      customer_notes: {
        Row: {
          id: string;
          user_id: string;
          note: string;
          added_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note: string;
          added_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          note?: string;
          added_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 22. Notification logs
      notification_logs: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          channel: 'whatsapp' | 'sms' | 'email';
          message_type: string;
          status: 'sent' | 'delivered' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          channel: 'whatsapp' | 'sms' | 'email';
          message_type: string;
          status?: 'sent' | 'delivered' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string | null;
          channel?: 'whatsapp' | 'sms' | 'email';
          message_type?: string;
          status?: 'sent' | 'delivered' | 'failed';
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types for easier usage
export type User = Database['public']['Tables']['users']['Row'];
export type UserAddress = Database['public']['Tables']['user_addresses']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type OrderPreferences = Database['public']['Tables']['order_preferences']['Row'];
export type OrderAddon = Database['public']['Tables']['order_addons']['Row'];
export type TimeSlot = Database['public']['Tables']['time_slots']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type ReferralCode = Database['public']['Tables']['referral_codes']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type Driver = Database['public']['Tables']['drivers']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type PromoCode = Database['public']['Tables']['promo_codes']['Row'];
export type UserCredit = Database['public']['Tables']['user_credits']['Row'];
