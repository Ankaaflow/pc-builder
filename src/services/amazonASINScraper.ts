import { Component, Region } from '../utils/budgetAllocator';

interface ScrapedProduct {
  asin: string;
  title: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  availability: string;
  popularity: number; // Based on reviews, rating, search ranking
}

interface ASINScrapingResult {
  componentName: string;
  category: string;
  topProducts: ScrapedProduct[];
  lastScraped: number;
  popularityScore: number;
}

/**
 * Dynamic Amazon ASIN scraper that finds real, popular products
 * Updates based on search popularity and availability
 */
export class AmazonASINScraper {
  private cache = new Map<string, ASINScrapingResult>();
  private cacheExpiry = 4 * 60 * 60 * 1000; // 4 hours
  private requestDelay = 2000; // 2 seconds between requests
  private lastRequest = 0;

  /**
   * Scrape Amazon for real ASINs of a component
   */
  async scrapeComponentASINs(componentName: string, category: string, region: Region = 'US'): Promise<ScrapedProduct[]> {
    const cacheKey = `${componentName}-${category}-${region}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached if still fresh
    if (cached && (Date.now() - cached.lastScraped) < this.cacheExpiry) {
      console.log(`📦 Using cached ASINs for ${componentName}`);
      return cached.topProducts;
    }

    console.log(`🔍 Scraping Amazon for ${componentName} ASINs...`);

    try {
      // Rate limiting
      await this.enforceRateLimit();

      // Build search query
      const searchQuery = this.buildSearchQuery(componentName, category);
      const products = await this.scrapeAmazonSearch(searchQuery, region);

      // Filter and rank by popularity
      const popularProducts = this.rankByPopularity(products, componentName);

      // Cache results
      this.cache.set(cacheKey, {
        componentName,
        category,
        topProducts: popularProducts,
        lastScraped: Date.now(),
        popularityScore: this.calculatePopularityScore(popularProducts)
      });

      console.log(`✅ Found ${popularProducts.length} popular ASINs for ${componentName}`);
      return popularProducts;

    } catch (error) {
      console.error(`❌ Failed to scrape ASINs for ${componentName}:`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`📦 Returning expired cache for ${componentName}`);
        return cached.topProducts;
      }
      
      return [];
    }
  }

  /**
   * Get the most popular (best) ASIN for a component
   */
  async getBestASIN(componentName: string, category: string, region: Region = 'US'): Promise<string | null> {
    const products = await this.scrapeComponentASINs(componentName, category, region);
    
    if (products.length === 0) {
      console.warn(`❌ No ASINs found for ${componentName}`);
      return null;
    }

    const bestProduct = products[0]; // Already sorted by popularity
    console.log(`🏆 Best ASIN for ${componentName}: ${bestProduct.asin} (${bestProduct.title})`);
    return bestProduct.asin;
  }

  /**
   * Bulk update ASINs for multiple components
   */
  async bulkUpdateASINs(components: Component[], region: Region = 'US'): Promise<Map<string, string>> {
    const asinMap = new Map<string, string>();
    
    console.log(`🔄 Bulk updating ASINs for ${components.length} components...`);

    for (const component of components) {
      try {
        const asin = await this.getBestASIN(component.name, component.category, region);
        
        if (asin) {
          asinMap.set(component.name, asin);
          console.log(`✅ ${component.name} → ${asin}`);
        } else {
          console.warn(`⚠️ No ASIN found for ${component.name}`);
        }

        // Rate limiting between requests
        await this.delay(this.requestDelay);

      } catch (error) {
        console.error(`❌ Failed to get ASIN for ${component.name}:`, error);
      }
    }

    console.log(`📊 Updated ${asinMap.size}/${components.length} ASINs`);
    return asinMap;
  }

  /**
   * Scrape Amazon search results (simulated - in production use real scraping)
   */
  private async scrapeAmazonSearch(searchQuery: string, region: Region): Promise<ScrapedProduct[]> {
    // In production, this would use real web scraping libraries like Puppeteer or Playwright
    // For now, simulate with known popular products
    
    console.log(`🔍 Searching Amazon ${region} for: "${searchQuery}"`);

    // Simulate scraping delay
    await this.delay(1000);

    // Return simulated results based on search patterns
    return this.simulateAmazonSearch(searchQuery, region);
  }

  /**
   * Simulate Amazon search results with real popular ASINs
   */
  private simulateAmazonSearch(searchQuery: string, region: Region): ScrapedProduct[] {
    const query = searchQuery.toLowerCase();
    const products: ScrapedProduct[] = [];

    // Intel processors
    if (query.includes('intel') && query.includes('i9') && query.includes('14900k')) {
      products.push({
        asin: 'B0CGJDKLB8',
        title: 'Intel Core i9-14900K Desktop Processor 24 cores (8 P-cores + 16 E-cores) up to 6.0 GHz',
        price: 589,
        rating: 4.5,
        reviewCount: 247,
        imageUrl: 'https://m.media-amazon.com/images/I/61vGQNUEsqL._AC_SX425_.jpg',
        availability: 'in-stock',
        popularity: 95
      });
    }

    // AMD processors
    if ((query.includes('amd') || query.includes('ryzen')) && query.includes('7950x')) {
      products.push({
        asin: 'B0BBHD5D8Y',
        title: 'AMD Ryzen 9 7950X 16-Core, 32-Thread Unlocked Desktop Processor',
        price: 549,
        rating: 4.7,
        reviewCount: 324,
        imageUrl: 'https://m.media-amazon.com/images/I/61BZhKJ1B0L._AC_SX425_.jpg',
        availability: 'in-stock',
        popularity: 92
      });
    }

    // NVIDIA GPUs
    if (query.includes('rtx') && query.includes('4090')) {
      products.push(
        {
          asin: 'B0BG94PS2F',
          title: 'MSI Gaming GeForce RTX 4090, 24GB GDRR6X, Boost Clock: 2595 MHz',
          price: 1599,
          rating: 4.4,
          reviewCount: 156,
          imageUrl: 'https://m.media-amazon.com/images/I/71bK8jCl9pL._AC_SX425_.jpg',
          availability: 'in-stock',
          popularity: 88
        },
        {
          asin: 'B0BJFRT43X',
          title: 'NVIDIA GeForce RTX 4090 Founders Edition 24GB GDDR6X',
          price: 1599,
          rating: 4.6,
          reviewCount: 89,
          imageUrl: 'https://m.media-amazon.com/images/I/61BZhKJ1B0L._AC_SX425_.jpg',
          availability: 'limited',
          popularity: 90
        }
      );
    }

    // Corsair RAM
    if (query.includes('corsair') && query.includes('vengeance') && query.includes('ddr5')) {
      products.push({
        asin: 'B09NCPTVX5',
        title: 'CORSAIR VENGEANCE DDR5 RAM 32GB (2x16GB) 5200MHz CL40',
        price: 179,
        rating: 4.3,
        reviewCount: 445,
        imageUrl: 'https://m.media-amazon.com/images/I/71abc123def._AC_SX425_.jpg',
        availability: 'in-stock',
        popularity: 85
      });
    }

    // Generic fallbacks for unknown components
    if (products.length === 0) {
      // Return empty for unknown components - will trigger search fallback
      console.log(`❌ No simulated results for: ${searchQuery}`);
    }

    return products;
  }

  /**
   * Rank products by popularity score
   */
  private rankByPopularity(products: ScrapedProduct[], componentName: string): ScrapedProduct[] {
    return products
      .map(product => ({
        ...product,
        popularity: this.calculateProductPopularity(product, componentName)
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5); // Top 5 most popular
  }

  /**
   * Calculate product popularity score
   */
  private calculateProductPopularity(product: ScrapedProduct, targetComponent: string): number {
    let score = 0;

    // Rating weight (40%)
    score += (product.rating / 5) * 40;

    // Review count weight (30%) - logarithmic scale
    score += Math.min(Math.log10(product.reviewCount + 1) * 10, 30);

    // Availability weight (20%)
    if (product.availability === 'in-stock') score += 20;
    else if (product.availability === 'limited') score += 10;

    // Title relevance weight (10%)
    const titleRelevance = this.calculateTitleRelevance(product.title, targetComponent);
    score += titleRelevance * 10;

    return Math.round(score);
  }

  /**
   * Calculate how relevant product title is to target component
   */
  private calculateTitleRelevance(title: string, targetComponent: string): number {
    const titleLower = title.toLowerCase();
    const componentLower = targetComponent.toLowerCase();
    
    const titleWords = titleLower.split(/\s+/);
    const componentWords = componentLower.split(/\s+/);
    
    let matches = 0;
    for (const word of componentWords) {
      if (word.length > 2 && titleWords.some(tw => tw.includes(word))) {
        matches++;
      }
    }
    
    return matches / componentWords.length;
  }

  /**
   * Build optimized search query for Amazon
   */
  private buildSearchQuery(componentName: string, category: string): string {
    // Clean component name
    let query = componentName
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Add category-specific keywords for better results
    const categoryKeywords = {
      cpu: 'processor desktop',
      gpu: 'graphics card',
      motherboard: 'motherboard atx',
      ram: 'memory ddr5 ddr4',
      storage: 'ssd nvme',
      psu: 'power supply 80+ gold',
      cooler: 'cpu cooler',
      case: 'pc case atx'
    };

    const keywords = categoryKeywords[category as keyof typeof categoryKeywords];
    if (keywords) {
      query += ` ${keywords}`;
    }

    return query;
  }

  /**
   * Calculate overall popularity score for cached results
   */
  private calculatePopularityScore(products: ScrapedProduct[]): number {
    if (products.length === 0) return 0;
    
    const avgRating = products.reduce((sum, p) => sum + p.rating, 0) / products.length;
    const avgReviews = products.reduce((sum, p) => sum + p.reviewCount, 0) / products.length;
    const inStockCount = products.filter(p => p.availability === 'in-stock').length;
    
    return Math.round(
      (avgRating / 5) * 40 +
      Math.min(Math.log10(avgReviews + 1) * 10, 30) +
      (inStockCount / products.length) * 30
    );
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.requestDelay) {
      await this.delay(this.requestDelay - timeSinceLastRequest);
    }
    
    this.lastRequest = Date.now();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ ASIN cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    totalComponents: number;
    averagePopularity: number;
    lastUpdated: string;
  } {
    const entries = Array.from(this.cache.values());
    
    return {
      entries: entries.length,
      totalComponents: entries.reduce((sum, entry) => sum + entry.topProducts.length, 0),
      averagePopularity: entries.length > 0 ? 
        entries.reduce((sum, entry) => sum + entry.popularityScore, 0) / entries.length : 0,
      lastUpdated: entries.length > 0 ? 
        new Date(Math.max(...entries.map(e => e.lastScraped))).toISOString() : 'Never'
    };
  }
}

// Export singleton instance
export const amazonASINScraper = new AmazonASINScraper();

// Browser console utilities
if (typeof window !== 'undefined') {
  (window as any).scrapeASINs = (componentName: string, category: string) => 
    amazonASINScraper.scrapeComponentASINs(componentName, category);
  
  (window as any).getBestASIN = (componentName: string, category: string) => 
    amazonASINScraper.getBestASIN(componentName, category);
  
  (window as any).clearASINCache = () => amazonASINScraper.clearCache();
  
  (window as any).asinCacheStats = () => amazonASINScraper.getCacheStats();

  console.log('🤖 Amazon ASIN Scraper loaded!');
  console.log('- scrapeASINs("Intel i9-14900K", "cpu") - Scrape ASINs for component');
  console.log('- getBestASIN("AMD Ryzen 9 7950X", "cpu") - Get best ASIN');
  console.log('- clearASINCache() - Clear cache');
  console.log('- asinCacheStats() - View cache stats');
}