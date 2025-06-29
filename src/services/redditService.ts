import { Component } from '../data/components';
import { Region } from '../utils/budgetAllocator';

export interface RedditPost {
  title: string;
  selftext: string;
  url: string;
  score: number;
  created: number;
  author: string;
  subreddit: string;
  permalink: string;
}

export interface RedditComment {
  body: string;
  score: number;
  author: string;
  created: number;
}

export interface ComponentMention {
  name: string;
  normalizedName: string;
  type: 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'cooler' | 'psu' | 'case';
  confidence: number;
  context: string;
  price?: number;
  recommended: boolean;
  reasons: string[];
  redditScore: number;
  firstSeen: number;
  lastUpdated: number;
}

export interface ComponentInsight {
  component: string;
  insights: string[];
  pros: string[];
  cons: string[];
  bestFor: string[];
  sourceComments: RedditComment[];
}

class RedditService {
  private baseUrl = 'https://www.reddit.com';
  private requestCount = 0;
  private lastRequestTime = 0;
  private rateLimitDelay = 3000; // 3 seconds between requests
  private componentCache = new Map<string, ComponentMention>();
  private insightCache = new Map<string, ComponentInsight>();
  private lastCacheUpdate = 0;
  private cacheUpdateInterval = 15 * 60 * 1000; // 15 minutes

  // Dynamic component patterns that learn from Reddit
  private componentPatterns = {
    gpu: [
      // Current and future RTX patterns
      /rtx\s*[5-9]\d{2,3}\s*(ti|super|xt)?/gi,
      // AMD RX patterns for future generations
      /rx\s*[7-9]\d{3}\s*(xt|gre|pro)?/gi,
      // Intel Arc current and future
      /arc\s*[a-z]\d{3,4}/gi,
      // Generic GPU pattern for unknown future brands
      /\b[a-z]{2,6}\s*[5-9]\d{2,4}\s*(ti|super|xt|pro)?\b/gi
    ],
    cpu: [
      // Intel future generations (14th, 15th, 16th+)
      /i[3579]-1[4-9]\d{3}[kf]?/gi,
      // AMD Ryzen future series (7000, 8000, 9000+)
      /ryzen\s*[3579]\s*[7-9]\d{3}[x]?[3d]?/gi,
      // Generic CPU pattern
      /\b(core|ryzen)\s*[i3579]?\s*[7-9]\d{3}[a-z]?\b/gi
    ],
    ram: [
      /ddr[5-6]-\d{4,5}/gi,
      /\d{1,3}gb\s*ddr[5-6]/gi,
      /\d+gb\s*(cl\d+|cas\d+)/gi
    ],
    storage: [
      /\d+[tg]b\s*(nvme|ssd|m\.2|pcie\s*[4-5])/gi,
      /(samsung|wd|crucial|corsair|kingston)\s*(9[8-9]\d|[1-9]\d{3})/gi
    ]
  };

  private async makeRequest(url: string): Promise<any> {
    const now = Date.now();
    if (now - this.lastRequestTime < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - (now - this.lastRequestTime)));
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PCBuilder/1.0 (Self-updating component discovery)'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer
          this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 30000);
          throw new Error('Rate limited - will retry with longer delay');
        }
        throw new Error(`Reddit API responded with ${response.status}`);
      }

      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      // Reduce delay on successful requests
      this.rateLimitDelay = Math.max(this.rateLimitDelay * 0.9, 3000);
      
      return await response.json();
    } catch (error) {
      console.error('Reddit API request failed:', error);
      throw error;
    }
  }

  async fetchLatestPosts(subreddit: string = 'buildmeapc', limit: number = 100): Promise<RedditPost[]> {
    const url = `${this.baseUrl}/r/${subreddit}/new.json?limit=${limit}`;
    
    try {
      const data = await this.makeRequest(url);
      return data.data.children.map((child: any) => ({
        title: child.data.title,
        selftext: child.data.selftext,
        url: child.data.url,
        score: child.data.score,
        created: child.data.created_utc,
        author: child.data.author,
        subreddit: child.data.subreddit,
        permalink: child.data.permalink
      }));
    } catch (error) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, error);
      return [];
    }
  }

  async fetchPostComments(permalink: string): Promise<RedditComment[]> {
    const url = `${this.baseUrl}${permalink}.json?limit=50`;
    
    try {
      const data = await this.makeRequest(url);
      if (!data[1] || !data[1].data || !data[1].data.children) return [];
      
      return data[1].data.children
        .filter((child: any) => child.data.body && child.data.body !== '[deleted]')
        .map((child: any) => ({
          body: child.data.body,
          score: child.data.score,
          author: child.data.author,
          created: child.data.created_utc
        }))
        .filter((comment: RedditComment) => comment.score > 1); // Only comments with positive score
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }

  async discoverLatestComponents(): Promise<ComponentMention[]> {
    const now = Date.now();
    
    // Check if cache is still fresh
    if (now - this.lastCacheUpdate < this.cacheUpdateInterval && this.componentCache.size > 0) {
      return Array.from(this.componentCache.values());
    }

    console.log('Discovering latest components from Reddit...');
    
    try {
      // Fetch from multiple subreddits for better coverage
      const [buildmeapcPosts, buildapcPosts] = await Promise.all([
        this.fetchLatestPosts('buildmeapc', 100),
        this.fetchLatestPosts('buildapc', 50)
      ]);

      const allPosts = [...buildmeapcPosts, ...buildapcPosts]
        .filter(post => post.created > (now / 1000) - (7 * 24 * 60 * 60)) // Last 7 days only
        .sort((a, b) => b.created - a.created); // Most recent first

      console.log(`Processing ${allPosts.length} recent posts...`);

      const mentions: ComponentMention[] = [];
      
      for (const post of allPosts) {
        const postMentions = await this.parseComponentMentions(post);
        mentions.push(...postMentions);
      }

      // Update cache with discovered components
      this.updateComponentCache(mentions);
      this.lastCacheUpdate = now;

      console.log(`Discovered ${mentions.length} component mentions`);
      return Array.from(this.componentCache.values());
      
    } catch (error) {
      console.error('Failed to discover components:', error);
      // Return cached data if discovery fails
      return Array.from(this.componentCache.values());
    }
  }

  private async parseComponentMentions(post: RedditPost): Promise<ComponentMention[]> {
    const mentions: ComponentMention[] = [];
    const fullText = `${post.title} ${post.selftext}`.toLowerCase();
    
    // Parse each component type
    for (const [type, patterns] of Object.entries(this.componentPatterns)) {
      for (const pattern of patterns) {
        const matches = fullText.match(pattern);
        if (matches) {
          for (const match of matches) {
            const normalizedName = this.normalizeComponentName(match);
            const existing = mentions.find(m => m.normalizedName === normalizedName);
            
            if (!existing) {
              const confidence = this.calculateConfidence(post, match, fullText);
              const isRecommended = this.isRecommendation(fullText, match);
              const reasons = this.extractReasons(fullText, match);
              
              mentions.push({
                name: match.trim(),
                normalizedName,
                type: type as ComponentMention['type'],
                confidence,
                context: this.extractContext(fullText, match),
                recommended: isRecommended,
                reasons,
                redditScore: post.score,
                firstSeen: post.created * 1000,
                lastUpdated: Date.now()
              });
            }
          }
        }
      }
    }

    return mentions;
  }

  private updateComponentCache(newMentions: ComponentMention[]): void {
    for (const mention of newMentions) {
      const existing = this.componentCache.get(mention.normalizedName);
      
      if (!existing) {
        this.componentCache.set(mention.normalizedName, mention);
      } else {
        // Update existing with better data
        if (mention.confidence > existing.confidence) {
          existing.confidence = mention.confidence;
          existing.context = mention.context;
        }
        
        existing.reasons = [...new Set([...existing.reasons, ...mention.reasons])];
        existing.lastUpdated = Date.now();
        existing.redditScore = Math.max(existing.redditScore, mention.redditScore);
      }
    }
  }

  async getComponentInsights(componentName: string): Promise<ComponentInsight | null> {
    const normalizedName = this.normalizeComponentName(componentName);
    const cached = this.insightCache.get(normalizedName);
    
    if (cached) return cached;

    try {
      // Search for posts specifically about this component
      const searchUrl = `${this.baseUrl}/r/buildapc/search.json?q=${encodeURIComponent(componentName)}&restrict_sr=1&sort=top&t=month&limit=10`;
      const searchData = await this.makeRequest(searchUrl);
      
      const insights: string[] = [];
      const pros: string[] = [];
      const cons: string[] = [];
      const bestFor: string[] = [];
      const sourceComments: RedditComment[] = [];

      if (searchData.data && searchData.data.children) {
        for (const post of searchData.data.children.slice(0, 5)) { // Top 5 posts
          const comments = await this.fetchPostComments(post.data.permalink);
          
          for (const comment of comments.slice(0, 10)) { // Top 10 comments per post
            const analysis = this.analyzeComment(comment.body, componentName);
            
            insights.push(...analysis.insights);
            pros.push(...analysis.pros);
            cons.push(...analysis.cons);
            bestFor.push(...analysis.bestFor);
            
            if (analysis.insights.length > 0) {
              sourceComments.push(comment);
            }
          }
        }
      }

      const insight: ComponentInsight = {
        component: componentName,
        insights: [...new Set(insights)].slice(0, 5),
        pros: [...new Set(pros)].slice(0, 3),
        cons: [...new Set(cons)].slice(0, 3),
        bestFor: [...new Set(bestFor)].slice(0, 3),
        sourceComments: sourceComments.slice(0, 5)
      };

      this.insightCache.set(normalizedName, insight);
      return insight;
      
    } catch (error) {
      console.error('Failed to get component insights:', error);
      return null;
    }
  }

  private analyzeComment(commentBody: string, componentName: string): {
    insights: string[];
    pros: string[];
    cons: string[];
    bestFor: string[];
  } {
    const text = commentBody.toLowerCase();
    const component = componentName.toLowerCase();
    
    const insights: string[] = [];
    const pros: string[] = [];
    const cons: string[] = [];
    const bestFor: string[] = [];

    // Skip if comment doesn't mention the component
    if (!text.includes(component.split(' ')[0])) {
      return { insights, pros, cons, bestFor };
    }

    // Extract insights using keyword patterns
    const sentences = commentBody.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      // Skip if sentence doesn't relate to our component
      if (!lowerSentence.includes(component.split(' ')[0])) continue;
      
      // Positive indicators
      if (this.matchesPatterns(lowerSentence, [
        'great', 'excellent', 'amazing', 'perfect', 'recommend', 'love',
        'fantastic', 'solid choice', 'good value', 'worth it'
      ])) {
        pros.push(sentence.trim());
      }
      
      // Negative indicators
      if (this.matchesPatterns(lowerSentence, [
        'avoid', 'terrible', 'bad', 'disappointed', 'regret', 'issues',
        'problems', 'don\'t buy', 'waste of money'
      ])) {
        cons.push(sentence.trim());
      }
      
      // Use case indicators
      if (this.matchesPatterns(lowerSentence, [
        'gaming', '4k', '1440p', '1080p', 'streaming', 'content creation',
        'video editing', 'budget', 'high-end', 'enthusiast'
      ])) {
        bestFor.push(sentence.trim());
      }
      
      // General insights
      if (this.matchesPatterns(lowerSentence, [
        'performance', 'fps', 'temperature', 'power consumption', 'value',
        'price to performance', 'future proof', 'upgrade'
      ])) {
        insights.push(sentence.trim());
      }
    }

    return { insights, pros, cons, bestFor };
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  private normalizeComponentName(name: string): string {
    return name.replace(/\s+/g, ' ')
               .trim()
               .toLowerCase()
               .replace(/[^\w\s-]/g, '');
  }

  private calculateConfidence(post: RedditPost, component: string, fullText: string): number {
    let confidence = 0.3; // Base confidence

    // Post score factor
    if (post.score > 20) confidence += 0.2;
    if (post.score > 50) confidence += 0.1;
    if (post.score > 100) confidence += 0.1;

    // Subreddit factor
    if (post.subreddit === 'buildmeapc') confidence += 0.2;

    // Context factors
    const context = this.extractContext(fullText, component);
    if (context.includes('recommend') || context.includes('suggest')) confidence += 0.2;
    if (context.includes('best') || context.includes('good')) confidence += 0.15;
    if (context.includes('budget') && context.includes('build')) confidence += 0.1;

    // Recency factor (newer posts get slight boost)
    const daysSincePost = (Date.now() / 1000 - post.created) / (24 * 60 * 60);
    if (daysSincePost < 1) confidence += 0.1;
    else if (daysSincePost < 7) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  private isRecommendation(text: string, component: string): boolean {
    const context = this.extractContext(text, component);
    
    const positiveWords = [
      'recommend', 'suggest', 'go with', 'pick', 'choose', 'best',
      'good choice', 'solid', 'great', 'excellent', 'perfect for'
    ];
    
    const negativeWords = [
      'avoid', 'don\'t', 'not good', 'bad', 'terrible', 'skip',
      'wouldn\'t recommend', 'stay away', 'issues', 'problems'
    ];

    const hasPositive = positiveWords.some(word => context.includes(word));
    const hasNegative = negativeWords.some(word => context.includes(word));

    return hasPositive && !hasNegative;
  }

  private extractReasons(text: string, component: string): string[] {
    const context = this.extractContext(text, component);
    const reasons: string[] = [];
    
    const reasonPatterns = [
      { pattern: /great performance/i, reason: 'Great performance' },
      { pattern: /good value|price.*performance/i, reason: 'Good value for money' },
      { pattern: /future.?proof/i, reason: 'Future-proof' },
      { pattern: /runs cool|low temp/i, reason: 'Runs cool' },
      { pattern: /quiet|silent/i, reason: 'Quiet operation' },
      { pattern: /reliable|stable/i, reason: 'Reliable' },
      { pattern: /easy.*install/i, reason: 'Easy to install' },
      { pattern: /good.*gaming/i, reason: 'Good for gaming' },
      { pattern: /budget.*friendly/i, reason: 'Budget-friendly' }
    ];

    for (const { pattern, reason } of reasonPatterns) {
      if (pattern.test(context)) {
        reasons.push(reason);
      }
    }

    return reasons;
  }

  private extractContext(text: string, component: string): string {
    const index = text.toLowerCase().indexOf(component.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 150);
    const end = Math.min(text.length, index + component.length + 150);
    
    return text.substring(start, end);
  }

  // Convert discovered components to the app's Component format
  async getLatestComponentsForType(type: ComponentMention['type'], region: Region): Promise<Component[]> {
    const mentions = await this.discoverLatestComponents();
    const typeMentions = mentions
      .filter(m => m.type === type && m.recommended && m.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // Top 20 components per type

    const components: Component[] = [];
    
    for (const mention of typeMentions) {
      const component = await this.convertMentionToComponent(mention, region);
      if (component) {
        components.push(component);
      }
    }

    return components;
  }

  private async convertMentionToComponent(mention: ComponentMention, region: Region): Promise<Component | null> {
    try {
      const insights = await this.getComponentInsights(mention.name);
      
      return {
        id: `reddit-${mention.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: this.capitalizeComponentName(mention.name),
        brand: this.extractBrand(mention.name),
        price: this.estimatePrice(mention, region),
        specs: this.estimateSpecs(mention),
        asin: '', // Would need separate price API integration
        availability: 'in-stock' as const,
        trend: 'up' as const,
        category: mention.type,
        description: insights ? 
          `${insights.insights[0] || 'Latest recommendation from Reddit community'} • Confidence: ${Math.round(mention.confidence * 100)}%` :
          `Latest recommendation from Reddit • ${mention.reasons.join(', ')}`
      };
    } catch (error) {
      console.error('Failed to convert mention to component:', error);
      return null;
    }
  }

  private capitalizeComponentName(name: string): string {
    return name.split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
               .join(' ');
  }

  private extractBrand(name: string): string {
    const lowerName = name.toLowerCase();
    const brands = [
      'amd', 'intel', 'nvidia', 'asus', 'msi', 'gigabyte', 'evga',
      'corsair', 'gskill', 'crucial', 'samsung', 'wd', 'seagate',
      'noctua', 'cooler master', 'be quiet', 'seasonic', 'fractal'
    ];
    
    for (const brand of brands) {
      if (lowerName.includes(brand)) {
        return brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    
    // Extract first word as potential brand
    const firstWord = name.split(' ')[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }

  private estimatePrice(mention: ComponentMention, region: Region): Record<Region, number> {
    const basePrice = this.getBasePriceEstimate(mention);
    
    const regionMultipliers: Record<Region, number> = {
      US: 1.0,
      CA: 1.25,
      UK: 1.15,
      DE: 1.1,
      AU: 1.35
    };

    const prices: Record<Region, number> = {} as Record<Region, number>;
    for (const [r, multiplier] of Object.entries(regionMultipliers)) {
      prices[r as Region] = Math.round(basePrice * multiplier);
    }

    return prices;
  }

  private getBasePriceEstimate(mention: ComponentMention): number {
    const name = mention.name.toLowerCase();
    
    // Future-proof price estimation based on patterns
    if (mention.type === 'gpu') {
      // RTX patterns
      if (name.includes('90')) return this.estimateHighEndGPU(name);
      if (name.includes('80')) return this.estimateMidHighGPU(name);
      if (name.includes('70')) return this.estimateMidRangeGPU(name);
      if (name.includes('60')) return this.estimateBudgetGPU(name);
      
      // AMD patterns
      if (name.includes('7900') || name.includes('8900')) return 800;
      if (name.includes('7800') || name.includes('8800')) return 600;
      if (name.includes('7700') || name.includes('8700')) return 450;
    }
    
    if (mention.type === 'cpu') {
      if (name.includes('i9') || name.includes('ryzen 9')) return 500;
      if (name.includes('i7') || name.includes('ryzen 7')) return 350;
      if (name.includes('i5') || name.includes('ryzen 5')) return 250;
      if (name.includes('i3') || name.includes('ryzen 3')) return 150;
    }

    // Default estimates by type
    const typeDefaults = {
      gpu: 400,
      cpu: 300,
      motherboard: 150,
      ram: 100,
      storage: 80,
      cooler: 60,
      psu: 100,
      case: 80
    };

    return typeDefaults[mention.type] || 100;
  }

  private estimateHighEndGPU(name: string): number {
    // Estimate based on generation
    if (name.includes('50') || name.includes('60')) return 1600; // Future RTX 5090/6090
    if (name.includes('40')) return 1500; // RTX 4090
    return 1400;
  }

  private estimateMidHighGPU(name: string): number {
    if (name.includes('50') || name.includes('60')) return 1000;
    if (name.includes('40')) return 900;
    return 800;
  }

  private estimateMidRangeGPU(name: string): number {
    if (name.includes('50') || name.includes('60')) return 600;
    if (name.includes('40')) return 500;
    return 450;
  }

  private estimateBudgetGPU(name: string): number {
    if (name.includes('50') || name.includes('60')) return 350;
    if (name.includes('40')) return 300;
    return 250;
  }

  private estimateSpecs(mention: ComponentMention): any {
    const specs: any = {};
    const name = mention.name.toLowerCase();
    
    if (mention.type === 'cpu') {
      // Socket estimation
      if (name.includes('intel')) {
        specs.socket = name.includes('14') || name.includes('15') ? 'LGA1700' : 'LGA1200';
      } else if (name.includes('amd') || name.includes('ryzen')) {
        specs.socket = 'AM5'; // Future AMD will likely use AM5 or newer
      }
      
      // Power draw estimation
      if (name.includes('i9') || name.includes('ryzen 9')) specs.powerDraw = 125;
      else if (name.includes('i7') || name.includes('ryzen 7')) specs.powerDraw = 105;
      else specs.powerDraw = 65;
    }
    
    if (mention.type === 'gpu') {
      // Power draw estimation for future GPUs
      if (name.includes('90')) specs.powerDraw = 450;
      else if (name.includes('80')) specs.powerDraw = 320;
      else if (name.includes('70')) specs.powerDraw = 220;
      else specs.powerDraw = 180;
    }

    return specs;
  }

  // Public method to get tooltip data
  async getComponentTooltip(componentName: string): Promise<{
    insights: string[];
    pros: string[];
    cons: string[];
    redditScore: number;
  } | null> {
    const insights = await this.getComponentInsights(componentName);
    const mention = this.componentCache.get(this.normalizeComponentName(componentName));
    
    if (!insights && !mention) return null;
    
    return {
      insights: insights?.insights || [],
      pros: insights?.pros || [],
      cons: insights?.cons || [],
      redditScore: mention?.redditScore || 0
    };
  }
}

export const redditService = new RedditService();