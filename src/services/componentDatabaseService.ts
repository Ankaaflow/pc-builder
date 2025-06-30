// Component Database Service
// Manages the Supabase database for component tracking and Amazon link management

import { supabase } from '@/integrations/supabase/client';
import { Region } from '../utils/budgetAllocator';

export interface DatabaseComponent {
  id: string;
  name: string;
  brand: string;
  category: 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'cooler' | 'case';
  model_number?: string;
  description?: string;
  specs?: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  source: string;
}

export interface ComponentPricing {
  id: string;
  component_id: string;
  region: Region;
  price_usd: number;
  currency: string;
  last_updated: string;
  source: string;
}

export interface AmazonLink {
  id: string;
  component_id: string;
  region: Region;
  asin: string;
  product_url: string;
  is_valid: boolean;
  last_validated: string;
  validation_status: 'valid' | 'invalid' | 'pending' | 'not_found';
  amazon_title?: string;
  amazon_price?: number;
  amazon_availability?: string;
  match_confidence: number;
  created_at: string;
  updated_at: string;
}

export interface RedditMention {
  id: string;
  component_id?: string;
  post_id: string;
  comment_id?: string;
  subreddit: string;
  mention_text: string;
  context?: string;
  budget_range?: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  post_created_at?: string;
  extracted_at: string;
}

export interface ComponentPopularity {
  id: string;
  component_id: string;
  reddit_mentions_count: number;
  selection_count: number;
  last_reddit_mention?: string;
  popularity_score: number;
  updated_at: string;
}

class ComponentDatabaseService {
  
  // ================== COMPONENT MANAGEMENT ==================
  
  /**
   * Add or update a component in the database
   */
  async upsertComponent(component: Omit<DatabaseComponent, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseComponent | null> {
    try {
      const { data, error } = await supabase
        .from('components')
        .upsert({
          name: component.name,
          brand: component.brand,
          category: component.category,
          model_number: component.model_number,
          description: component.description,
          specs: component.specs || {},
          is_active: component.is_active,
          source: component.source
        }, {
          onConflict: 'name,brand'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting component:', error);
        return null;
      }

      return data as DatabaseComponent;
    } catch (error) {
      console.error('Failed to upsert component:', error);
      return null;
    }
  }

  /**
   * Get components by category with their Amazon links
   */
  async getComponentsByCategory(category: string, region: Region = 'US'): Promise<(DatabaseComponent & { amazon_links: AmazonLink[] })[]> {
    try {
      const { data, error } = await supabase
        .from('components')
        .select(`
          *,
          amazon_links!inner(*)
        `)
        .eq('category', category)
        .eq('is_active', true)
        .eq('amazon_links.region', region)
        .eq('amazon_links.is_valid', true);

      if (error) {
        console.error('Error fetching components:', error);
        return [];
      }

      return data as (DatabaseComponent & { amazon_links: AmazonLink[] })[];
    } catch (error) {
      console.error('Failed to fetch components:', error);
      return [];
    }
  }

  /**
   * Search components by name or brand
   */
  async searchComponents(query: string): Promise<DatabaseComponent[]> {
    try {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error searching components:', error);
        return [];
      }

      return data as DatabaseComponent[];
    } catch (error) {
      console.error('Failed to search components:', error);
      return [];
    }
  }

  // ================== AMAZON LINK MANAGEMENT ==================

  /**
   * Add or update Amazon link for a component
   */
  async upsertAmazonLink(link: Omit<AmazonLink, 'id' | 'created_at' | 'updated_at'>): Promise<AmazonLink | null> {
    try {
      const { data, error } = await supabase
        .from('amazon_links')
        .upsert({
          component_id: link.component_id,
          region: link.region,
          asin: link.asin,
          product_url: link.product_url,
          is_valid: link.is_valid,
          last_validated: link.last_validated,
          validation_status: link.validation_status,
          amazon_title: link.amazon_title,
          amazon_price: link.amazon_price,
          amazon_availability: link.amazon_availability,
          match_confidence: link.match_confidence
        }, {
          onConflict: 'component_id,region,asin'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting Amazon link:', error);
        return null;
      }

      return data as AmazonLink;
    } catch (error) {
      console.error('Failed to upsert Amazon link:', error);
      return null;
    }
  }

  /**
   * Get best Amazon link for a component in a region
   */
  async getBestAmazonLink(componentId: string, region: Region): Promise<AmazonLink | null> {
    try {
      const { data, error } = await supabase
        .from('amazon_links')
        .select('*')
        .eq('component_id', componentId)
        .eq('region', region)
        .eq('is_valid', true)
        .order('match_confidence', { ascending: false })
        .order('last_validated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching best Amazon link:', error);
        return null;
      }

      return data as AmazonLink;
    } catch (error) {
      console.error('Failed to fetch best Amazon link:', error);
      return null;
    }
  }

  /**
   * Get all invalid Amazon links that need validation
   */
  async getLinksNeedingValidation(limit: number = 50): Promise<AmazonLink[]> {
    try {
      const { data, error } = await supabase
        .from('amazon_links')
        .select('*')
        .or('validation_status.eq.pending,last_validated.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(limit)
        .order('last_validated', { ascending: true });

      if (error) {
        console.error('Error fetching links needing validation:', error);
        return [];
      }

      return data as AmazonLink[];
    } catch (error) {
      console.error('Failed to fetch links needing validation:', error);
      return [];
    }
  }

  // ================== REDDIT MENTIONS ==================

  /**
   * Add Reddit mention to database
   */
  async addRedditMention(mention: Omit<RedditMention, 'id' | 'extracted_at'>): Promise<RedditMention | null> {
    try {
      const { data, error } = await supabase
        .from('reddit_mentions')
        .insert({
          component_id: mention.component_id,
          post_id: mention.post_id,
          comment_id: mention.comment_id,
          subreddit: mention.subreddit,
          mention_text: mention.mention_text,
          context: mention.context,
          budget_range: mention.budget_range,
          sentiment: mention.sentiment,
          confidence: mention.confidence,
          post_created_at: mention.post_created_at
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding Reddit mention:', error);
        return null;
      }

      return data as RedditMention;
    } catch (error) {
      console.error('Failed to add Reddit mention:', error);
      return null;
    }
  }

  /**
   * Get recent Reddit mentions for analysis
   */
  async getRecentRedditMentions(days: number = 7, limit: number = 100): Promise<RedditMention[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('reddit_mentions')
        .select('*')
        .gte('extracted_at', cutoffDate)
        .order('extracted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent Reddit mentions:', error);
        return [];
      }

      return data as RedditMention[];
    } catch (error) {
      console.error('Failed to fetch recent Reddit mentions:', error);
      return [];
    }
  }

  // ================== POPULARITY TRACKING ==================

  /**
   * Update component popularity based on new mention or selection
   */
  async updateComponentPopularity(componentId: string, type: 'reddit' | 'selection'): Promise<void> {
    try {
      // First, upsert the popularity record
      const { error: upsertError } = await supabase
        .from('component_popularity')
        .upsert({
          component_id: componentId,
          reddit_mentions_count: type === 'reddit' ? 1 : 0,
          selection_count: type === 'selection' ? 1 : 0,
          last_reddit_mention: type === 'reddit' ? new Date().toISOString() : undefined
        }, {
          onConflict: 'component_id'
        });

      if (upsertError) {
        console.error('Error upserting popularity:', upsertError);
        return;
      }

      // Then increment the appropriate counter
      const incrementField = type === 'reddit' ? 'reddit_mentions_count' : 'selection_count';
      
      const { error: updateError } = await supabase.rpc('increment', {
        table_name: 'component_popularity',
        column_name: incrementField,
        row_id: componentId
      });

      if (updateError) {
        console.error('Error incrementing popularity:', updateError);
      }

      // Recalculate popularity score
      await this.recalculatePopularityScore(componentId);
      
    } catch (error) {
      console.error('Failed to update component popularity:', error);
    }
  }

  /**
   * Recalculate popularity score using database function
   */
  async recalculatePopularityScore(componentId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('calculate_popularity_score', {
        component_uuid: componentId
      });

      if (error) {
        console.error('Error calculating popularity score:', error);
        return;
      }

      // Update the popularity score
      await supabase
        .from('component_popularity')
        .update({ popularity_score: data })
        .eq('component_id', componentId);

    } catch (error) {
      console.error('Failed to recalculate popularity score:', error);
    }
  }

  /**
   * Get most popular components by category
   */
  async getPopularComponents(category?: string, limit: number = 10): Promise<(DatabaseComponent & { popularity_score: number })[]> {
    try {
      let query = supabase
        .from('components')
        .select(`
          *,
          component_popularity!inner(popularity_score)
        `)
        .eq('is_active', true)
        .order('component_popularity.popularity_score', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching popular components:', error);
        return [];
      }

      return data as (DatabaseComponent & { popularity_score: number })[];
    } catch (error) {
      console.error('Failed to fetch popular components:', error);
      return [];
    }
  }

  // ================== SYSTEM LOGGING ==================

  /**
   * Log system process for monitoring
   */
  async logProcess(processName: string, status: 'started' | 'completed' | 'failed', message?: string, details?: any): Promise<void> {
    try {
      await supabase
        .from('system_logs')
        .insert({
          process_name: processName,
          status,
          message,
          details: details || {}
        });
    } catch (error) {
      console.error('Failed to log process:', error);
    }
  }

  // ================== UTILITY METHODS ==================

  /**
   * Get component statistics
   */
  async getComponentStats(): Promise<{
    total_components: number;
    valid_links: number;
    invalid_links: number;
    recent_mentions: number;
  }> {
    try {
      const [
        { count: totalComponents },
        { count: validLinks },
        { count: invalidLinks },
        { count: recentMentions }
      ] = await Promise.all([
        supabase.from('components').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('amazon_links').select('*', { count: 'exact', head: true }).eq('is_valid', true),
        supabase.from('amazon_links').select('*', { count: 'exact', head: true }).eq('is_valid', false),
        supabase.from('reddit_mentions').select('*', { count: 'exact', head: true }).gte('extracted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        total_components: totalComponents || 0,
        valid_links: validLinks || 0,
        invalid_links: invalidLinks || 0,
        recent_mentions: recentMentions || 0
      };
    } catch (error) {
      console.error('Failed to get component stats:', error);
      return { total_components: 0, valid_links: 0, invalid_links: 0, recent_mentions: 0 };
    }
  }
}

export const componentDatabaseService = new ComponentDatabaseService();