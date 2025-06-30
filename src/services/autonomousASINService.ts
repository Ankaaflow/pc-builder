import { realAmazonScraper } from './realAmazonScraper';
import { allRealComponents } from '../data/realComponents';
import { Region } from '../utils/budgetAllocator';

/**
 * Autonomous ASIN discovery service that automatically scrapes Amazon
 * for real, current ASINs based on component popularity and trends
 */
export class AutonomousASINService {
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private updateFrequency = 4 * 60 * 60 * 1000; // 4 hours
  private lastUpdate = 0;
  private componentPriority = new Map<string, number>();
  private successfulScrapes = new Map<string, string>();
  private failedScrapes = new Set<string>();

  /**
   * Start the autonomous ASIN discovery service
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Autonomous ASIN service already running');
      return;
    }

    console.log('🚀 Starting Autonomous Amazon ASIN Discovery Service');
    console.log('═'.repeat(50));
    console.log(`📅 Update frequency: ${this.updateFrequency / (60 * 60 * 1000)} hours`);
    console.log('🎯 Goal: Maintain current, real Amazon ASINs automatically');

    this.isRunning = true;

    // Run initial discovery
    this.runDiscovery();

    // Schedule periodic updates
    this.updateInterval = setInterval(() => {
      this.runDiscovery();
    }, this.updateFrequency);

    console.log('✅ Autonomous ASIN service started');
  }

  /**
   * Stop the service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Autonomous ASIN service not running');
      return;
    }

    console.log('🛑 Stopping autonomous ASIN service...');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    console.log('✅ Autonomous ASIN service stopped');
  }

  /**
   * Force immediate discovery
   */
  async forceDiscovery(): Promise<void> {
    console.log('🔄 Forcing immediate ASIN discovery...');
    await this.runDiscovery();
  }

  /**
   * Main discovery routine
   */
  private async runDiscovery(): Promise<void> {
    console.log('\n🔄 Running Autonomous ASIN Discovery...');
    console.log('═'.repeat(45));
    console.log(new Date().toISOString());

    try {
      // Select components to update based on priority and freshness
      const componentsToUpdate = this.selectComponentsForUpdate();
      
      console.log(`🎯 Targeting ${componentsToUpdate.length} high-priority components`);

      // Update ASINs for all regions
      const regions: Region[] = ['US', 'CA', 'UK']; // Start with major regions
      const discoveryResults = new Map<string, Map<Region, string>>();

      for (const region of regions) {
        console.log(`\n🌍 Discovering ASINs for ${region}...`);
        
        for (const component of componentsToUpdate) {
          try {
            console.log(`  🔍 Scraping: ${component.name}`);
            
            const realASIN = await realAmazonScraper.getBestRealASIN(component.name, region);
            
            if (realASIN) {
              if (!discoveryResults.has(component.name)) {
                discoveryResults.set(component.name, new Map());
              }
              discoveryResults.get(component.name)!.set(region, realASIN);
              
              // Track successful scrape
              this.successfulScrapes.set(`${component.name}-${region}`, realASIN);
              this.failedScrapes.delete(`${component.name}-${region}`);
              
              console.log(`    ✅ Found: ${realASIN}`);
            } else {
              console.log(`    ❌ No ASIN found`);
              this.failedScrapes.add(`${component.name}-${region}`);
            }

            // Rate limiting between components
            await this.delay(5000);

          } catch (error) {
            console.error(`    ❌ Error scraping ${component.name}:`, error);
            this.failedScrapes.add(`${component.name}-${region}`);
          }
        }

        // Longer delay between regions
        await this.delay(10000);
      }

      // Update component priorities based on results
      this.updateComponentPriorities(componentsToUpdate, discoveryResults);

      // Log results
      this.logDiscoveryResults(discoveryResults);

      this.lastUpdate = Date.now();
      console.log(`\n✅ Autonomous discovery completed at ${new Date().toISOString()}`);

    } catch (error) {
      console.error('❌ Autonomous discovery failed:', error);
    }
  }

  /**
   * Select components for update based on priority and staleness
   */
  private selectComponentsForUpdate(): any[] {
    // Get all components
    const allComponents = Object.values(allRealComponents).flat();
    
    // Calculate priority scores
    const componentsWithPriority = allComponents.map(component => ({
      ...component,
      priority: this.calculateComponentPriority(component.name, component.category),
      freshness: this.getDataFreshness(component.name)
    }));

    // Select high-priority components + stale components
    const highPriority = componentsWithPriority
      .filter(comp => comp.priority >= 80)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10); // Top 10 high-priority

    const staleComponents = componentsWithPriority
      .filter(comp => comp.freshness < 0.5 && comp.priority >= 60)
      .sort((a, b) => a.freshness - b.freshness)
      .slice(0, 5); // 5 most stale

    // Add some random medium-priority for diversity
    const mediumPriority = componentsWithPriority
      .filter(comp => comp.priority >= 60 && comp.priority < 80)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3); // 3 random medium-priority

    const selected = [...highPriority, ...staleComponents, ...mediumPriority];
    
    // Remove duplicates
    const uniqueSelected = selected.filter((comp, index, arr) => 
      arr.findIndex(c => c.name === comp.name) === index
    );

    console.log(`📊 Component Selection Strategy:`);
    console.log(`  High Priority (≥80): ${highPriority.length}`);
    console.log(`  Stale Data (<50%): ${staleComponents.length}`);
    console.log(`  Random Medium (60-79): ${mediumPriority.length}`);
    console.log(`  Total Selected: ${uniqueSelected.length}`);

    return uniqueSelected;
  }

  /**
   * Calculate component priority based on popularity and importance
   */
  private calculateComponentPriority(componentName: string, category: string): number {
    // Base priority by category
    const categoryPriorities = {
      gpu: 100,     // Highest priority - changes frequently
      cpu: 95,      // Very high - flagship products
      motherboard: 70,
      ram: 75,
      storage: 70,
      psu: 60,
      cooler: 55,
      case: 50
    };

    let priority = categoryPriorities[category as keyof typeof categoryPriorities] || 50;
    
    const name = componentName.toLowerCase();
    
    // Flagship/popular product bonuses
    if (name.includes('rtx') && (name.includes('4090') || name.includes('4080'))) priority += 15;
    if (name.includes('intel') && (name.includes('14900') || name.includes('13900'))) priority += 10;
    if (name.includes('amd') && (name.includes('7950') || name.includes('7900'))) priority += 10;
    if (name.includes('corsair') || name.includes('asus') || name.includes('msi')) priority += 5;
    
    // Recent generation bonus
    if (name.includes('14th') || name.includes('rtx 40') || name.includes('ddr5')) priority += 10;
    
    // User priority boost (if we had usage analytics)
    const userPriority = this.componentPriority.get(componentName) || 0;
    priority += userPriority;

    return Math.min(priority, 100);
  }

  /**
   * Get data freshness score (0-1, where 1 is very fresh)
   */
  private getDataFreshness(componentName: string): number {
    // Check when we last successfully scraped this component
    const regions: Region[] = ['US', 'CA', 'UK'];
    let successfulRegions = 0;
    
    for (const region of regions) {
      if (this.successfulScrapes.has(`${componentName}-${region}`)) {
        successfulRegions++;
      }
    }
    
    const regionCoverage = successfulRegions / regions.length;
    
    // Factor in failed scrapes
    let failedRegions = 0;
    for (const region of regions) {
      if (this.failedScrapes.has(`${componentName}-${region}`)) {
        failedRegions++;
      }
    }
    
    const failurePenalty = failedRegions / regions.length;
    
    return Math.max(0, regionCoverage - (failurePenalty * 0.5));
  }

  /**
   * Update component priorities based on discovery results
   */
  private updateComponentPriorities(components: any[], results: Map<string, Map<Region, string>>): void {
    for (const component of components) {
      const componentResults = results.get(component.name);
      const currentPriority = this.componentPriority.get(component.name) || 0;
      
      if (componentResults && componentResults.size > 0) {
        // Successful discovery - slightly increase priority
        this.componentPriority.set(component.name, Math.min(currentPriority + 2, 20));
      } else {
        // Failed discovery - decrease priority
        this.componentPriority.set(component.name, Math.max(currentPriority - 1, -10));
      }
    }
  }

  /**
   * Log discovery results
   */
  private logDiscoveryResults(results: Map<string, Map<Region, string>>): void {
    console.log('\n📊 Discovery Results:');
    console.log('═'.repeat(35));

    let totalDiscovered = 0;
    let totalComponents = 0;

    for (const [componentName, regionResults] of results.entries()) {
      totalComponents++;
      console.log(`\n🔧 ${componentName}:`);
      
      for (const [region, asin] of regionResults.entries()) {
        console.log(`  ${region}: ${asin}`);
        totalDiscovered++;
      }
    }

    const successRate = totalComponents > 0 ? ((totalDiscovered / (totalComponents * 3)) * 100).toFixed(1) : '0';
    
    console.log(`\n📈 Summary:`);
    console.log(`  Components processed: ${totalComponents}`);
    console.log(`  ASINs discovered: ${totalDiscovered}`);
    console.log(`  Success rate: ${successRate}%`);
    console.log(`  Cache entries: ${this.successfulScrapes.size}`);
    console.log(`  Failed attempts: ${this.failedScrapes.size}`);
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
    successfulScrapes: number;
    failedScrapes: number;
    topPriorityComponents: Array<{name: string, priority: number}>;
  } {
    const nextUpdate = this.lastUpdate + this.updateFrequency;
    
    // Get top priority components
    const topPriority = Array.from(this.componentPriority.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, priority]) => ({ name, priority }));
    
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : 'Never',
      nextUpdate: this.isRunning ? new Date(nextUpdate).toISOString() : 'Not scheduled',
      successfulScrapes: this.successfulScrapes.size,
      failedScrapes: this.failedScrapes.size,
      topPriorityComponents: topPriority
    };
  }

  /**
   * Set update frequency
   */
  setUpdateFrequency(hours: number): void {
    this.updateFrequency = hours * 60 * 60 * 1000;
    console.log(`📅 Autonomous discovery frequency changed to ${hours} hours`);
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Export singleton
export const autonomousASINService = new AutonomousASINService();

// Browser console utilities
if (typeof window !== 'undefined') {
  (window as any).startAutonomousASINs = () => autonomousASINService.start();
  (window as any).stopAutonomousASINs = () => autonomousASINService.stop();
  (window as any).forceASINDiscovery = () => autonomousASINService.forceDiscovery();
  (window as any).autonomousASINStatus = () => autonomousASINService.getStatus();
  (window as any).setAutonomousASINFrequency = (hours: number) => autonomousASINService.setUpdateFrequency(hours);

  console.log('🤖 Autonomous ASIN Service loaded!');
  console.log('- startAutonomousASINs() - Start autonomous discovery');
  console.log('- stopAutonomousASINs() - Stop autonomous discovery');
  console.log('- forceASINDiscovery() - Force immediate discovery');
  console.log('- autonomousASINStatus() - Check service status');
  console.log('- setAutonomousASINFrequency(4) - Set frequency (hours)');
}