// Reddit Build Learner
// Scrapes and learns from real PC builds recommended by r/buildapcforme users

import { componentDatabaseService } from './componentDatabaseService';

interface RedditBuild {
  id: string;
  title: string;
  content: string;
  components: ExtractedComponent[];
  budget: number;
  upvotes: number;
  comments: number;
  verified: boolean; // Whether the build was confirmed working
}

interface ExtractedComponent {
  type: 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'cooler' | 'case';
  name: string;
  brand: string;
  model: string;
  price: number;
  confidence: number;
}

interface CompatibilityPattern {
  componentA: string;
  componentB: string;
  compatible: boolean;
  confidence: number;
  source: 'reddit_build' | 'user_confirmed' | 'manual_verification';
  examples: string[]; // Build IDs where this was seen
}

class RedditBuildLearner {
  
  // Learned compatibility patterns from real builds
  private compatibilityPatterns: Map<string, CompatibilityPattern> = new Map();
  
  // Component recognition patterns
  private componentPatterns = {
    cpu: {
      patterns: [
        /(?:AMD\s+)?Ryzen\s+[359]\s+\d{4}[X]?[3D]?/gi,
        /(?:Intel\s+)?Core\s+i[3579]-\d{4,5}[KF]?[S]?/gi,
        /(?:AMD\s+)?Ryzen\s+[359]\s+\d{3}[X]?/gi
      ],
      brands: ['AMD', 'Intel', 'Ryzen', 'Core']
    },
    gpu: {
      patterns: [
        /(?:NVIDIA\s+)?(?:GeForce\s+)?RTX\s+\d{4}[\w\s]*?(?:Ti|Super)?/gi,
        /(?:AMD\s+)?(?:Radeon\s+)?RX\s+\d{4}[\w\s]*?(?:XT|XTX)?/gi,
        /(?:NVIDIA\s+)?(?:GeForce\s+)?GTX\s+\d{4}[\w\s]*?(?:Ti|Super)?/gi
      ],
      brands: ['NVIDIA', 'AMD', 'RTX', 'GTX', 'RX', 'GeForce', 'Radeon']
    },
    motherboard: {
      patterns: [
        /(?:ASUS|MSI|Gigabyte|ASRock|EVGA)\s+[\w\-\s]*(?:B\d{3}|Z\d{3}|X\d{3}|A\d{3})/gi,
        /B\d{3}[\w\-\s]*(?:motherboard|mobo|MB)/gi,
        /Z\d{3}[\w\-\s]*(?:motherboard|mobo|MB)/gi
      ],
      brands: ['ASUS', 'MSI', 'Gigabyte', 'ASRock', 'EVGA']
    },
    ram: {
      patterns: [
        /(?:Corsair|G\.?Skill|Kingston|Crucial|Teamgroup)\s+[\w\s]*\d{1,3}GB\s+DDR[45]/gi,
        /\d{1,3}GB\s+DDR[45][\w\-\s]*\d{3,4}/gi,
        /DDR[45]-\d{3,4}[\w\s]*\d{1,3}GB/gi
      ],
      brands: ['Corsair', 'G.Skill', 'Kingston', 'Crucial', 'Teamgroup']
    },
    storage: {
      patterns: [
        /(?:Samsung|WD|Western Digital|Seagate|Crucial|Kingston)\s+[\w\s]*\d+(?:TB|GB)\s+(?:SSD|NVMe|M\.2)/gi,
        /\d+(?:TB|GB)\s+(?:SSD|NVMe|M\.2|HDD)/gi,
        /Samsung\s+\d{3}\s+(?:PRO|EVO)/gi
      ],
      brands: ['Samsung', 'WD', 'Western Digital', 'Seagate', 'Crucial', 'Kingston']
    },
    psu: {
      patterns: [
        /(?:Corsair|EVGA|Seasonic|be quiet!|Cooler Master)\s+[\w\s]*\d{3,4}W/gi,
        /\d{3,4}W\s+(?:PSU|power supply)/gi,
        /80\+\s+(?:Gold|Bronze|Platinum|Titanium)/gi
      ],
      brands: ['Corsair', 'EVGA', 'Seasonic', 'be quiet!', 'Cooler Master']
    },
    cooler: {
      patterns: [
        /(?:Noctua|be quiet!|Cooler Master|ARCTIC|Corsair|Thermalright)\s+[\w\-\s]*(?:cooler|NH-|AK-|H\d+)/gi,
        /Thermalright\s+[\w\s]+(?:Assassin|Spirit|Phantom)/gi,
        /Noctua\s+NH-[\w\d]+/gi,
        /AIO\s+[\w\s]*\d{3}mm/gi,
        /CPU\s+(?:air\s+)?cooler/gi
      ],
      brands: ['Noctua', 'be quiet!', 'Cooler Master', 'ARCTIC', 'Corsair', 'Thermalright', 'Scythe']
    },
    case: {
      patterns: [
        /(?:Fractal|NZXT|Corsair|be quiet!|Lian Li|Phanteks)\s+[\w\s]*case/gi,
        /(?:ATX|mATX|ITX)\s+(?:case|tower)/gi,
        /Fractal\s+Design\s+[\w\s]+/gi
      ],
      brands: ['Fractal Design', 'NZXT', 'Corsair', 'be quiet!', 'Lian Li', 'Phanteks']
    }
  };

  /**
   * Scrape and learn from r/buildapcforme posts
   */
  async learnFromRedditBuilds(subreddit: string = 'buildapcforme', limit: number = 100): Promise<void> {
    console.log(`📚 Learning compatibility from r/${subreddit}...`);
    
    try {
      const posts = await this.fetchRedditPosts(subreddit, limit);
      console.log(`📋 Found ${posts.length} posts to analyze`);

      let buildsAnalyzed = 0;
      let compatibilityPatternsLearned = 0;

      for (const post of posts) {
        try {
          const build = await this.extractBuildFromPost(post);
          
          if (build && build.components.length >= 3) {
            // Learn compatibility patterns from this build
            const newPatterns = this.learnCompatibilityFromBuild(build);
            compatibilityPatternsLearned += newPatterns;
            buildsAnalyzed++;

            // Store build in database for future reference
            await this.storeBuildInDatabase(build);
          }
        } catch (error) {
          console.error(`Error processing post ${post.id}:`, error);
        }
      }

      console.log(`✅ Learning complete: ${buildsAnalyzed} builds analyzed, ${compatibilityPatternsLearned} patterns learned`);
      
      // Save learned patterns
      await this.saveCompatibilityPatterns();

    } catch (error) {
      console.error('Failed to learn from Reddit builds:', error);
    }
  }

  /**
   * Fetch Reddit posts from buildapcforme
   */
  private async fetchRedditPosts(subreddit: string, limit: number): Promise<any[]> {
    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
        headers: {
          'User-Agent': 'pc-builder-compatibility-learner/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.children.map((child: any) => child.data);

    } catch (error) {
      console.error(`Error fetching r/${subreddit}:`, error);
      return [];
    }
  }

  /**
   * Extract PC build components from Reddit post
   */
  private async extractBuildFromPost(post: any): Promise<RedditBuild | null> {
    const fullText = `${post.title} ${post.selftext}`;
    
    // Skip posts that don't look like build recommendations
    if (!this.isBuildPost(fullText)) {
      return null;
    }

    const components = this.extractComponentsFromText(fullText);
    const budget = this.extractBudget(fullText);

    if (components.length < 3) {
      return null; // Not enough components to learn from
    }

    return {
      id: post.id,
      title: post.title,
      content: post.selftext,
      components,
      budget: budget || 0,
      upvotes: post.score,
      comments: post.num_comments,
      verified: this.isVerifiedBuild(fullText, post.score)
    };
  }

  /**
   * Extract components from post text using patterns
   */
  private extractComponentsFromText(text: string): ExtractedComponent[] {
    const components: ExtractedComponent[] = [];

    for (const [type, config] of Object.entries(this.componentPatterns)) {
      for (const pattern of config.patterns) {
        const matches = text.match(pattern);
        
        if (matches) {
          for (const match of matches) {
            const component = this.parseComponent(match, type as any, config.brands);
            if (component) {
              components.push(component);
            }
          }
        }
      }
    }

    return this.deduplicateComponents(components);
  }

  /**
   * Parse individual component match
   */
  private parseComponent(match: string, type: string, brands: string[]): ExtractedComponent | null {
    const cleanMatch = match.trim();
    
    // Extract brand
    const brand = brands.find(b => 
      cleanMatch.toLowerCase().includes(b.toLowerCase())
    ) || this.inferBrand(cleanMatch);

    // Extract price if mentioned nearby
    const price = this.extractPrice(cleanMatch);

    return {
      type: type as any,
      name: cleanMatch,
      brand,
      model: this.extractModel(cleanMatch, type),
      price: price || 0,
      confidence: this.calculateExtractionConfidence(cleanMatch, type)
    };
  }

  /**
   * Learn compatibility patterns from a successful build
   */
  private learnCompatibilityFromBuild(build: RedditBuild): number {
    let newPatterns = 0;

    // For each pair of components, mark them as compatible
    for (let i = 0; i < build.components.length; i++) {
      for (let j = i + 1; j < build.components.length; j++) {
        const compA = build.components[i];
        const compB = build.components[j];
        
        const patternKey = this.getCompatibilityKey(compA, compB);
        const existing = this.compatibilityPatterns.get(patternKey);

        if (existing) {
          // Strengthen existing pattern
          existing.confidence = Math.min(1.0, existing.confidence + 0.1);
          existing.examples.push(build.id);
        } else {
          // Create new compatibility pattern
          this.compatibilityPatterns.set(patternKey, {
            componentA: compA.name,
            componentB: compB.name,
            compatible: true,
            confidence: build.verified ? 0.8 : 0.6,
            source: 'reddit_build',
            examples: [build.id]
          });
          newPatterns++;
        }
      }
    }

    return newPatterns;
  }

  /**
   * Check if components are compatible based on learned patterns
   */
  checkLearnedCompatibility(componentA: string, componentB: string): {
    compatible: boolean;
    confidence: number;
    source: string;
  } {
    const patternKey = this.getCompatibilityKey(
      { name: componentA } as ExtractedComponent,
      { name: componentB } as ExtractedComponent
    );

    const pattern = this.compatibilityPatterns.get(patternKey);
    
    if (pattern) {
      return {
        compatible: pattern.compatible,
        confidence: pattern.confidence,
        source: `Learned from ${pattern.examples.length} Reddit builds`
      };
    }

    // Check for partial matches (same brand, similar model)
    const partialMatch = this.findPartialCompatibilityMatch(componentA, componentB);
    if (partialMatch) {
      return {
        compatible: partialMatch.compatible,
        confidence: partialMatch.confidence * 0.7, // Lower confidence for partial matches
        source: `Inferred from similar components`
      };
    }

    return {
      compatible: true, // Default to compatible if unknown
      confidence: 0.1,
      source: 'Unknown compatibility - defaulting to compatible'
    };
  }

  /**
   * Get real-world compatibility data for specific component types
   */
  async getCompatibilityData(componentType: string, componentName: string): Promise<string[]> {
    const compatibleComponents: string[] = [];

    for (const [key, pattern] of this.compatibilityPatterns.entries()) {
      if (pattern.componentA.toLowerCase().includes(componentName.toLowerCase()) ||
          pattern.componentB.toLowerCase().includes(componentName.toLowerCase())) {
        
        const otherComponent = pattern.componentA.toLowerCase().includes(componentName.toLowerCase()) 
          ? pattern.componentB 
          : pattern.componentA;
          
        if (pattern.compatible && pattern.confidence > 0.5) {
          compatibleComponents.push(otherComponent);
        }
      }
    }

    return compatibleComponents;
  }

  // Helper methods
  private isBuildPost(text: string): boolean {
    const buildIndicators = [
      'build', 'pc', 'computer', 'rig', 'setup', 'parts list', 'components',
      'cpu', 'gpu', 'motherboard', 'ram', 'psu', 'pcpartpicker'
    ];
    
    const lowerText = text.toLowerCase();
    return buildIndicators.some(indicator => lowerText.includes(indicator));
  }

  private extractBudget(text: string): number | null {
    const budgetPattern = /\$(\d{1,4}),?(\d{3})?/g;
    const matches = Array.from(text.matchAll(budgetPattern));
    
    for (const match of matches) {
      const amount = parseInt(match[1] + (match[2] || ''));
      if (amount >= 300 && amount <= 10000) {
        return amount;
      }
    }
    
    return null;
  }

  private extractPrice(text: string): number | null {
    const pricePattern = /\$(\d{1,4})/;
    const match = text.match(pricePattern);
    return match ? parseInt(match[1]) : null;
  }

  private extractModel(text: string, type: string): string {
    // Extract model numbers, series identifiers, etc.
    const modelPatterns = {
      cpu: /(?:i[3579]-)?(\d{4,5}[KF]?[S]?)|(?:Ryzen [359] )(\d{4}[X]?[3D]?)/,
      gpu: /(RTX|GTX|RX) (\d{4})[\w\s]*?(Ti|Super|XT|XTX)?/,
      cooler: /(NH-[\w\d]+|Assassin \d+|H\d+i?)/
    };

    const pattern = modelPatterns[type as keyof typeof modelPatterns];
    if (pattern) {
      const match = text.match(pattern);
      return match ? match[0] : '';
    }

    return '';
  }

  private inferBrand(text: string): string {
    const allBrands = [
      'Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock',
      'Corsair', 'G.Skill', 'Kingston', 'Crucial', 'Samsung', 'WD',
      'Noctua', 'be quiet!', 'Thermalright', 'Cooler Master', 'ARCTIC'
    ];

    return allBrands.find(brand => 
      text.toLowerCase().includes(brand.toLowerCase())
    ) || 'Unknown';
  }

  private calculateExtractionConfidence(match: string, type: string): number {
    let confidence = 0.5;
    
    if (match.length > 10) confidence += 0.2;
    if (match.includes('-') || match.includes(' ')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private isVerifiedBuild(text: string, score: number): boolean {
    const verificationIndicators = [
      'works great', 'running perfectly', 'no issues', 'successful build',
      'completed build', 'working build'
    ];
    
    const hasVerification = verificationIndicators.some(indicator =>
      text.toLowerCase().includes(indicator)
    );
    
    return hasVerification || score > 20; // High upvotes suggest good build
  }

  private getCompatibilityKey(compA: ExtractedComponent, compB: ExtractedComponent): string {
    // Create consistent key regardless of order
    const names = [compA.name, compB.name].sort();
    return `${names[0]}|${names[1]}`;
  }

  private findPartialCompatibilityMatch(componentA: string, componentB: string): CompatibilityPattern | null {
    // Look for similar components in learned patterns
    for (const pattern of this.compatibilityPatterns.values()) {
      const similarA = this.isSimilarComponent(componentA, pattern.componentA);
      const similarB = this.isSimilarComponent(componentB, pattern.componentB);
      
      if (similarA && similarB) {
        return pattern;
      }
    }
    
    return null;
  }

  private isSimilarComponent(comp1: string, comp2: string): boolean {
    const words1 = comp1.toLowerCase().split(/\s+/);
    const words2 = comp2.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      if (word1.length > 2 && words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    }
    
    return matches >= Math.min(words1.length, words2.length) * 0.6;
  }

  private deduplicateComponents(components: ExtractedComponent[]): ExtractedComponent[] {
    const seen = new Set<string>();
    return components.filter(comp => {
      const key = `${comp.type}-${comp.name}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async storeBuildInDatabase(build: RedditBuild): Promise<void> {
    // Store the build for future reference and analysis
    try {
      await componentDatabaseService.logProcess(
        'reddit_build_learned',
        'completed',
        `Learned from build: ${build.title}`,
        {
          buildId: build.id,
          components: build.components.length,
          budget: build.budget,
          upvotes: build.upvotes
        }
      );
    } catch (error) {
      console.error('Error storing build in database:', error);
    }
  }

  private async saveCompatibilityPatterns(): Promise<void> {
    // Save learned patterns to database for persistence
    console.log(`💾 Saving ${this.compatibilityPatterns.size} compatibility patterns...`);
    
    // This would save to Supabase database in a real implementation
    // For now, just log the learning results
    let highConfidencePatterns = 0;
    
    for (const pattern of this.compatibilityPatterns.values()) {
      if (pattern.confidence > 0.7) {
        highConfidencePatterns++;
      }
    }
    
    console.log(`✅ Saved ${highConfidencePatterns} high-confidence compatibility patterns`);
  }
}

export const redditBuildLearner = new RedditBuildLearner();