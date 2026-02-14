import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Review {
  id: string;
  customer_name: string;
  customer_location: string | null;
  rating: number;
  comment: string;
  service_type: string;
  is_featured: boolean;
  is_approved: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewData {
  customer_name: string;
  customer_location?: string;
  rating: number;
  comment: string;
  service_type?: string;
  is_featured?: boolean;
  is_approved?: boolean;
}

export interface UpdateReviewData {
  customer_name?: string;
  customer_location?: string;
  rating?: number;
  comment?: string;
  service_type?: string;
  is_featured?: boolean;
  is_approved?: boolean;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const getFeaturedReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_featured', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching featured reviews:', err);
      return [];
    }
  }, []);

  const addReview = async (reviewData: CreateReviewData): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([{
          customer_name: reviewData.customer_name,
          customer_location: reviewData.customer_location || null,
          rating: reviewData.rating,
          comment: reviewData.comment,
          service_type: reviewData.service_type || 'laundry',
          is_featured: reviewData.is_featured ?? false,
          is_approved: reviewData.is_approved ?? true
        }]);

      if (error) throw error;
      
      await fetchReviews();
      return { success: true, message: 'Review added successfully' };
    } catch (err) {
      console.error('Error adding review:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Failed to add review' };
    }
  };

  const updateReview = async (id: string, reviewData: UpdateReviewData): Promise<{ success: boolean; message: string }> => {
    try {
      const updateFields: Record<string, unknown> = {};
      
      if (reviewData.customer_name !== undefined) updateFields.customer_name = reviewData.customer_name;
      if (reviewData.customer_location !== undefined) updateFields.customer_location = reviewData.customer_location;
      if (reviewData.rating !== undefined) updateFields.rating = reviewData.rating;
      if (reviewData.comment !== undefined) updateFields.comment = reviewData.comment;
      if (reviewData.service_type !== undefined) updateFields.service_type = reviewData.service_type;
      if (reviewData.is_featured !== undefined) updateFields.is_featured = reviewData.is_featured;
      if (reviewData.is_approved !== undefined) updateFields.is_approved = reviewData.is_approved;

      const { error } = await supabase
        .from('reviews')
        .update(updateFields)
        .eq('id', id);

      if (error) throw error;
      
      await fetchReviews();
      return { success: true, message: 'Review updated successfully' };
    } catch (err) {
      console.error('Error updating review:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Failed to update review' };
    }
  };

  const deleteReview = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchReviews();
      return { success: true, message: 'Review deleted successfully' };
    } catch (err) {
      console.error('Error deleting review:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Failed to delete review' };
    }
  };

  const toggleFeatured = async (id: string, featured: boolean): Promise<{ success: boolean; message: string }> => {
    return updateReview(id, { is_featured: featured });
  };

  const toggleApproved = async (id: string, approved: boolean): Promise<{ success: boolean; message: string }> => {
    return updateReview(id, { is_approved: approved });
  };

  // Stats
  const stats = {
    total: reviews.length,
    featured: reviews.filter(r => r.is_featured).length,
    approved: reviews.filter(r => r.is_approved).length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0
  };

  return {
    reviews,
    loading,
    error,
    stats,
    fetchReviews,
    getFeaturedReviews,
    addReview,
    updateReview,
    deleteReview,
    toggleFeatured,
    toggleApproved
  };
}
