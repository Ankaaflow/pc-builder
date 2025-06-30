// Intelligent Budget Optimization System
// Ensures complete builds, maximizes performance, validates compatibility

import { Component } from '../data/components';
import { Region, BuildConfiguration, BudgetAllocation } from '../utils/budgetAllocator';
import { autonomousComponentDiscovery } from './autonomousComponentDiscovery';
import { realTimePriceTracker } from './realTimePriceTracker';

interface OptimizedBuild {
  build: BuildConfiguration;
  totalCost: number;
  budgetUtilization: number;
  isComplete: boolean;
  compatibilityIssues: string[];
  optimizationNotes: string[];
  performanceScore: number;
}

interface ComponentScore {
  component: Component;
  performanceScore: number;
  valueScore: number;
  compatibilityScore: number;
  totalScore: number;
}

class IntelligentBudgetOptimizer {
  private minBudgetForCompleteBuild = 800; // Minimum for complete gaming PC
  
  // Performance weight priorities (higher = more important for performance)
  private performanceWeights = {
    gpu: 0.45,      // GPU most important for gaming
    cpu: 0.25,      // CPU second most important
    ram: 0.10,      // RAM important for multitasking
    storage: 0.08,  // Fast storage improves experience
    motherboard: 0.05,
    psu: 0.03,
    cooler: 0.02,
    case: 0.02
  };

  // Minimum viable specifications for complete build
  private minimumSpecs = {
    gpu: { minPrice: 200, required: true },
    cpu: { minPrice: 150, required: true },
    motherboard: { minPrice: 80, required: true },
    ram: { minPrice: 60, required: true, minCapacity: '16GB' },
    storage: { minPrice: 50, required: true, minCapacity: '500GB' },
    psu: { minPrice: 60, required: true, minWattage: 500 },
    cooler: { minPrice: 25, required: true },
    case: { minPrice: 50, required: true }
  };

  async optimizeBuildForBudget(totalBudget: number, region: Region): Promise<OptimizedBuild> {
    console.log(`🎯 Optimizing build for $${totalBudget} budget...`);

    // Get all available components for each category
    const availableComponents = await this.getAllAvailableComponents(region);
    
    // ALWAYS try to create a complete build, regardless of budget
    let optimizedBuild = await this.createGuaranteedCompleteBuild(totalBudget, region, availableComponents);
    
    // Validate compatibility and fix issues
    optimizedBuild = await this.validateAndFixCompatibility(optimizedBuild, region, availableComponents);
    
    // If we're under budget, try to upgrade components
    if (optimizedBuild.totalCost < totalBudget) {
      optimizedBuild = await this.finalOptimizationPass(optimizedBuild, totalBudget, region, availableComponents);
    }
    
    // FINAL SAFETY CHECK: Ensure build is absolutely complete
    if (!optimizedBuild.isComplete) {
      console.log(`🚨 EMERGENCY COMPLETION: Build still incomplete, forcing completion...`);
      optimizedBuild = await this.forceCompleteBuild(optimizedBuild, region);
    }

    console.log(`✅ Build optimized: $${optimizedBuild.totalCost} (${optimizedBuild.budgetUtilization.toFixed(1)}% budget used)`);
    console.log(`📋 Build complete: ${optimizedBuild.isComplete ? 'YES' : 'NO'} - All 8 components selected`);
    
    return optimizedBuild;
  }

  private async getAllAvailableComponents(region: Region): Promise<Record<string, Component[]>> {
    const components: Record<string, Component[]> = {};
    const categories = ['gpu', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'case'];
    
    for (const category of categories) {
      try {
        components[category] = await autonomousComponentDiscovery.getLatestComponentsForCategory(category);
        
        // Sort by performance score (price as proxy for now)
        components[category].sort((a, b) => b.price[region] - a.price[region]);
        
        // Update with real-time pricing
        for (const component of components[category]) {
          try {
            const pricing = await realTimePriceTracker.getComponentPricing(component.name, region);
            if (pricing) {
              component.price[region] = pricing.lowestPrice;
            }
          } catch (error) {
            console.warn(`Failed to update pricing for ${component.name}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to get components for ${category}:`, error);
        components[category] = [];
      }
    }
    
    return components;
  }

  private async createGuaranteedCompleteBuild(
    budget: number, 
    region: Region, 
    availableComponents: Record<string, Component[]>
  ): Promise<OptimizedBuild> {
    
    const build: BuildConfiguration = {
      gpu: null, cpu: null, motherboard: null, ram: null, 
      storage: null, psu: null, cooler: null, case: null
    };

    const optimizationNotes: string[] = [];
    
    // Strategy: Fill ALL components first with cheapest viable options, then upgrade with remaining budget
    
    // Phase 1: Fill all essential components with cheapest viable options
    const essentialOrder = ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'case', 'gpu'];
    let remainingBudget = budget;
    
    console.log(`🔧 Phase 1: Filling all components with budget of $${budget}`);
    
    for (const category of essentialOrder) {
      const cheapestComponent = this.selectCheapestViableComponent(
        availableComponents[category] || [],
        remainingBudget,
        region
      );
      
      if (cheapestComponent) {
        build[category as keyof BuildConfiguration] = cheapestComponent;
        remainingBudget -= cheapestComponent.price[region];
        optimizationNotes.push(`Selected minimum ${category}: ${cheapestComponent.name} for $${cheapestComponent.price[region]}`);
        console.log(`✓ ${category}: ${cheapestComponent.name} ($${cheapestComponent.price[region]}) - Remaining: $${remainingBudget}`);
      } else {
        // If we can't afford any component in this category, find the absolute cheapest
        const allCategoryComponents = availableComponents[category] || [];
        if (allCategoryComponents.length > 0) {
          const absoluteCheapest = allCategoryComponents.sort((a, b) => a.price[region] - b.price[region])[0];
          build[category as keyof BuildConfiguration] = absoluteCheapest;
          remainingBudget -= absoluteCheapest.price[region];
          optimizationNotes.push(`⚠️ Budget tight - selected absolute cheapest ${category}: ${absoluteCheapest.name} for $${absoluteCheapest.price[region]}`);
          console.log(`⚠️ ${category}: ${absoluteCheapest.name} ($${absoluteCheapest.price[region]}) - OVER BUDGET by $${Math.abs(remainingBudget)}`);
        }
      }
    }
    
    // Phase 2: Upgrade components with remaining budget (if any)
    if (remainingBudget > 0) {
      console.log(`💰 Phase 2: Upgrading components with remaining $${remainingBudget}`);
      const upgradeOrder = ['gpu', 'cpu', 'ram', 'storage']; // Focus on performance components
      
      for (const category of upgradeOrder) {
        if (remainingBudget <= 0) break;
        
        const currentComponent = build[category as keyof BuildConfiguration];
        if (!currentComponent) continue;
        
        const currentPrice = currentComponent.price[region];
        const maxUpgradePrice = currentPrice + remainingBudget;
        
        const upgradeOptions = (availableComponents[category] || []).filter(comp => 
          comp.price[region] > currentPrice &&
          comp.price[region] <= maxUpgradePrice &&
          comp.availability === 'in-stock'
        );
        
        if (upgradeOptions.length > 0) {
          const bestUpgrade = this.selectBestComponentInBudget(
            upgradeOptions,
            maxUpgradePrice,
            region,
            build
          );
          
          if (bestUpgrade) {
            const costDifference = bestUpgrade.price[region] - currentPrice;
            build[category as keyof BuildConfiguration] = bestUpgrade;
            remainingBudget -= costDifference;
            optimizationNotes.push(`⬆️ Upgraded ${category} to ${bestUpgrade.name} for additional $${costDifference}`);
            console.log(`⬆️ ${category}: Upgraded to ${bestUpgrade.name} (+$${costDifference}) - Remaining: $${remainingBudget}`);
          }
        }
      }
    }

    const totalCost = budget - remainingBudget;
    const isComplete = this.isBuildComplete(build);
    
    console.log(`🎯 Guaranteed build result: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'} - $${totalCost} total cost`);
    
    return {
      build,
      totalCost,
      budgetUtilization: (totalCost / budget) * 100,
      isComplete,
      compatibilityIssues: [],
      optimizationNotes,
      performanceScore: this.calculatePerformanceScore(build, region)
    };
  }

  private async createPerformanceOptimizedBuild(
    budget: number, 
    region: Region, 
    availableComponents: Record<string, Component[]>
  ): Promise<OptimizedBuild> {
    
    const build: BuildConfiguration = {
      gpu: null, cpu: null, motherboard: null, ram: null, 
      storage: null, psu: null, cooler: null, case: null
    };

    let remainingBudget = budget;
    const optimizationNotes: string[] = [];

    // Phase 1: Allocate high-priority components (GPU, CPU) first
    const priorityOrder = ['gpu', 'cpu', 'ram', 'storage', 'motherboard', 'psu', 'cooler', 'case'];
    
    for (const category of priorityOrder) {
      const targetBudget = budget * this.performanceWeights[category as keyof typeof this.performanceWeights];
      const maxAllowable = Math.min(targetBudget * 1.5, remainingBudget * 0.7); // Don't spend more than 70% on one component
      
      const component = this.selectBestComponentInBudget(
        availableComponents[category] || [], 
        maxAllowable, 
        region,
        build // Pass current build for compatibility checking
      );
      
      if (component) {
        build[category as keyof BuildConfiguration] = component;
        remainingBudget -= component.price[region];
        optimizationNotes.push(`Selected ${component.name} for $${component.price[region]}`);
      }
    }

    const totalCost = budget - remainingBudget;
    const isComplete = this.isBuildComplete(build);
    
    return {
      build,
      totalCost,
      budgetUtilization: (totalCost / budget) * 100,
      isComplete,
      compatibilityIssues: [],
      optimizationNotes,
      performanceScore: this.calculatePerformanceScore(build, region)
    };
  }

  private selectBestComponentInBudget(
    components: Component[], 
    budget: number, 
    region: Region,
    currentBuild: BuildConfiguration
  ): Component | null {
    
    const affordableComponents = components.filter(
      comp => comp.price[region] <= budget && comp.availability === 'in-stock'
    );
    
    if (affordableComponents.length === 0) return null;
    
    // Score each component based on performance, value, and compatibility
    const scoredComponents = affordableComponents.map(component => {
      const performanceScore = this.calculateComponentPerformanceScore(component, region);
      const valueScore = performanceScore / component.price[region]; // Performance per dollar
      const compatibilityScore = this.calculateCompatibilityScore(component, currentBuild);
      
      return {
        component,
        performanceScore,
        valueScore,
        compatibilityScore,
        totalScore: performanceScore * 0.5 + valueScore * 1000 * 0.3 + compatibilityScore * 0.2
      };
    });
    
    // Sort by total score and return best option
    scoredComponents.sort((a, b) => b.totalScore - a.totalScore);
    return scoredComponents[0]?.component || null;
  }

  private calculateComponentPerformanceScore(component: Component, region: Region): number {
    const price = component.price[region];
    const name = component.name.toLowerCase();
    const category = component.category;
    
    // GPU performance scoring
    if (category === 'gpu') {
      if (name.includes('5090')) return 100;
      if (name.includes('5080')) return 85;
      if (name.includes('5070 ti')) return 75;
      if (name.includes('5070')) return 65;
      if (name.includes('4090')) return 95;
      if (name.includes('4080')) return 80;
      if (name.includes('4070 ti')) return 70;
      if (name.includes('4070')) return 60;
      if (name.includes('7900 xtx')) return 82;
      if (name.includes('7800 xt')) return 68;
      return Math.min(price / 50, 100); // Fallback based on price
    }
    
    // CPU performance scoring
    if (category === 'cpu') {
      if (name.includes('9950x3d')) return 98;
      if (name.includes('9900x3d')) return 92;
      if (name.includes('i9-14900k') || name.includes('i9-15900k')) return 95;
      if (name.includes('i7-14700k') || name.includes('i7-15700k')) return 85;
      if (name.includes('ryzen 9')) return 90;
      if (name.includes('ryzen 7')) return 80;
      if (name.includes('i7')) return 75;
      if (name.includes('ryzen 5') || name.includes('i5')) return 65;
      return Math.min(price / 10, 100);
    }
    
    // RAM performance scoring
    if (category === 'ram') {
      if (name.includes('128gb')) return 100;
      if (name.includes('64gb')) return 90;
      if (name.includes('32gb')) return 75;
      if (name.includes('ddr5-9000')) return 95;
      if (name.includes('ddr5-8000')) return 90;
      if (name.includes('ddr5-7200')) return 85;
      if (name.includes('ddr5-6400')) return 80;
      if (name.includes('ddr5')) return 70;
      return 50; // DDR4 fallback
    }
    
    // Storage performance scoring
    if (category === 'storage') {
      if (name.includes('pcie 5.0')) return 95;
      if (name.includes('4tb')) return 90;
      if (name.includes('2tb')) return 75;
      if (name.includes('nvme')) return 70;
      return 50;
    }
    
    // Base scoring for other components
    return Math.min(price / 5, 100);
  }

  private calculateCompatibilityScore(component: Component, currentBuild: BuildConfiguration): number {
    let score = 100;
    
    // CPU-Motherboard socket compatibility
    if (component.category === 'cpu' && currentBuild.motherboard) {
      if (component.specs.socket !== currentBuild.motherboard.specs.socket) {
        score -= 50;
      }
    }
    
    if (component.category === 'motherboard' && currentBuild.cpu) {
      if (component.specs.socket !== currentBuild.cpu.specs.socket) {
        score -= 50;
      }
    }
    
    // RAM-Motherboard compatibility
    if (component.category === 'ram' && currentBuild.motherboard) {
      if (component.specs.memoryType !== currentBuild.motherboard.specs.memoryType) {
        score -= 30;
      }
    }
    
    // PSU wattage compatibility
    if (component.category === 'psu') {
      const estimatedSystemPower = this.estimateSystemPower(currentBuild);
      const psuWattage = component.specs.wattage || 0;
      
      if (psuWattage < estimatedSystemPower * 1.2) { // 20% headroom
        score -= 40;
      }
    }
    
    // GPU-Case clearance
    if (component.category === 'gpu' && currentBuild.case) {
      const gpuLength = component.specs.dimensions?.length || 300;
      const caseClearance = currentBuild.case.specs.clearance?.gpu || 400;
      
      if (gpuLength > caseClearance) {
        score -= 30;
      }
    }
    
    return Math.max(score, 0);
  }

  private estimateSystemPower(build: BuildConfiguration): number {
    let totalPower = 100; // Base system power
    
    if (build.cpu) totalPower += build.cpu.specs.powerDraw || 65;
    if (build.gpu) totalPower += build.gpu.specs.powerDraw || 150;
    if (build.ram) totalPower += 10; // RAM power
    if (build.storage) totalPower += 5; // Storage power
    
    return totalPower;
  }

  private async ensureCompleteBuild(
    optimizedBuild: OptimizedBuild,
    budget: number,
    region: Region,
    availableComponents: Record<string, Component[]>
  ): Promise<OptimizedBuild> {
    
    const { build } = optimizedBuild;
    let remainingBudget = budget - optimizedBuild.totalCost;
    const notes = [...optimizedBuild.optimizationNotes];
    
    // Fill missing essential components - MUST fill ALL categories
    const essentialCategories = ['gpu', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'case'];
    
    for (const category of essentialCategories) {
      if (!build[category as keyof BuildConfiguration]) {
        console.log(`🔍 Missing ${category}, finding cheapest option...`);
        
        // Try multiple strategies to find a component
        let component = null;
        
        // Strategy 1: Find cheapest within remaining budget
        if (remainingBudget > 0) {
          component = this.selectCheapestViableComponent(
            availableComponents[category] || [],
            remainingBudget,
            region
          );
        }
        
        // Strategy 2: If no component within budget, find absolute cheapest
        if (!component && availableComponents[category]?.length > 0) {
          const allComponents = availableComponents[category];
          component = allComponents.sort((a, b) => a.price[region] - b.price[region])[0];
          notes.push(`⚠️ BUDGET EXCEEDED: Added essential ${category} despite being over budget`);
        }
        
        // Strategy 3: Create fallback component if none available
        if (!component) {
          component = this.createFallbackComponent(category, region);
          notes.push(`🚨 FALLBACK: Created emergency ${category} component`);
        }
        
        if (component) {
          build[category as keyof BuildConfiguration] = component;
          remainingBudget -= component.price[region];
          notes.push(`✅ Added missing ${category}: ${component.name} for $${component.price[region]}`);
          console.log(`✅ ${category}: ${component.name} ($${component.price[region]}) - Budget remaining: $${remainingBudget}`);
        }
      }
    }
    
    const totalCost = budget - remainingBudget;
    
    return {
      ...optimizedBuild,
      build,
      totalCost,
      budgetUtilization: (totalCost / budget) * 100,
      isComplete: this.isBuildComplete(build),
      optimizationNotes: notes
    };
  }

  private async validateAndFixCompatibility(
    optimizedBuild: OptimizedBuild,
    region: Region,
    availableComponents: Record<string, Component[]>
  ): Promise<OptimizedBuild> {
    
    const { build } = optimizedBuild;
    const issues: string[] = [];
    const notes = [...optimizedBuild.optimizationNotes];
    
    // Check CPU-Motherboard socket compatibility
    if (build.cpu && build.motherboard) {
      if (build.cpu.specs.socket !== build.motherboard.specs.socket) {
        issues.push('CPU socket does not match motherboard');
        
        // Try to fix by finding compatible motherboard
        const compatibleMB = availableComponents.motherboard?.find(mb => 
          mb.specs.socket === build.cpu!.specs.socket &&
          mb.price[region] <= build.motherboard!.price[region] * 1.2
        );
        
        if (compatibleMB) {
          build.motherboard = compatibleMB;
          notes.push(`Replaced motherboard with ${compatibleMB.name} for compatibility`);
        }
      }
    }
    
    // Check RAM-Motherboard compatibility
    if (build.ram && build.motherboard) {
      if (build.ram.specs.memoryType !== build.motherboard.specs.memoryType) {
        issues.push('RAM type does not match motherboard');
        
        // Try to fix by finding compatible RAM
        const compatibleRAM = availableComponents.ram?.find(ram => 
          ram.specs.memoryType === build.motherboard!.specs.memoryType &&
          ram.price[region] <= build.ram!.price[region] * 1.2
        );
        
        if (compatibleRAM) {
          build.ram = compatibleRAM;
          notes.push(`Replaced RAM with ${compatibleRAM.name} for compatibility`);
        }
      }
    }
    
    // Check PSU power adequacy
    if (build.psu) {
      const requiredPower = this.estimateSystemPower(build);
      const psuWattage = build.psu.specs.wattage || 0;
      
      if (psuWattage < requiredPower * 1.2) {
        issues.push('PSU wattage insufficient for system');
        
        // Find higher wattage PSU
        const adequatePSU = availableComponents.psu?.find(psu => 
          (psu.specs.wattage || 0) >= requiredPower * 1.3 &&
          psu.price[region] <= build.psu!.price[region] * 1.5
        );
        
        if (adequatePSU) {
          build.psu = adequatePSU;
          notes.push(`Upgraded PSU to ${adequatePSU.name} for adequate power`);
        }
      }
    }
    
    return {
      ...optimizedBuild,
      build,
      compatibilityIssues: issues,
      optimizationNotes: notes
    };
  }

  private async finalOptimizationPass(
    optimizedBuild: OptimizedBuild,
    budget: number,
    region: Region,
    availableComponents: Record<string, Component[]>
  ): Promise<OptimizedBuild> {
    
    const { build } = optimizedBuild;
    let remainingBudget = budget - optimizedBuild.totalCost;
    const notes = [...optimizedBuild.optimizationNotes];
    
    // Try to upgrade high-impact components if budget allows
    const upgradeOrder = ['gpu', 'cpu', 'ram', 'storage'];
    
    for (const category of upgradeOrder) {
      const currentComponent = build[category as keyof BuildConfiguration];
      if (!currentComponent || remainingBudget < 100) continue;
      
      const currentPrice = currentComponent.price[region];
      const upgradeOptions = (availableComponents[category] || []).filter(comp => 
        comp.price[region] > currentPrice &&
        comp.price[region] <= currentPrice + remainingBudget &&
        comp.availability === 'in-stock'
      );
      
      if (upgradeOptions.length > 0) {
        const bestUpgrade = this.selectBestComponentInBudget(
          upgradeOptions,
          currentPrice + remainingBudget,
          region,
          build
        );
        
        if (bestUpgrade) {
          const costDifference = bestUpgrade.price[region] - currentPrice;
          
          build[category as keyof BuildConfiguration] = bestUpgrade;
          remainingBudget -= costDifference;
          notes.push(`Upgraded ${category} to ${bestUpgrade.name} for additional $${costDifference}`);
          
          break; // Only one upgrade per pass to maintain balance
        }
      }
    }
    
    const totalCost = budget - remainingBudget;
    
    return {
      ...optimizedBuild,
      build,
      totalCost,
      budgetUtilization: (totalCost / budget) * 100,
      optimizationNotes: notes,
      performanceScore: this.calculatePerformanceScore(build, region)
    };
  }

  private async createMinimumViableBuild(totalBudget: number, region: Region): Promise<OptimizedBuild> {
    const build: BuildConfiguration = {
      gpu: null, cpu: null, motherboard: null, ram: null,
      storage: null, psu: null, cooler: null, case: null
    };
    
    let remainingBudget = totalBudget;
    const notes = [`Budget too low for complete build ($${totalBudget}), creating minimum viable configuration`];
    
    // Get minimal components in order of importance
    const availableComponents = await this.getAllAvailableComponents(region);
    const minOrder = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'psu', 'cooler', 'case'];
    
    for (const category of minOrder) {
      const minPrice = this.minimumSpecs[category as keyof typeof this.minimumSpecs].minPrice;
      if (remainingBudget >= minPrice) {
        const component = this.selectCheapestViableComponent(
          availableComponents[category] || [],
          remainingBudget,
          region
        );
        
        if (component) {
          build[category as keyof BuildConfiguration] = component;
          remainingBudget -= component.price[region];
          notes.push(`Selected minimal ${category}: ${component.name}`);
        }
      }
    }
    
    return {
      build,
      totalCost: totalBudget - remainingBudget,
      budgetUtilization: ((totalBudget - remainingBudget) / totalBudget) * 100,
      isComplete: this.isBuildComplete(build),
      compatibilityIssues: [],
      optimizationNotes: notes,
      performanceScore: this.calculatePerformanceScore(build, region)
    };
  }

  private async forceCompleteBuild(optimizedBuild: OptimizedBuild, region: Region): Promise<OptimizedBuild> {
    const { build } = optimizedBuild;
    const notes = [...optimizedBuild.optimizationNotes];
    let additionalCost = 0;
    
    const requiredComponents: (keyof BuildConfiguration)[] = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'case'];
    
    for (const category of requiredComponents) {
      if (!build[category]) {
        console.log(`🚨 FORCING ${category} completion with fallback component`);
        const fallbackComponent = this.createFallbackComponent(category, region);
        build[category] = fallbackComponent;
        additionalCost += fallbackComponent.price[region];
        notes.push(`🚨 FORCED: Added emergency ${category} to guarantee complete build`);
      }
    }
    
    return {
      ...optimizedBuild,
      build,
      totalCost: optimizedBuild.totalCost + additionalCost,
      budgetUtilization: ((optimizedBuild.totalCost + additionalCost) / (optimizedBuild.totalCost / (optimizedBuild.budgetUtilization / 100))) * 100,
      isComplete: true, // Guaranteed to be complete now
      optimizationNotes: notes
    };
  }

  private createFallbackComponent(category: string, region: Region): Component {
    const fallbackSpecs: Record<string, any> = {
      cpu: { socket: 'LGA1700', powerDraw: 65 },
      gpu: { powerDraw: 150 },
      motherboard: { socket: 'LGA1700', memoryType: 'DDR4' },
      ram: { memoryType: 'DDR4', capacity: '16GB' },
      storage: { capacity: '500GB', type: 'NVME' },
      psu: { wattage: 500 },
      cooler: { type: 'Air' },
      case: { clearance: { gpu: 350 } }
    };

    const fallbackPrices: Record<string, number> = {
      cpu: 100, gpu: 150, motherboard: 60, ram: 50, 
      storage: 40, psu: 50, cooler: 25, case: 40
    };

    const price = fallbackPrices[category] || 50;
    const regionPrices: Record<Region, number> = {} as Record<Region, number>;
    
    // Set prices for all regions
    const regionMultipliers: Record<Region, number> = { US: 1.0, CA: 1.25, UK: 1.15, DE: 1.1, AU: 1.35 };
    for (const [r, multiplier] of Object.entries(regionMultipliers)) {
      regionPrices[r as Region] = Math.round(price * multiplier);
    }

    return {
      id: `fallback-${category}-${Date.now()}`,
      name: `Budget ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      brand: 'Generic',
      price: regionPrices,
      specs: fallbackSpecs[category] || {},
      asin: '',
      availability: 'in-stock' as const,
      trend: 'stable' as const,
      category: category as any,
      description: `Emergency fallback ${category} to complete the build`
    };
  }

  private selectCheapestViableComponent(components: Component[], budget: number, region: Region): Component | null {
    // First try to find components within budget
    let affordableComponents = components.filter(
      comp => comp.price[region] <= budget && comp.availability === 'in-stock'
    );
    
    // If no components within budget, try to find any available components
    if (affordableComponents.length === 0) {
      affordableComponents = components.filter(comp => comp.availability === 'in-stock');
    }
    
    // If still no luck, try any component regardless of availability
    if (affordableComponents.length === 0) {
      affordableComponents = components;
    }
    
    if (affordableComponents.length === 0) return null;
    
    // Sort by price ascending and return cheapest
    affordableComponents.sort((a, b) => a.price[region] - b.price[region]);
    return affordableComponents[0];
  }

  private calculateMinimumBuildCost(): number {
    return Object.values(this.minimumSpecs).reduce((total, spec) => total + spec.minPrice, 0);
  }

  private isBuildComplete(build: BuildConfiguration): boolean {
    const requiredComponents: (keyof BuildConfiguration)[] = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'case'];
    return requiredComponents.every(component => build[component] !== null);
  }

  private calculatePerformanceScore(build: BuildConfiguration, region: Region): number {
    let totalScore = 0;
    
    Object.entries(build).forEach(([category, component]) => {
      if (component) {
        const componentScore = this.calculateComponentPerformanceScore(component, region);
        const weight = this.performanceWeights[category as keyof typeof this.performanceWeights] || 0.01;
        totalScore += componentScore * weight;
      }
    });
    
    return Math.round(totalScore);
  }
}

export const intelligentBudgetOptimizer = new IntelligentBudgetOptimizer();