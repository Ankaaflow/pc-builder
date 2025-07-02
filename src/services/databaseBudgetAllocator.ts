// Database-powered Budget Allocator
// Uses the component database instead of static data for dynamic, up-to-date component recommendations

import { componentDatabaseService, DatabaseComponent } from './componentDatabaseService';
import { amazonProductMatchingService } from './amazonProductMatchingService';
import { componentCompatibilityService, CompatibilityResult } from './componentCompatibilityService';
import { Component, Region, BudgetAllocation, BuildConfiguration } from '../utils/budgetAllocator';
import { supabase } from '@/integrations/supabase/client';

class DatabaseBudgetAllocator {

  /**
   * Generate build recommendation using database components with compatibility checking
   */
  async generateDatabaseBuild(budget: number, region: Region): Promise<BuildConfiguration & { compatibility: CompatibilityResult }> {
    console.log(`🏗️ Generating compatible database build for $${budget} in ${region}...`);

    const allocation = this.calculateBudgetAllocation(budget);
    
    // Start with CPU and motherboard as they define the platform
    const cpu = await this.findBestDatabaseComponent('cpu', allocation.cpu, region);
    if (!cpu) {
      throw new Error('No compatible CPU found for budget');
    }

    // Find compatible motherboard for the CPU
    const motherboard = await this.findCompatibleMotherboard(cpu, allocation.motherboard, region);
    if (!motherboard) {
      throw new Error(`No compatible motherboard found for ${cpu.name}`);
    }

    // Find compatible RAM for the motherboard
    const ram = await this.findCompatibleRAM(motherboard, allocation.ram, region);
    if (!ram) {
      throw new Error(`No compatible RAM found for ${motherboard.name}`);
    }

    // Get other components with looser compatibility requirements
    const [gpu, storage, cooler, caseComponent] = await Promise.all([
      this.findBestDatabaseComponent('gpu', allocation.gpu, region),
      this.findBestDatabaseComponent('storage', allocation.storage, region),
      this.findBestDatabaseComponent('cooler', allocation.cooler, region),
      this.findBestDatabaseComponent('case', allocation.case, region)
    ]);

    // Calculate required PSU wattage
    const tempBuild = { cpu, gpu, motherboard, ram, storage, cooler, case: caseComponent };
    const powerRequirement = componentCompatibilityService.checkBuildCompatibility(tempBuild).estimatedWattage;
    
    // Find PSU with adequate wattage
    const psu = await this.findCompatiblePSU(powerRequirement, allocation.psu, region);

    const finalBuild = {
      cpu,
      gpu,
      motherboard,
      ram,
      storage,
      cooler,
      psu,
      case: caseComponent
    };

    // Final compatibility check
    const compatibility = componentCompatibilityService.checkBuildCompatibility(finalBuild);
    
    console.log(`✅ Generated build with ${compatibility.issues.length} critical issues, ${compatibility.warnings.length} warnings`);
    
    return {
      ...finalBuild,
      compatibility
    };
  }

  /**
   * Find best component from database for category and budget
   */
  async findBestDatabaseComponent(
    category: string, 
    budget: number, 
    region: Region
  ): Promise<Component | null> {
    try {
      // Get components from database with valid Amazon links
      const dbComponents = await componentDatabaseService.getComponentsByCategory(category, region);
      
      if (dbComponents.length === 0) {
        console.warn(`No database components found for category: ${category}`);
        return null;
      }

      // Convert database components to app format
      const components = await Promise.all(
        dbComponents.map(async (dbComp) => this.convertDatabaseComponent(dbComp, region))
      );

      const validComponents = components.filter(comp => comp !== null) as Component[];

      if (validComponents.length === 0) {
        console.warn(`No valid components found for category: ${category}`);
        return null;
      }

      // Sort by popularity and price fit
      const scoredComponents = validComponents.map(comp => ({
        component: comp,
        score: this.calculateComponentScore(comp, budget, region)
      }));

      scoredComponents.sort((a, b) => b.score - a.score);

      const selected = scoredComponents[0].component;
      console.log(`✅ Selected ${selected.name} for ${category} (score: ${scoredComponents[0].score.toFixed(2)})`);

      // Track selection for popularity
      const dbComponent = dbComponents.find(db => db.name === selected.name);
      if (dbComponent) {
        await componentDatabaseService.updateComponentPopularity(dbComponent.id, 'selection');
      }

      return selected;

    } catch (error) {
      console.error(`Error finding component for ${category}:`, error);
      return null;
    }
  }

  /**
   * Convert database component to app component format
   */
  async convertDatabaseComponent(
    dbComponent: DatabaseComponent & { amazon_links: any[] },
    region: Region
  ): Promise<Component | null> {
    try {
      // Get best Amazon link for this region
      const amazonLink = await componentDatabaseService.getBestAmazonLink(dbComponent.id, region);
      
      if (!amazonLink) {
        console.warn(`No valid Amazon link found for ${dbComponent.name} in ${region}`);
        return null;
      }

      // Get regional pricing (fallback to estimated if not available)
      const pricing = await this.getComponentPricing(dbComponent.id, region);

      const component: Component = {
        id: dbComponent.id,
        name: dbComponent.name,
        brand: dbComponent.brand,
        price: pricing,
        specs: dbComponent.specs || {},
        asin: amazonLink.asin,
        availability: this.mapAvailability(amazonLink.amazon_availability),
        trend: 'stable', // Could be enhanced with price history
        category: dbComponent.category as any,
        description: dbComponent.description || `${dbComponent.brand} ${dbComponent.name}`
      };

      return component;

    } catch (error) {
      console.error(`Error converting component ${dbComponent.name}:`, error);
      return null;
    }
  }

  /**
   * Get component pricing for all regions
   */
  async getComponentPricing(componentId: string, primaryRegion: Region): Promise<{ [key in Region]: number }> {
    try {
      const { data: pricingData, error } = await supabase
        .from('component_pricing')
        .select('*')
        .eq('component_id', componentId);

      if (error) throw error;

      const pricing: { [key in Region]: number } = {
        US: 0, CA: 0, UK: 0, DE: 0, AU: 0
      };

      // Use actual pricing data if available
      if (pricingData) {
        for (const price of pricingData) {
          pricing[price.region as Region] = price.price_usd;
        }
      }

      // Fill missing regions with estimated prices based on primary region
      const basePriceUS = pricing.US || pricing[primaryRegion] || 100;
      const conversionRates = { US: 1.0, CA: 1.35, UK: 0.8, DE: 0.9, AU: 1.5 };

      for (const region of Object.keys(pricing) as Region[]) {
        if (pricing[region] === 0) {
          pricing[region] = Math.round(basePriceUS * conversionRates[region]);
        }
      }

      return pricing;

    } catch (error) {
      console.error(`Error getting pricing for component ${componentId}:`, error);
      // Return default pricing
      const basePrice = 100;
      return {
        US: basePrice,
        CA: Math.round(basePrice * 1.35),
        UK: Math.round(basePrice * 0.8),
        DE: Math.round(basePrice * 0.9),
        AU: Math.round(basePrice * 1.5)
      };
    }
  }

  /**
   * Calculate component score for selection (popularity + budget fit + recency)
   */
  calculateComponentScore(component: Component, budget: number, region: Region): number {
    let score = 0;

    const price = component.price[region];
    
    // Budget fit score (0-1, higher for closer to budget)
    if (price <= budget) {
      score += (price / budget) * 0.5; // Prefer using full budget
    } else {
      score += Math.max(0, 1 - ((price - budget) / budget)) * 0.3; // Penalty for over budget
    }

    // Availability score
    const availabilityScore = {
      'in-stock': 0.3,
      'limited': 0.2,
      'out-of-stock': 0.0
    };
    score += availabilityScore[component.availability] || 0.1;

    // Brand reputation score (could be enhanced with actual data)
    const brandScore = {
      'Intel': 0.1, 'AMD': 0.1, 'NVIDIA': 0.1,
      'ASUS': 0.08, 'MSI': 0.08, 'Gigabyte': 0.08,
      'Corsair': 0.08, 'G.SKILL': 0.08, 'Samsung': 0.1
    };
    score += brandScore[component.brand as keyof typeof brandScore] || 0.05;

    // Random factor for variety
    score += Math.random() * 0.05;

    return score;
  }

  /**
   * Map Amazon availability to app format
   */
  mapAvailability(amazonAvailability?: string): 'in-stock' | 'limited' | 'out-of-stock' {
    if (!amazonAvailability) return 'in-stock';
    
    const availability = amazonAvailability.toLowerCase();
    if (availability.includes('in stock') || availability.includes('available')) {
      return 'in-stock';
    } else if (availability.includes('limited') || availability.includes('few left')) {
      return 'limited';
    } else {
      return 'out-of-stock';
    }
  }

  /**
   * Calculate budget allocation percentages
   */
  calculateBudgetAllocation(totalBudget: number): BudgetAllocation {
    return {
      cpu: Math.round(totalBudget * 0.20),
      gpu: Math.round(totalBudget * 0.35),
      motherboard: Math.round(totalBudget * 0.10),
      ram: Math.round(totalBudget * 0.08),
      storage: Math.round(totalBudget * 0.08),
      cooler: Math.round(totalBudget * 0.06),
      psu: Math.round(totalBudget * 0.08),
      case: Math.round(totalBudget * 0.05)
    };
  }

  /**
   * Get database-powered component alternatives for a category
   */
  async getDatabaseAlternatives(
    category: string, 
    budget: number, 
    region: Region, 
    limit: number = 10
  ): Promise<Component[]> {
    try {
      const dbComponents = await componentDatabaseService.getComponentsByCategory(category, region);
      
      const components = await Promise.all(
        dbComponents.slice(0, limit * 2).map(async (dbComp) => 
          this.convertDatabaseComponent(dbComp, region)
        )
      );

      const validComponents = components.filter(comp => comp !== null) as Component[];

      // Sort by score and return top results
      const scoredComponents = validComponents.map(comp => ({
        component: comp,
        score: this.calculateComponentScore(comp, budget, region)
      }));

      scoredComponents.sort((a, b) => b.score - a.score);

      return scoredComponents.slice(0, limit).map(scored => scored.component);

    } catch (error) {
      console.error(`Error getting alternatives for ${category}:`, error);
      return [];
    }
  }

  /**
   * Generate affiliate link using database ASIN
   */
  async generateDatabaseAffiliateLink(component: Component, region: Region): Promise<string> {
    try {
      // Get fresh Amazon link from database
      const amazonLink = await componentDatabaseService.getBestAmazonLink(component.id, region);
      
      if (amazonLink && amazonLink.is_valid) {
        console.log(`🔗 Using database Amazon link for ${component.name}: ${amazonLink.asin}`);
        return amazonLink.product_url;
      }

      // Fallback: try to find/create new Amazon link
      const dbComponent = await this.findDatabaseComponent(component.name, component.brand);
      if (dbComponent) {
        const newLink = await amazonProductMatchingService.updateComponentAmazonLink(dbComponent, region);
        if (newLink) {
          return newLink.product_url;
        }
      }

      // Final fallback: generate search link
      return this.generateSearchFallback(component.name, region);

    } catch (error) {
      console.error(`Error generating database affiliate link for ${component.name}:`, error);
      return this.generateSearchFallback(component.name, region);
    }
  }

  /**
   * Find database component by name and brand
   */
  async findDatabaseComponent(name: string, brand: string): Promise<DatabaseComponent | null> {
    try {
      const results = await componentDatabaseService.searchComponents(name);
      return results.find(comp => 
        comp.brand.toLowerCase() === brand.toLowerCase() &&
        comp.name.toLowerCase().includes(name.toLowerCase())
      ) || null;
    } catch (error) {
      console.error(`Error finding database component ${name}:`, error);
      return null;
    }
  }

  /**
   * Generate search fallback link
   */
  generateSearchFallback(componentName: string, region: Region): string {
    const domains = {
      US: 'amazon.com',
      CA: 'amazon.ca',
      UK: 'amazon.co.uk', 
      DE: 'amazon.de',
      AU: 'amazon.com.au'
    };

    const affiliateTags = {
      US: 'pcbuilder-20',
      CA: 'pcbuilderCA-20',
      UK: 'pcbuilder-21',
      DE: 'pcbuilder-21',
      AU: 'pcbuilderAU-20'
    };

    const searchQuery = encodeURIComponent(componentName.replace(/[^\w\s]/g, '').trim());
    return `https://${domains[region]}/s?k=${searchQuery}&tag=${affiliateTags[region]}&ref=sr_st_relevancerank`;
  }

  /**
   * Find compatible motherboard for given CPU
   */
  async findCompatibleMotherboard(cpu: Component, budget: number, region: Region): Promise<Component | null> {
    try {
      const dbComponents = await componentDatabaseService.getComponentsByCategory('motherboard', region);
      
      const compatibleMotherboards = [];
      
      for (const dbComp of dbComponents) {
        const motherboard = await this.convertDatabaseComponent(dbComp, region);
        if (!motherboard) continue;

        // Check CPU-motherboard compatibility
        const compatibility = componentCompatibilityService.checkBuildCompatibility({
          cpu, motherboard
        });

        if (compatibility.compatible) {
          compatibleMotherboards.push({
            component: motherboard,
            score: this.calculateComponentScore(motherboard, budget, region)
          });
        }
      }

      if (compatibleMotherboards.length === 0) {
        console.warn(`No compatible motherboards found for ${cpu.name}`);
        return null;
      }

      // Sort by score and return best
      compatibleMotherboards.sort((a, b) => b.score - a.score);
      const selected = compatibleMotherboards[0].component;
      
      console.log(`✅ Selected compatible motherboard: ${selected.name} for ${cpu.name}`);
      return selected;

    } catch (error) {
      console.error(`Error finding compatible motherboard for ${cpu.name}:`, error);
      return null;
    }
  }

  /**
   * Find compatible RAM for given motherboard
   */
  async findCompatibleRAM(motherboard: Component, budget: number, region: Region): Promise<Component | null> {
    try {
      const dbComponents = await componentDatabaseService.getComponentsByCategory('ram', region);
      
      const compatibleRAM = [];
      
      for (const dbComp of dbComponents) {
        const ram = await this.convertDatabaseComponent(dbComp, region);
        if (!ram) continue;

        // Check RAM-motherboard compatibility
        const compatibility = componentCompatibilityService.checkBuildCompatibility({
          motherboard, ram
        });

        if (compatibility.compatible) {
          compatibleRAM.push({
            component: ram,
            score: this.calculateComponentScore(ram, budget, region)
          });
        }
      }

      if (compatibleRAM.length === 0) {
        console.warn(`No compatible RAM found for ${motherboard.name}`);
        return null;
      }

      // Sort by score and return best
      compatibleRAM.sort((a, b) => b.score - a.score);
      const selected = compatibleRAM[0].component;
      
      console.log(`✅ Selected compatible RAM: ${selected.name} for ${motherboard.name}`);
      return selected;

    } catch (error) {
      console.error(`Error finding compatible RAM for ${motherboard.name}:`, error);
      return null;
    }
  }

  /**
   * Find PSU with adequate wattage
   */
  async findCompatiblePSU(requiredWattage: number, budget: number, region: Region): Promise<Component | null> {
    try {
      const dbComponents = await componentDatabaseService.getComponentsByCategory('psu', region);
      
      const adequatePSUs = [];
      
      for (const dbComp of dbComponents) {
        const psu = await this.convertDatabaseComponent(dbComp, region);
        if (!psu) continue;

        // Check if PSU has enough wattage
        const compatibility = componentCompatibilityService.checkBuildCompatibility({
          psu
        });

        // Extract PSU wattage from name or specs
        const psuWattage = this.extractPSUWattage(psu);
        
        if (psuWattage >= requiredWattage) {
          adequatePSUs.push({
            component: psu,
            score: this.calculatePSUScore(psu, psuWattage, requiredWattage, budget, region),
            wattage: psuWattage
          });
        }
      }

      if (adequatePSUs.length === 0) {
        console.warn(`No PSU found with adequate wattage (${requiredWattage}W)`);
        return null;
      }

      // Sort by score and return best
      adequatePSUs.sort((a, b) => b.score - a.score);
      const selected = adequatePSUs[0].component;
      
      console.log(`✅ Selected PSU: ${selected.name} (${adequatePSUs[0].wattage}W for ${requiredWattage}W requirement)`);
      return selected;

    } catch (error) {
      console.error(`Error finding compatible PSU for ${requiredWattage}W:`, error);
      return null;
    }
  }

  /**
   * Extract PSU wattage from component
   */
  private extractPSUWattage(psu: Component): number {
    // Check specs first
    if (psu.specs?.wattage) return psu.specs.wattage;
    
    // Extract from name
    const wattageMatch = psu.name.match(/(\d{3,4})W/);
    if (wattageMatch) return parseInt(wattageMatch[1]);
    
    // Default estimate
    return 500;
  }

  /**
   * Calculate PSU score considering wattage efficiency
   */
  private calculatePSUScore(psu: Component, psuWattage: number, requiredWattage: number, budget: number, region: Region): number {
    let score = this.calculateComponentScore(psu, budget, region);
    
    // Efficiency bonus - prefer PSUs with 20-30% headroom
    const headroom = (psuWattage - requiredWattage) / requiredWattage;
    if (headroom >= 0.2 && headroom <= 0.5) {
      score += 0.2; // Optimal headroom
    } else if (headroom > 0.5) {
      score += 0.1; // Good but potentially overkill
    }
    
    // Efficiency rating bonus
    if (psu.name.includes('80+ Gold')) score += 0.1;
    if (psu.name.includes('80+ Platinum')) score += 0.15;
    if (psu.name.includes('80+ Titanium')) score += 0.2;
    
    return score;
  }
}

export const databaseBudgetAllocator = new DatabaseBudgetAllocator();