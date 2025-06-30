import { amazonASINScraper } from './amazonASINScraper';
import { allRealComponents } from '../data/realComponents';
import { Region } from '../utils/budgetAllocator';

/**
 * Automated service that updates ASINs based on popularity and availability
 * Runs on intervals to keep ASIN database current
 */
export class ASINUpdateService {
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private updateFrequency = 6 * 60 * 60 * 1000; // 6 hours
  private componentPopularity = new Map<string, number>();
  private lastUpdate = 0;

  /**
   * Start the automated ASIN update service
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ ASIN update service already running');
      return;
    }

    console.log('🚀 Starting automated ASIN update service...');
    console.log(`📅 Update frequency: ${this.updateFrequency / (60 * 60 * 1000)} hours`);

    this.isRunning = true;

    // Run initial update
    this.runUpdate();

    // Schedule periodic updates
    this.updateInterval = setInterval(() => {
      this.runUpdate();
    }, this.updateFrequency);

    console.log('✅ ASIN update service started');
  }

  /**
   * Stop the automated update service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ ASIN update service not running');
      return;
    }

    console.log('🛑 Stopping ASIN update service...');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    console.log('✅ ASIN update service stopped');
  }

  /**
   * Force an immediate update
   */
  async forceUpdate(): Promise<void> {
    console.log('🔄 Forcing immediate ASIN update...');
    await this.runUpdate();
  }

  /**
   * Main update routine
   */
  private async runUpdate(): Promise<void> {
    console.log('\n🔄 Running scheduled ASIN update...');
    console.log('═'.repeat(50));

    try {
      // Get components to update based on popularity
      const componentsToUpdate = this.selectComponentsForUpdate();
      
      console.log(`📊 Updating ASINs for ${componentsToUpdate.length} popular components`);

      // Update ASINs for each region
      const regions: Region[] = ['US', 'CA', 'UK', 'DE', 'AU'];
      const results = new Map<string, Map<Region, string>>();

      for (const region of regions) {
        console.log(`\n🌍 Processing ${region} region...`);
        
        const regionResults = await amazonASINScraper.bulkUpdateASINs(componentsToUpdate, region);
        
        // Store results
        for (const [componentName, asin] of regionResults.entries()) {
          if (!results.has(componentName)) {
            results.set(componentName, new Map());
          }
          results.get(componentName)!.set(region, asin);
        }

        // Rate limiting between regions
        await this.delay(5000);
      }

      // Update popularity scores
      this.updatePopularityScores(componentsToUpdate);

      // Log results
      this.logUpdateResults(results);

      this.lastUpdate = Date.now();
      console.log(`✅ ASIN update completed at ${new Date().toISOString()}`);

    } catch (error) {
      console.error('❌ ASIN update failed:', error);
    }
  }

  /**
   * Select components for update based on popularity and staleness
   */
  private selectComponentsForUpdate(): any[] {
    // Get all components from real components database
    const allComponents = Object.values(allRealComponents).flat();
    
    // Sort by popularity (simulated for now)
    const componentsWithPopularity = allComponents.map(component => ({
      ...component,
      popularity: this.calculateComponentPopularity(component.name, component.category)
    }));

    // Select top components + random sampling
    const topComponents = componentsWithPopularity
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20); // Top 20 most popular

    // Add some random components for diversity
    const remainingComponents = componentsWithPopularity.slice(20);
    const randomComponents = this.selectRandom(remainingComponents, 5);

    const selectedComponents = [...topComponents, ...randomComponents];

    console.log(`📈 Selected ${selectedComponents.length} components for update:`);
    selectedComponents.forEach((comp, index) => {
      console.log(`  ${index + 1}. ${comp.name} (popularity: ${comp.popularity})`);
    });

    return selectedComponents;
  }

  /**
   * Calculate component popularity score
   */
  private calculateComponentPopularity(componentName: string, category: string): number {
    // Check cached popularity
    const cached = this.componentPopularity.get(componentName);
    if (cached) return cached;

    let score = 50; // Base score

    // Category popularity weights
    const categoryWeights = {
      gpu: 1.5,    // GPUs are very popular
      cpu: 1.3,    // CPUs are popular
      motherboard: 1.0,
      ram: 1.1,
      storage: 1.1,
      psu: 0.8,
      cooler: 0.9,
      case: 0.7
    };

    score *= categoryWeights[category as keyof typeof categoryWeights] || 1.0;

    // Brand popularity (simplified)
    const name = componentName.toLowerCase();
    if (name.includes('rtx') && (name.includes('4090') || name.includes('4080'))) score += 30;
    if (name.includes('intel') && name.includes('14900')) score += 25;
    if (name.includes('amd') && name.includes('7950')) score += 25;
    if (name.includes('corsair') || name.includes('gskill')) score += 10;

    // Recent/current generation bonus
    if (name.includes('14th') || name.includes('7000') || name.includes('ddr5')) score += 15;

    // Cache the result
    this.componentPopularity.set(componentName, score);
    return score;
  }

  /**
   * Update popularity scores based on scraping results
   */
  private updatePopularityScores(components: any[]): void {
    // This would integrate with actual usage metrics, sales data, etc.
    console.log('📊 Updating component popularity scores...');
    
    // For now, just increment popularity for successfully updated components
    components.forEach(component => {
      const currentScore = this.componentPopularity.get(component.name) || 50;
      this.componentPopularity.set(component.name, currentScore + 1);
    });
  }

  /**
   * Log update results
   */
  private logUpdateResults(results: Map<string, Map<Region, string>>): void {
    console.log('\n📋 Update Results Summary:');
    console.log('═'.repeat(40));

    let totalUpdated = 0;
    const regionCounts = new Map<Region, number>();

    for (const [componentName, regionResults] of results.entries()) {
      console.log(`\n🔧 ${componentName}:`);
      
      for (const [region, asin] of regionResults.entries()) {
        console.log(`  ${region}: ${asin}`);
        totalUpdated++;
        regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Total components: ${results.size}`);
    console.log(`  Total ASINs updated: ${totalUpdated}`);
    console.log(`  Per region:`);
    
    for (const [region, count] of regionCounts.entries()) {
      console.log(`    ${region}: ${count} ASINs`);
    }

    // Cache stats
    const cacheStats = amazonASINScraper.getCacheStats();
    console.log(`\n💾 Cache Stats:`);
    console.log(`  Entries: ${cacheStats.entries}`);
    console.log(`  Total products: ${cacheStats.totalComponents}`);
    console.log(`  Avg popularity: ${cacheStats.averagePopularity.toFixed(1)}`);
    console.log(`  Last updated: ${cacheStats.lastUpdated}`);
  }

  /**
   * Select random items from array
   */
  private selectRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus(): {
    isRunning: boolean;
    lastUpdate: string;
    nextUpdate: string;
    componentsCached: number;
    updateFrequencyHours: number;
  } {
    const nextUpdate = this.lastUpdate + this.updateFrequency;
    
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : 'Never',
      nextUpdate: this.isRunning ? new Date(nextUpdate).toISOString() : 'Not scheduled',
      componentsCached: this.componentPopularity.size,
      updateFrequencyHours: this.updateFrequency / (60 * 60 * 1000)
    };
  }

  /**
   * Set update frequency
   */
  setUpdateFrequency(hours: number): void {
    this.updateFrequency = hours * 60 * 60 * 1000;
    console.log(`📅 Update frequency changed to ${hours} hours`);
    
    // Restart service if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Export singleton
export const asinUpdateService = new ASINUpdateService();

// Browser console utilities
if (typeof window !== 'undefined') {
  (window as any).startASINUpdates = () => asinUpdateService.start();
  (window as any).stopASINUpdates = () => asinUpdateService.stop();
  (window as any).forceASINUpdate = () => asinUpdateService.forceUpdate();
  (window as any).asinUpdateStatus = () => asinUpdateService.getStatus();
  (window as any).setASINUpdateFrequency = (hours: number) => asinUpdateService.setUpdateFrequency(hours);

  console.log('🔄 ASIN Update Service loaded!');
  console.log('- startASINUpdates() - Start automated updates');
  console.log('- stopASINUpdates() - Stop automated updates');
  console.log('- forceASINUpdate() - Force immediate update');
  console.log('- asinUpdateStatus() - Check service status');
  console.log('- setASINUpdateFrequency(6) - Set update frequency (hours)');
}