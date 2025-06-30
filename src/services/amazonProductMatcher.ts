import { Component } from '../data/components';
import { Region } from '../utils/budgetAllocator';

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  rating: number;
  reviewCount: number;
  isPrime: boolean;
  seller: string;
}

export interface ProductSearchResult {
  products: AmazonProduct[];
  totalResults: number;
  searchQuery: string;
}

class AmazonProductMatcher {
  private apiEndpoint = 'https://api.amazon-product-api.com'; // Replace with actual Amazon PA API endpoint
  private accessKey = process.env.AMAZON_ACCESS_KEY || '';
  private secretKey = process.env.AMAZON_SECRET_KEY || '';
  private associateTag = process.env.AMAZON_ASSOCIATE_TAG || 'pcbuilder-20';
  
  // Cache for product searches
  private searchCache = new Map<string, ProductSearchResult>();
  private asinCache = new Map<string, AmazonProduct>();
  private cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours

  // Amazon marketplace endpoints by region
  private marketplaces = {
    US: 'webservices.amazon.com',
    CA: 'webservices.amazon.ca', 
    UK: 'webservices.amazon.co.uk',
    DE: 'webservices.amazon.de',
    AU: 'webservices.amazon.com.au'
  };

  /**
   * Search Amazon for products matching a component name
   */
  async searchProducts(componentName: string, region: Region, category?: string): Promise<ProductSearchResult> {
    const cacheKey = `${componentName}-${region}-${category}`;
    
    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // In production, this would use Amazon Product Advertising API
      const searchQuery = this.buildSearchQuery(componentName, category);
      
      // For now, simulate API call with intelligent matching
      const mockResult = await this.simulateAmazonSearch(componentName, region, category);
      
      // Cache results
      this.searchCache.set(cacheKey, mockResult);
      
      return mockResult;
      
    } catch (error) {
      console.error('Amazon product search failed:', error);
      
      // Return empty result on failure
      return {
        products: [],
        totalResults: 0,
        searchQuery: componentName
      };
    }
  }

  /**
   * Get product details by ASIN
   */
  async getProductByASIN(asin: string, region: Region): Promise<AmazonProduct | null> {
    const cacheKey = `${asin}-${region}`;
    
    // Check cache first
    const cached = this.asinCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // In production, this would use Amazon Product Advertising API GetItems operation
      const product = await this.simulateASINLookup(asin, region);
      
      if (product) {
        this.asinCache.set(cacheKey, product);
      }
      
      return product;
      
    } catch (error) {
      console.error(`Failed to get product details for ASIN ${asin}:`, error);
      return null;
    }
  }

  /**
   * Find best matching Amazon product for a component
   */
  async findBestMatch(component: Component, region: Region): Promise<AmazonProduct | null> {
    try {
      // First try to validate existing ASIN
      if (component.asin && component.asin !== 'placeholder' && !component.asin.startsWith('B0DJKL')) {
        const existingProduct = await this.getProductByASIN(component.asin, region);
        if (existingProduct && this.isGoodMatch(component.name, existingProduct.title)) {
          return existingProduct;
        }
      }

      // Search for products matching the component name
      const searchResult = await this.searchProducts(component.name, region, component.category);
      
      if (searchResult.products.length === 0) {
        return null;
      }

      // Find best match based on name similarity and other factors
      const bestMatch = this.selectBestMatch(component, searchResult.products);
      
      if (bestMatch) {
        // Update component ASIN if we found a better match
        console.log(`Found better ASIN for ${component.name}: ${bestMatch.asin}`);
      }
      
      return bestMatch;
      
    } catch (error) {
      console.error(`Failed to find Amazon match for ${component.name}:`, error);
      return null;
    }
  }

  /**
   * Validate and update ASINs for a batch of components
   */
  async validateAndUpdateASINs(components: Component[], region: Region): Promise<Component[]> {
    const updatedComponents = [];
    
    for (const component of components) {
      try {
        const bestMatch = await this.findBestMatch(component, region);
        
        if (bestMatch) {
          // Update component with verified ASIN and price
          const updatedComponent = {
            ...component,
            asin: bestMatch.asin,
            price: {
              ...component.price,
              [region]: bestMatch.price
            },
            availability: bestMatch.availability
          };
          
          updatedComponents.push(updatedComponent);
        } else {
          // Keep original component if no match found
          updatedComponents.push(component);
        }
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Failed to validate ASIN for ${component.name}:`, error);
        updatedComponents.push(component);
      }
    }
    
    return updatedComponents;
  }

  private buildSearchQuery(componentName: string, category?: string): string {
    // Clean component name for better search results
    let query = componentName
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Add category context for better matching
    if (category) {
      const categoryKeywords = {
        cpu: 'processor',
        gpu: 'graphics card',
        motherboard: 'motherboard',
        ram: 'memory',
        storage: 'SSD',
        psu: 'power supply',
        cooler: 'CPU cooler',
        case: 'PC case'
      };
      
      if (categoryKeywords[category as keyof typeof categoryKeywords]) {
        query += ` ${categoryKeywords[category as keyof typeof categoryKeywords]}`;
      }
    }

    return query;
  }

  private async simulateAmazonSearch(componentName: string, region: Region, category?: string): Promise<ProductSearchResult> {
    // This simulates Amazon API responses with realistic data
    // In production, replace with actual Amazon Product Advertising API calls
    
    const mockProducts: AmazonProduct[] = [];
    
    // Generate realistic mock products based on component name
    if (componentName.toLowerCase().includes('rtx 4090')) {
      mockProducts.push({
        asin: 'B0BGP8X9K5',
        title: 'NVIDIA GeForce RTX 4090 Founders Edition 24GB GDDR6X Graphics Card',
        price: 1599.99,
        currency: 'USD',
        imageUrl: 'https://m.media-amazon.com/images/I/61BZhKJ1B0L._AC_SX425_.jpg',
        availability: 'in-stock',
        rating: 4.5,
        reviewCount: 324,
        isPrime: true,
        seller: 'Amazon'
      });
    } else if (componentName.toLowerCase().includes('ryzen 9 7950x')) {
      mockProducts.push({
        asin: 'B0BBHD5D8Y',
        title: 'AMD Ryzen 9 7950X 16-Core, 32-Thread Unlocked Desktop Processor',
        price: 549.99,
        currency: 'USD', 
        imageUrl: 'https://m.media-amazon.com/images/I/61vGQNUEsqL._AC_SX425_.jpg',
        availability: 'in-stock',
        rating: 4.7,
        reviewCount: 156,
        isPrime: true,
        seller: 'Amazon'
      });
    }
    
    // Add regional price adjustments
    const regionMultipliers: Record<Region, number> = {
      US: 1.0,
      CA: 1.25,
      UK: 1.15,
      DE: 1.1,
      AU: 1.35
    };
    
    const adjustedProducts = mockProducts.map(product => ({
      ...product,
      price: product.price * regionMultipliers[region]
    }));
    
    return {
      products: adjustedProducts,
      totalResults: adjustedProducts.length,
      searchQuery: this.buildSearchQuery(componentName, category)
    };
  }

  private async simulateASINLookup(asin: string, region: Region): Promise<AmazonProduct | null> {
    // Check if this is a placeholder/fake ASIN
    if (asin.startsWith('B0DJKL') || asin === 'placeholder') {
      return null;
    }

    // Simulate API lookup with realistic data for known ASINs
    const knownProducts: Record<string, Partial<AmazonProduct>> = {
      'B0BGP8X9K5': {
        title: 'NVIDIA GeForce RTX 4090 Founders Edition 24GB GDDR6X Graphics Card',
        price: 1599.99,
        availability: 'in-stock',
        rating: 4.5,
        reviewCount: 324
      },
      'B0BBHD5D8Y': {
        title: 'AMD Ryzen 9 7950X 16-Core, 32-Thread Unlocked Desktop Processor',
        price: 549.99,
        availability: 'in-stock', 
        rating: 4.7,
        reviewCount: 156
      }
    };

    const productData = knownProducts[asin];
    if (!productData) {
      return null;
    }

    // Regional price adjustment
    const regionMultipliers: Record<Region, number> = {
      US: 1.0, CA: 1.25, UK: 1.15, DE: 1.1, AU: 1.35
    };

    return {
      asin,
      title: productData.title || 'Unknown Product',
      price: (productData.price || 0) * regionMultipliers[region],
      currency: 'USD',
      imageUrl: `https://m.media-amazon.com/images/I/${asin}._AC_SX425_.jpg`,
      availability: productData.availability || 'limited',
      rating: productData.rating || 4.0,
      reviewCount: productData.reviewCount || 0,
      isPrime: true,
      seller: 'Amazon'
    };
  }

  private isGoodMatch(componentName: string, productTitle: string): boolean {
    const normalizeString = (str: string) => 
      str.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();

    const normalizedComponent = normalizeString(componentName);
    const normalizedTitle = normalizeString(productTitle);

    // Extract key terms from component name
    const componentTerms = normalizedComponent.split(' ');
    const titleTerms = normalizedTitle.split(' ');

    // Calculate match score based on shared terms
    let matchedTerms = 0;
    for (const term of componentTerms) {
      if (term.length > 2 && titleTerms.some(titleTerm => titleTerm.includes(term))) {
        matchedTerms++;
      }
    }

    const matchScore = matchedTerms / componentTerms.length;
    
    // Consider it a good match if 70%+ of terms are found
    return matchScore >= 0.7;
  }

  private selectBestMatch(component: Component, products: AmazonProduct[]): AmazonProduct | null {
    if (products.length === 0) return null;

    // Score products based on multiple factors
    const scoredProducts = products.map(product => {
      let score = 0;

      // Name similarity (most important factor)
      const nameMatch = this.isGoodMatch(component.name, product.title);
      score += nameMatch ? 50 : 0;

      // In-stock availability
      if (product.availability === 'in-stock') score += 20;
      else if (product.availability === 'limited') score += 10;

      // High rating
      score += product.rating * 5;

      // Prime eligibility
      if (product.isPrime) score += 5;

      // Amazon as seller (more trustworthy)
      if (product.seller === 'Amazon') score += 5;

      return { product, score };
    });

    // Sort by score and return best match
    scoredProducts.sort((a, b) => b.score - a.score);
    
    // Only return if the best match has a reasonable score
    return scoredProducts[0].score >= 50 ? scoredProducts[0].product : null;
  }

  /**
   * Generate Amazon affiliate link for a product
   */
  generateProductLink(asin: string, region: Region, associateTag?: string): string {
    const domains = {
      US: 'amazon.com',
      CA: 'amazon.ca',
      UK: 'amazon.co.uk', 
      DE: 'amazon.de',
      AU: 'amazon.com.au'
    };

    const tag = associateTag || this.associateTag;
    
    return `https://${domains[region]}/dp/${asin}?tag=${tag}`;
  }
}

export const amazonProductMatcher = new AmazonProductMatcher();