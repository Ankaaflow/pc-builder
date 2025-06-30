// Reddit Component Extractor
// Automatically extracts component mentions from r/buildapc and r/buildapcforme and populates database

import { componentDatabaseService, DatabaseComponent, RedditMention } from './componentDatabaseService';
import { amazonProductMatchingService } from './amazonProductMatchingService';

interface ExtractedComponent {
  name: string;
  brand: string;
  category: 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'cooler' | 'case';
  model_number?: string;
  confidence: number;
  context: string;
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  created_utc: number;
  author: string;
  url: string;
  score: number;
}

class RedditComponentExtractor {
  
  // Component patterns for extraction
  private componentPatterns = {
    cpu: {
      brands: ['Intel', 'AMD', 'Ryzen', 'Core'],
      patterns: [
        /(?:Intel )?Core i[3579]-\d{4,5}[KF]?[S]?/gi,
        /(?:AMD )?Ryzen [3579] \d{4}[X]?[3D]?/gi,
        /(?:Intel )?Core i[3579]-\d{2,3}\d{2,3}[KF]?[S]?/gi,
        /Intel \d{2,3}th Gen/gi,
        /Ryzen [3579]000[X]? series/gi
      ]
    },
    gpu: {
      brands: ['NVIDIA', 'AMD', 'Intel', 'RTX', 'GTX', 'RX', 'Arc'],
      patterns: [
        /(?:NVIDIA )?(?:GeForce )?RTX \d{4}[\w\s]*?(?:Ti|Super)?/gi,
        /(?:NVIDIA )?(?:GeForce )?GTX \d{4}[\w\s]*?(?:Ti|Super)?/gi,
        /(?:AMD )?(?:Radeon )?RX \d{4}[\w\s]*?(?:XT|XTX)?/gi,
        /Intel Arc A\d{3}/gi,
        /RTX \d{2} series/gi
      ]
    },
    motherboard: {
      brands: ['ASUS', 'MSI', 'Gigabyte', 'ASRock', 'EVGA'],
      patterns: [
        /[A-Z][0-9]{3,4}[\w\-\s]*(?:motherboard|mobo|MB)/gi,
        /(?:ASUS|MSI|Gigabyte|ASRock) [\w\-\s]*(?:motherboard|mobo)/gi,
        /B\d{3}[\w\-\s]*chipset/gi,
        /Z\d{3}[\w\-\s]*chipset/gi,
        /X\d{3}[\w\-\s]*chipset/gi
      ]
    },
    ram: {
      brands: ['Corsair', 'G.Skill', 'Kingston', 'Crucial', 'Teamgroup'],
      patterns: [
        /\d{1,3}GB DDR[45][\w\-\s]*\d{4,5}/gi,
        /(?:Corsair|G\.Skill|Kingston|Crucial) [\w\s]*DDR[45]/gi,
        /DDR[45]-\d{4,5}/gi,
        /\d{1,3}GB (?:kit|memory|RAM)/gi
      ]
    },
    storage: {
      brands: ['Samsung', 'WD', 'Seagate', 'Crucial', 'Kingston'],
      patterns: [
        /\d+(?:TB|GB) (?:SSD|NVMe|M\.2)/gi,
        /Samsung \d{3} (?:PRO|EVO)/gi,
        /WD (?:Black|Blue|Red)/gi,
        /(?:Samsung|WD|Seagate|Crucial) [\w\s]*(?:SSD|NVMe)/gi
      ]
    },
    psu: {
      brands: ['Corsair', 'EVGA', 'Seasonic', 'be quiet!', 'Cooler Master'],
      patterns: [
        /\d{3,4}W (?:PSU|power supply)/gi,
        /(?:Corsair|EVGA|Seasonic) [\w\s]*\d{3,4}W/gi,
        /80\+ (?:Gold|Bronze|Platinum|Titanium)/gi
      ]
    },
    cooler: {
      brands: ['Noctua', 'be quiet!', 'Cooler Master', 'ARCTIC', 'Corsair'],
      patterns: [
        /(?:Noctua|be quiet!|Cooler Master) [\w\-\s]*cooler/gi,
        /AIO [\w\s]*\d{3}mm/gi,
        /\d{3}mm (?:AIO|radiator)/gi,
        /CPU cooler/gi
      ]
    },
    case: {
      brands: ['Fractal', 'NZXT', 'Corsair', 'be quiet!', 'Lian Li'],
      patterns: [
        /(?:Fractal|NZXT|Corsair|be quiet!|Lian Li) [\w\s]*case/gi,
        /(?:ATX|mATX|ITX) (?:case|tower)/gi,
        /PC case/gi
      ]
    }
  };

  /**
   * Extract components from Reddit post text
   */
  extractComponentsFromText(text: string, context: string = ''): ExtractedComponent[] {
    const extracted: ExtractedComponent[] = [];
    
    for (const [category, config] of Object.entries(this.componentPatterns)) {
      for (const pattern of config.patterns) {
        const matches = text.match(pattern);
        
        if (matches) {
          for (const match of matches) {
            const component = this.parseComponentMatch(
              match, 
              category as keyof typeof this.componentPatterns,
              config.brands,
              context
            );
            
            if (component) {
              extracted.push(component);
            }
          }
        }
      }
    }

    // Remove duplicates and sort by confidence
    return this.deduplicateComponents(extracted)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Parse individual component match
   */
  private parseComponentMatch(
    match: string, 
    category: keyof typeof this.componentPatterns,
    brands: string[],
    context: string
  ): ExtractedComponent | null {
    const cleanMatch = match.trim();
    
    // Extract brand
    const brand = brands.find(b => 
      cleanMatch.toLowerCase().includes(b.toLowerCase())
    ) || this.extractBrandFromMatch(cleanMatch);

    if (!brand) {
      return null;
    }

    // Calculate confidence based on various factors
    const confidence = this.calculateExtractionConfidence(cleanMatch, category, context);

    // Extract model number if possible
    const modelNumber = this.extractModelNumber(cleanMatch, category);

    return {
      name: cleanMatch,
      brand,
      category,
      model_number: modelNumber,
      confidence,
      context
    };
  }

  /**
   * Extract brand from component match
   */
  private extractBrandFromMatch(match: string): string {
    const allBrands = [
      'Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock', 'EVGA',
      'Corsair', 'G.Skill', 'Kingston', 'Crucial', 'Samsung', 'WD', 'Seagate',
      'Noctua', 'be quiet!', 'Cooler Master', 'ARCTIC', 'Fractal', 'NZXT', 'Lian Li'
    ];

    return allBrands.find(brand => 
      match.toLowerCase().includes(brand.toLowerCase())
    ) || 'Unknown';
  }

  /**
   * Extract model number from component name
   */
  private extractModelNumber(match: string, category: string): string | undefined {
    const modelPatterns = {
      cpu: /(?:i[3579]-)?(\d{4,5}[KF]?[S]?)|(?:Ryzen [3579] )(\d{4}[X]?[3D]?)/i,
      gpu: /(RTX|GTX|RX) (\d{4})[\w\s]*?(Ti|Super|XT|XTX)?/i,
      ram: /DDR[45]-(\d{4,5})/i,
      storage: /(\d{3}) (?:PRO|EVO)/i
    };

    const pattern = modelPatterns[category as keyof typeof modelPatterns];
    if (!pattern) return undefined;

    const match_result = match.match(pattern);
    return match_result ? match_result[0] : undefined;
  }

  /**
   * Calculate confidence score for extracted component
   */
  private calculateExtractionConfidence(match: string, category: string, context: string): number {
    let confidence = 0.5; // Base confidence

    // Length and specificity
    if (match.length > 15) confidence += 0.2;
    if (match.includes('-')) confidence += 0.1; // Model numbers often have dashes

    // Category-specific confidence boosts
    const categoryBoosts = {
      cpu: /(?:CPU|processor|Intel|AMD|Ryzen|Core)/i,
      gpu: /(?:GPU|graphics|video|RTX|GTX|RX)/i,
      ram: /(?:RAM|memory|DDR)/i,
      storage: /(?:SSD|NVMe|storage|drive)/i
    };

    const boost = categoryBoosts[category as keyof typeof categoryBoosts];
    if (boost && context.match(boost)) {
      confidence += 0.2;
    }

    // Context confidence
    if (context.toLowerCase().includes('build') || 
        context.toLowerCase().includes('pc') ||
        context.toLowerCase().includes('computer')) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Remove duplicate components
   */
  private deduplicateComponents(components: ExtractedComponent[]): ExtractedComponent[] {
    const seen = new Set<string>();
    return components.filter(component => {
      const key = `${component.brand}-${component.name}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Process Reddit post and extract components
   */
  async processRedditPost(post: RedditPost): Promise<void> {
    console.log(`📝 Processing Reddit post: ${post.id} from r/${post.subreddit}`);

    try {
      const fullText = `${post.title} ${post.selftext}`;
      const extractedComponents = this.extractComponentsFromText(fullText, post.title);

      console.log(`Found ${extractedComponents.length} components in post ${post.id}`);

      for (const extracted of extractedComponents) {
        // Only process high-confidence extractions
        if (extracted.confidence < 0.6) {
          continue;
        }

        // Create or find component in database
        const dbComponent = await this.createOrFindComponent(extracted);
        
        if (dbComponent) {
          // Add Reddit mention
          await this.addRedditMention(post, dbComponent, extracted);
          
          // Update popularity
          await componentDatabaseService.updateComponentPopularity(dbComponent.id, 'reddit');
          
          // Try to find/update Amazon link
          await amazonProductMatchingService.updateComponentAmazonLink(dbComponent, 'US');
        }
      }

      console.log(`✅ Processed post ${post.id}`);

    } catch (error) {
      console.error(`Error processing post ${post.id}:`, error);
    }
  }

  /**
   * Create or find component in database
   */
  private async createOrFindComponent(extracted: ExtractedComponent): Promise<DatabaseComponent | null> {
    // First, search for existing component
    const existing = await componentDatabaseService.searchComponents(extracted.name);
    
    // Check for exact match
    const exactMatch = existing.find(comp => 
      comp.name.toLowerCase() === extracted.name.toLowerCase() &&
      comp.brand.toLowerCase() === extracted.brand.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Create new component
    const newComponent: Omit<DatabaseComponent, 'id' | 'created_at' | 'updated_at'> = {
      name: extracted.name,
      brand: extracted.brand,
      category: extracted.category,
      model_number: extracted.model_number,
      description: `Extracted from Reddit with ${Math.round(extracted.confidence * 100)}% confidence`,
      specs: {},
      is_active: true,
      source: 'reddit'
    };

    return await componentDatabaseService.upsertComponent(newComponent);
  }

  /**
   * Add Reddit mention to database
   */
  private async addRedditMention(
    post: RedditPost, 
    component: DatabaseComponent, 
    extracted: ExtractedComponent
  ): Promise<void> {
    const mention: Omit<RedditMention, 'id' | 'extracted_at'> = {
      component_id: component.id,
      post_id: post.id,
      subreddit: post.subreddit,
      mention_text: extracted.name,
      context: extracted.context,
      budget_range: this.extractBudgetFromText(`${post.title} ${post.selftext}`),
      sentiment: 'neutral', // Could be enhanced with sentiment analysis
      confidence: extracted.confidence,
      post_created_at: new Date(post.created_utc * 1000).toISOString()
    };

    await componentDatabaseService.addRedditMention(mention);
  }

  /**
   * Extract budget information from post text
   */
  private extractBudgetFromText(text: string): number | undefined {
    const budgetPatterns = [
      /\$(\d{1,4}),?(\d{3})?/g,
      /(\d{1,4}),?(\d{3})?\s*(?:dollars?|USD|\$)/gi,
      /budget.*?(\d{1,4}),?(\d{3})?/gi
    ];

    for (const pattern of budgetPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const amount = parseInt(match[1] + (match[2] || ''));
        if (amount >= 300 && amount <= 10000) { // Reasonable PC budget range
          return amount;
        }
      }
    }

    return undefined;
  }

  /**
   * Fetch recent posts from Reddit subreddits
   */
  async fetchRecentRedditPosts(subreddits: string[] = ['buildapc', 'buildapcforme'], limit: number = 25): Promise<RedditPost[]> {
    const posts: RedditPost[] = [];

    for (const subreddit of subreddits) {
      try {
        console.log(`📡 Fetching posts from r/${subreddit}...`);
        
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`, {
          headers: {
            'User-Agent': 'pc-builder-component-extractor/1.0'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const subredditPosts = data.data.children.map((child: any) => child.data);
        
        posts.push(...subredditPosts);
        console.log(`✅ Fetched ${subredditPosts.length} posts from r/${subreddit}`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error fetching r/${subreddit}:`, error);
      }
    }

    return posts;
  }

  /**
   * Run full Reddit component extraction process
   */
  async runExtractionProcess(): Promise<void> {
    console.log('🚀 Starting Reddit component extraction process...');
    
    await componentDatabaseService.logProcess('reddit_extraction', 'started');

    try {
      // Fetch recent posts
      const posts = await this.fetchRecentRedditPosts();
      console.log(`📋 Found ${posts.length} total posts to process`);

      // Process posts
      let processed = 0;
      let failed = 0;

      for (const post of posts) {
        try {
          await this.processRedditPost(post);
          processed++;
        } catch (error) {
          console.error(`Failed to process post ${post.id}:`, error);
          failed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ Reddit extraction complete: ${processed} processed, ${failed} failed`);
      
      await componentDatabaseService.logProcess(
        'reddit_extraction',
        'completed',
        `Processed ${processed} posts, ${failed} failed`,
        { processed, failed, total: posts.length }
      );

    } catch (error) {
      console.error('Reddit extraction failed:', error);
      await componentDatabaseService.logProcess('reddit_extraction', 'failed', error.message);
    }
  }
}

export const redditComponentExtractor = new RedditComponentExtractor();