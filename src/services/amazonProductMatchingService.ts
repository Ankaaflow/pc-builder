// Amazon Product Matching Service
// Automatically finds and validates Amazon products for components using multiple methods

import { componentDatabaseService, DatabaseComponent, AmazonLink } from './componentDatabaseService';
import { amazonPAAPIService } from './amazonPAAPIService';
import { realAmazonScraper } from './realAmazonScraper';
import { Region } from '../utils/budgetAllocator';

interface ProductMatch {
  asin: string;
  title: string;
  price?: number;
  availability?: string;
  confidence: number; // 0-1 score of how well this matches
  source: 'pa_api' | 'scraping' | 'manual';
  url: string;
}

class AmazonProductMatchingService {

  /**
   * Find best Amazon product match for a component
   */
  async findBestProductMatch(component: DatabaseComponent, region: Region): Promise<ProductMatch | null> {
    console.log(`🔍 Finding Amazon match for ${component.name} in ${region}...`);
    
    // Try multiple methods in order of preference
    const matches = await Promise.allSettled([
      this.searchWithPAAPI(component, region),
      this.searchWithScraping(component, region),
      this.searchWithBrandAndModel(component, region)
    ]);

    // Filter successful matches and sort by confidence
    const validMatches: ProductMatch[] = matches
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<ProductMatch>).value)
      .sort((a, b) => b.confidence - a.confidence);

    if (validMatches.length === 0) {
      console.warn(`❌ No Amazon matches found for ${component.name}`);
      return null;
    }

    const bestMatch = validMatches[0];
    console.log(`✅ Best match for ${component.name}: ${bestMatch.asin} (confidence: ${bestMatch.confidence})`);
    
    return bestMatch;
  }

  /**
   * Search using Amazon Product Advertising API
   */
  private async searchWithPAAPI(component: DatabaseComponent, region: Region): Promise<ProductMatch | null> {
    if (!amazonPAAPIService.isEnabled()) {
      return null;
    }

    try {
      const searchQuery = this.buildSearchQuery(component);
      const results = await amazonPAAPIService.searchProducts(searchQuery, region, 'Electronics');
      
      if (results.length === 0) {
        return null;
      }

      const bestResult = results[0]; // PA API returns results sorted by relevance
      const confidence = this.calculateMatchConfidence(component, bestResult.title, 'pa_api');

      return {
        asin: bestResult.asin,
        title: bestResult.title,
        price: bestResult.price,
        availability: bestResult.availability,
        confidence,
        source: 'pa_api',
        url: bestResult.detailPageURL
      };

    } catch (error) {
      console.error(`PA API search failed for ${component.name}:`, error);
      return null;
    }
  }

  /**
   * Search using web scraping
   */
  private async searchWithScraping(component: DatabaseComponent, region: Region): Promise<ProductMatch | null> {
    try {
      const searchQuery = this.buildSearchQuery(component);
      const results = await realAmazonScraper.scrapeRealASINs(searchQuery, region);
      
      if (results.length === 0) {
        return null;
      }

      const bestResult = results[0]; // First result from scraping
      const confidence = this.calculateMatchConfidence(component, bestResult.title, 'scraping');

      return {
        asin: bestResult.asin,
        title: bestResult.title,
        price: bestResult.price,
        availability: 'Available', // Assume available if found in search
        confidence,
        source: 'scraping',
        url: `https://amazon.${this.getRegionDomain(region)}/dp/${bestResult.asin}`
      };

    } catch (error) {
      console.error(`Scraping search failed for ${component.name}:`, error);
      return null;
    }
  }

  /**
   * Search using brand + model number for more precise matching
   */
  private async searchWithBrandAndModel(component: DatabaseComponent, region: Region): Promise<ProductMatch | null> {
    if (!component.model_number) {
      return null;
    }

    try {
      const searchQuery = `${component.brand} ${component.model_number}`;
      
      // Try PA API first with precise query
      if (amazonPAAPIService.isEnabled()) {
        const results = await amazonPAAPIService.searchProducts(searchQuery, region, 'Electronics');
        
        if (results.length > 0) {
          const result = results[0];
          const confidence = this.calculateMatchConfidence(component, result.title, 'pa_api', true);

          return {
            asin: result.asin,
            title: result.title,
            price: result.price,
            availability: result.availability,
            confidence,
            source: 'pa_api',
            url: result.detailPageURL
          };
        }
      }

      // Fallback to scraping with model number
      const scrapingResults = await realAmazonScraper.scrapeRealASINs(searchQuery, region);
      
      if (scrapingResults.length > 0) {
        const result = scrapingResults[0];
        const confidence = this.calculateMatchConfidence(component, result.title, 'scraping', true);

        return {
          asin: result.asin,
          title: result.title,
          price: result.price,
          availability: 'Available',
          confidence,
          source: 'scraping',
          url: `https://amazon.${this.getRegionDomain(region)}/dp/${result.asin}`
        };
      }

      return null;

    } catch (error) {
      console.error(`Brand+model search failed for ${component.name}:`, error);
      return null;
    }
  }

  /**
   * Update or create Amazon link in database
   */
  async updateComponentAmazonLink(component: DatabaseComponent, region: Region): Promise<AmazonLink | null> {
    const match = await this.findBestProductMatch(component, region);
    
    if (!match) {
      console.warn(`No Amazon link found for ${component.name} in ${region}`);
      return null;
    }

    // Create or update the Amazon link
    const amazonLink: Omit<AmazonLink, 'id' | 'created_at' | 'updated_at'> = {
      component_id: component.id,
      region,
      asin: match.asin,
      product_url: match.url,
      is_valid: true,
      last_validated: new Date().toISOString(),
      validation_status: 'valid',
      amazon_title: match.title,
      amazon_price: match.price,
      amazon_availability: match.availability,
      match_confidence: match.confidence
    };

    const result = await componentDatabaseService.upsertAmazonLink(amazonLink);
    
    if (result) {
      console.log(`✅ Updated Amazon link for ${component.name}: ${match.asin}`);
      
      // Log the update
      await componentDatabaseService.logProcess(
        'amazon_link_update',
        'completed',
        `Updated link for ${component.name}`,
        { asin: match.asin, confidence: match.confidence, source: match.source }
      );
    }

    return result;
  }

  /**
   * Build optimized search query for component
   */
  private buildSearchQuery(component: DatabaseComponent): string {
    const categoryKeywords = {
      cpu: 'processor desktop',
      gpu: 'graphics card video card',
      motherboard: 'motherboard mainboard',
      ram: 'memory RAM DDR4 DDR5',
      storage: 'SSD NVMe hard drive',
      psu: 'power supply PSU',
      cooler: 'CPU cooler heatsink fan',
      case: 'PC case computer case tower'
    };

    const categoryKeyword = categoryKeywords[component.category] || '';
    const brand = component.brand || '';
    const name = component.name.replace(/[^\w\s]/g, '').trim();
    
    // Build query prioritizing exact name matches
    return `${brand} ${name} ${categoryKeyword}`.trim();
  }

  /**
   * Calculate confidence score for product match
   */
  private calculateMatchConfidence(
    component: DatabaseComponent, 
    amazonTitle: string, 
    source: 'pa_api' | 'scraping',
    hasModelNumber = false
  ): number {
    let confidence = 0.0;
    
    const componentWords = component.name.toLowerCase().split(/\s+/);
    const titleWords = amazonTitle.toLowerCase().split(/\s+/);
    
    // Brand match (high importance)
    if (amazonTitle.toLowerCase().includes(component.brand.toLowerCase())) {
      confidence += 0.3;
    }

    // Component name word matching
    let matchedWords = 0;
    for (const word of componentWords) {
      if (word.length > 2 && titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))) {
        matchedWords++;
      }
    }
    confidence += (matchedWords / componentWords.length) * 0.4;

    // Model number exact match (if available)
    if (component.model_number && amazonTitle.toLowerCase().includes(component.model_number.toLowerCase())) {
      confidence += 0.2;
    }

    // Category relevance
    const categoryIndicators = {
      cpu: ['processor', 'cpu', 'core', 'ryzen', 'intel'],
      gpu: ['graphics', 'video', 'rtx', 'gtx', 'radeon', 'geforce'],
      motherboard: ['motherboard', 'mainboard', 'mobo'],
      ram: ['memory', 'ram', 'ddr4', 'ddr5'],
      storage: ['ssd', 'nvme', 'hard drive', 'hdd'],
      psu: ['power supply', 'psu', 'watt'],
      cooler: ['cooler', 'heatsink', 'fan', 'cooling'],
      case: ['case', 'tower', 'chassis']
    };

    const indicators = categoryIndicators[component.category] || [];
    if (indicators.some(indicator => amazonTitle.toLowerCase().includes(indicator))) {
      confidence += 0.1;
    }

    // Source bonus (PA API is more reliable)
    if (source === 'pa_api') {
      confidence += 0.05;
    }

    // Model number search bonus
    if (hasModelNumber) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0); // Cap at 1.0
  }

  /**
   * Get region domain for Amazon URLs
   */
  private getRegionDomain(region: Region): string {
    const domains = {
      US: 'com',
      CA: 'ca',
      UK: 'co.uk',
      DE: 'de',
      AU: 'com.au'
    };
    return domains[region];
  }

  /**
   * Validate existing Amazon link
   */
  async validateAmazonLink(link: AmazonLink): Promise<boolean> {
    try {
      console.log(`🔍 Validating Amazon link: ${link.asin}`);
      
      const response = await fetch(link.product_url, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)'
        }
      });

      const isValid = response.ok && !response.url.includes('amazon') === false;
      
      // Update validation status in database
      await componentDatabaseService.upsertAmazonLink({
        ...link,
        is_valid: isValid,
        last_validated: new Date().toISOString(),
        validation_status: isValid ? 'valid' : 'invalid'
      });

      // Log validation
      await supabase.from('link_validations').insert({
        amazon_link_id: link.id,
        status: isValid ? 'valid' : 'invalid',
        response_code: response.status,
        validation_method: 'http_check'
      });

      console.log(`${isValid ? '✅' : '❌'} Link validation for ${link.asin}: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;

    } catch (error) {
      console.error(`Error validating link ${link.asin}:`, error);
      
      // Mark as error in database
      await componentDatabaseService.upsertAmazonLink({
        ...link,
        is_valid: false,
        last_validated: new Date().toISOString(),
        validation_status: 'invalid'
      });

      return false;
    }
  }

  /**
   * Bulk update Amazon links for all components
   */
  async bulkUpdateAmazonLinks(region: Region = 'US', limit: number = 50): Promise<void> {
    console.log(`🔄 Starting bulk Amazon link update for ${region}...`);
    
    await componentDatabaseService.logProcess('bulk_amazon_update', 'started', `Updating ${limit} components in ${region}`);

    try {
      // Get all active components
      const { data: components, error } = await supabase
        .from('components')
        .select('*')
        .eq('is_active', true)
        .limit(limit);

      if (error || !components) {
        throw new Error(`Failed to fetch components: ${error?.message}`);
      }

      console.log(`📋 Found ${components.length} components to update`);

      let updated = 0;
      let failed = 0;

      // Process components in batches to avoid overwhelming APIs
      for (let i = 0; i < components.length; i += 5) {
        const batch = components.slice(i, i + 5);
        
        await Promise.allSettled(
          batch.map(async (component) => {
            try {
              await this.updateComponentAmazonLink(component as DatabaseComponent, region);
              updated++;
            } catch (error) {
              console.error(`Failed to update ${component.name}:`, error);
              failed++;
            }
          })
        );

        // Rate limiting - wait between batches
        if (i + 5 < components.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`✅ Bulk update complete: ${updated} updated, ${failed} failed`);
      
      await componentDatabaseService.logProcess(
        'bulk_amazon_update', 
        'completed', 
        `Updated ${updated} components, ${failed} failed`,
        { region, updated, failed }
      );

    } catch (error) {
      console.error('Bulk update failed:', error);
      await componentDatabaseService.logProcess('bulk_amazon_update', 'failed', error.message);
    }
  }
}

export const amazonProductMatchingService = new AmazonProductMatchingService();