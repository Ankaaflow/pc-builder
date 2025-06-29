
import { Component } from '../utils/budgetAllocator';

export interface ScrapingSource {
  name: string;
  url: string;
  scrapeFunction: () => Promise<Component[]>;
}

export interface RedditPost {
  title: string;
  content: string;
  upvotes: number;
  comments: number;
  url: string;
  created: Date;
}

export interface ComponentRecommendation {
  component: string;
  budget: number;
  mentions: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  source: 'reddit' | 'review' | 'scraping';
}

export class ComponentScrapingService {
  private openaiApiKey: string = '';
  private redditApiKey: string = '';

  constructor(openaiKey?: string, redditKey?: string) {
    this.openaiApiKey = openaiKey || '';
    this.redditApiKey = redditKey || '';
  }

  // Scrape PCPartPicker for components
  async scrapePCPartPicker(category: string): Promise<Component[]> {
    try {
      // Note: In production, this would use Puppeteer/Playwright
      // For now, we'll simulate the scraping process
      console.log(`Scraping PCPartPicker for ${category} components...`);
      
      // Simulated scraped data - in production this would be real scraping
      return this.generateMockScrapedComponents(category);
    } catch (error) {
      console.error('Error scraping PCPartPicker:', error);
      return [];
    }
  }

  // Scrape Newegg for pricing and availability
  async scrapeNewegg(searchTerm: string): Promise<Partial<Component>[]> {
    try {
      console.log(`Scraping Newegg for: ${searchTerm}`);
      
      // Simulated Newegg data
      return [
        {
          name: `${searchTerm} - Newegg Special`,
          price: { US: 299, CA: 399, UK: 279, DE: 319, AU: 449 },
          availability: 'in-stock' as const,
          trend: 'down' as const
        }
      ];
    } catch (error) {
      console.error('Error scraping Newegg:', error);
      return [];
    }
  }

  // Reddit API integration for community recommendations
  async getRedditRecommendations(subreddit: string, query: string): Promise<RedditPost[]> {
    try {
      // Using Reddit's free API
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/search.json?q=${query}&limit=50`, {
        headers: {
          'User-Agent': 'PCBuilder/1.0'
        }
      });

      if (!response.ok) {
        console.error('Reddit API error:', response.status);
        return this.generateMockRedditPosts();
      }

      const data = await response.json();
      
      return data.data.children.map((post: any) => ({
        title: post.data.title,
        content: post.data.selftext,
        upvotes: post.data.ups,
        comments: post.data.num_comments,
        url: `https://reddit.com${post.data.permalink}`,
        created: new Date(post.data.created_utc * 1000)
      }));
    } catch (error) {
      console.error('Error fetching Reddit data:', error);
      return this.generateMockRedditPosts();
    }
  }

  // AI-powered component classification using OpenAI
  async classifyComponent(componentText: string): Promise<{
    category: string;
    specs: any;
    compatibility: string[];
    isValid: boolean;
  }> {
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not provided, using fallback classification');
      return this.fallbackClassification(componentText);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a PC component classification expert. Analyze component descriptions and return JSON with category, specs, and compatibility info.'
            },
            {
              role: 'user',
              content: `Classify this PC component: ${componentText}`
            }
          ],
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      return {
        category: result.category || 'unknown',
        specs: result.specs || {},
        compatibility: result.compatibility || [],
        isValid: result.isValid !== false
      };
    } catch (error) {
      console.error('Error with OpenAI classification:', error);
      return this.fallbackClassification(componentText);
    }
  }

  // Parse Reddit posts for component recommendations
  async parseRedditRecommendations(posts: RedditPost[]): Promise<ComponentRecommendation[]> {
    const recommendations: ComponentRecommendation[] = [];

    for (const post of posts) {
      const text = `${post.title} ${post.content}`.toLowerCase();
      
      // Extract component mentions using regex patterns
      const componentPatterns = [
        /rtx\s*\d{4}(?:\s*ti|\s*super)?/gi,
        /gtx\s*\d{4}(?:\s*ti)?/gi,
        /rx\s*\d{4}(?:\s*xt)?/gi,
        /ryzen\s*\d+\s*\d{4}[x]?/gi,
        /intel?\s*i\d-\d{4,5}[kf]?/gi,
        /ddr[45]-\d{4,5}/gi
      ];

      for (const pattern of componentPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            recommendations.push({
              component: match.trim(),
              budget: this.extractBudgetFromText(text),
              mentions: 1,
              sentiment: post.upvotes > 10 ? 'positive' : 'neutral',
              source: 'reddit'
            });
          });
        }
      }
    }

    return this.aggregateRecommendations(recommendations);
  }

  // Detect new product launches
  async detectNewComponents(): Promise<string[]> {
    const newComponents: string[] = [];
    
    try {
      // Check tech news RSS feeds
      const techSites = [
        'https://www.techpowerup.com/rss/news',
        'https://www.anandtech.com/rss/'
      ];

      for (const site of techSites) {
        const newFindings = await this.checkTechNewsForNewComponents(site);
        newComponents.push(...newFindings);
      }

      // Check Reddit for new product discussions
      const redditPosts = await this.getRedditRecommendations('hardware', 'new release announcement');
      const redditFindings = await this.extractNewComponentsFromReddit(redditPosts);
      newComponents.push(...redditFindings);

    } catch (error) {
      console.error('Error detecting new components:', error);
    }

    return [...new Set(newComponents)]; // Remove duplicates
  }

  // Automated database update
  async updateComponentDatabase(): Promise<{
    added: number;
    updated: number;
    removed: number;
    errors: string[];
  }> {
    const result = {
      added: 0,
      updated: 0,
      removed: 0,
      errors: [] as string[]
    };

    try {
      console.log('Starting automated component database update...');

      // Scrape all major sources
      const categories = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'cooler', 'psu', 'case'];
      
      for (const category of categories) {
        try {
          const scrapedComponents = await this.scrapePCPartPicker(category);
          const neweggData = await this.scrapeNewegg(category);
          
          // Merge and process data
          const processedComponents = await this.processScrapedData(scrapedComponents, neweggData);
          
          // Update database (simulated)
          result.added += processedComponents.filter(c => c.isNew).length;
          result.updated += processedComponents.filter(c => c.isUpdated).length;
          
          console.log(`Processed ${processedComponents.length} ${category} components`);
        } catch (error) {
          result.errors.push(`Error processing ${category}: ${error}`);
        }
      }

      // Get Reddit recommendations
      const redditRecommendations = await this.getRedditRecommendations('buildapc', 'best components 2024');
      const parsedRecommendations = await this.parseRedditRecommendations(redditRecommendations);
      
      console.log(`Found ${parsedRecommendations.length} Reddit recommendations`);

      // Detect new components
      const newComponents = await this.detectNewComponents();
      console.log(`Detected ${newComponents.length} potential new components`);

    } catch (error) {
      result.errors.push(`Database update error: ${error}`);
    }

    return result;
  }

  // Helper methods
  private generateMockScrapedComponents(category: string): Component[] {
    // Simulated scraped data - in production this would be real
    const mockComponents: Component[] = [
      {
        id: `scraped-${category}-1`,
        name: `Scraped ${category.toUpperCase()} Component`,
        brand: 'Generic',
        price: { US: 199, CA: 259, UK: 189, DE: 219, AU: 299 },
        specs: { socket: 'AM5', powerDraw: 65 },
        asin: 'B0SCRAPED1',
        availability: 'in-stock',
        trend: 'stable',
        category,
        description: `High-performance ${category} component from scraping`
      }
    ];
    
    return mockComponents;
  }

  private generateMockRedditPosts(): RedditPost[] {
    return [
      {
        title: 'Best GPU for $500 budget?',
        content: 'Looking for RTX 4060 Ti vs RX 7600 XT recommendations',
        upvotes: 45,
        comments: 23,
        url: 'https://reddit.com/r/buildapc/mock1',
        created: new Date()
      },
      {
        title: 'New Ryzen 7000 series worth upgrading?',
        content: 'Currently on Ryzen 5 3600, considering 7700X',
        upvotes: 78,
        comments: 34,
        url: 'https://reddit.com/r/buildapc/mock2',
        created: new Date()
      }
    ];
  }

  private fallbackClassification(componentText: string) {
    // Simple keyword-based classification fallback
    const text = componentText.toLowerCase();
    
    if (text.includes('rtx') || text.includes('gtx') || text.includes('rx')) {
      return { category: 'gpu', specs: {}, compatibility: [], isValid: true };
    } else if (text.includes('ryzen') || text.includes('intel') || text.includes('cpu')) {
      return { category: 'cpu', specs: {}, compatibility: [], isValid: true };
    } else if (text.includes('ddr') || text.includes('ram') || text.includes('memory')) {
      return { category: 'ram', specs: {}, compatibility: [], isValid: true };
    }
    
    return { category: 'unknown', specs: {}, compatibility: [], isValid: false };
  }

  private extractBudgetFromText(text: string): number {
    const budgetPattern = /\$(\d{3,4})/;
    const match = text.match(budgetPattern);
    return match ? parseInt(match[1]) : 0;
  }

  private aggregateRecommendations(recommendations: ComponentRecommendation[]): ComponentRecommendation[] {
    const aggregated = new Map<string, ComponentRecommendation>();
    
    recommendations.forEach(rec => {
      const key = rec.component.toLowerCase();
      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.mentions += rec.mentions;
      } else {
        aggregated.set(key, rec);
      }
    });
    
    return Array.from(aggregated.values()).sort((a, b) => b.mentions - a.mentions);
  }

  private async checkTechNewsForNewComponents(rssUrl: string): Promise<string[]> {
    // Simulated tech news checking
    return ['RTX 6090', 'Ryzen 9000 Series', 'DDR6 Memory'];
  }

  private async extractNewComponentsFromReddit(posts: RedditPost[]): Promise<string[]> {
    const newComponents: string[] = [];
    
    posts.forEach(post => {
      const text = `${post.title} ${post.content}`.toLowerCase();
      if (text.includes('new') || text.includes('announcement') || text.includes('launch')) {
        // Extract potential component names
        const matches = text.match(/\b[a-z0-9]+\s*\d{4}[a-z]*\b/gi);
        if (matches) {
          newComponents.push(...matches);
        }
      }
    });
    
    return newComponents;
  }

  private async processScrapedData(scraped: Component[], newegg: Partial<Component>[]): Promise<any[]> {
    return scraped.map(component => ({
      ...component,
      isNew: Math.random() > 0.8, // Simulated new detection
      isUpdated: Math.random() > 0.6 // Simulated update detection
    }));
  }
}

export const componentScrapingService = new ComponentScrapingService();
