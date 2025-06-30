import { Component, allComponents } from '../data/components';
import { allRealComponents } from '../data/realComponents';
import { retailVerificationService } from '../services/retailVerification';
import { redditService } from '../services/redditService';
import { autonomousComponentDiscovery } from '../services/autonomousComponentDiscovery';
import { realTimePriceTracker } from '../services/realTimePriceTracker';
import { amazonProductMatcher } from '../services/amazonProductMatcher';

export type Region = 'US' | 'CA' | 'UK' | 'DE' | 'AU';

// Re-export Component type and allComponents value
export type { Component };
export { allComponents };

export interface BudgetAllocation {
  cpu: number;
  gpu: number;
  motherboard: number;
  ram: number;
  storage: number;
  cooler: number;
  psu: number;
  case: number;
}

export interface BuildConfiguration {
  cpu: Component | null;
  gpu: Component | null;
  motherboard: Component | null;
  ram: Component | null;
  storage: Component | null;
  cooler: Component | null;
  psu: Component | null;
  case: Component | null;
}

export const budgetPercentages: BudgetAllocation = {
  gpu: 0.35,
  cpu: 0.20,
  motherboard: 0.10,
  ram: 0.08,
  storage: 0.08,
  psu: 0.08,
  cooler: 0.06,
  case: 0.05
};

export function calculateBudgetAllocation(totalBudget: number): BudgetAllocation {
  return {
    cpu: Math.round(totalBudget * budgetPercentages.cpu),
    gpu: Math.round(totalBudget * budgetPercentages.gpu),
    motherboard: Math.round(totalBudget * budgetPercentages.motherboard),
    ram: Math.round(totalBudget * budgetPercentages.ram),
    storage: Math.round(totalBudget * budgetPercentages.storage),
    cooler: Math.round(totalBudget * budgetPercentages.cooler),
    psu: Math.round(totalBudget * budgetPercentages.psu),
    case: Math.round(totalBudget * budgetPercentages.case)
  };
}

export async function validateComponentASINs(
  components: Component[],
  region: Region
): Promise<Component[]> {
  console.log(`Validating ASINs for ${components.length} components in ${region}...`);
  
  try {
    // Use Amazon Product Matcher to validate and update ASINs
    const validatedComponents = await amazonProductMatcher.validateAndUpdateASINs(components, region);
    
    console.log(`ASIN validation complete. Updated ${validatedComponents.length} components.`);
    return validatedComponents;
    
  } catch (error) {
    console.warn('ASIN validation failed, using original components:', error);
    return components;
  }
}

export async function findBestComponent(
  category: keyof typeof allComponents,
  budget: number,
  region: Region,
  requirements?: any
): Promise<Component | null> {
  // Start with the most current components from autonomous discovery
  let allCategoryComponents: Component[] = [];
  
  try {
    // Get latest autonomous discoveries (includes RTX 50 series, etc.)
    const autonomousComponents = await autonomousComponentDiscovery.getLatestComponentsForCategory(category);
    allCategoryComponents = [...autonomousComponents];
    
    // Update prices with real-time data
    for (const component of allCategoryComponents) {
      try {
        const pricing = await realTimePriceTracker.getComponentPricing(component.name, region);
        if (pricing) {
          component.price[region] = pricing.lowestPrice;
          component.trend = pricing.trending;
          component.availability = pricing.retailers.some(r => r.availability === 'in-stock') ? 'in-stock' : 'limited';
        }
      } catch (error) {
        console.warn(`Failed to update pricing for ${component.name}:`, error);
      }
    }
    
  } catch (error) {
    console.warn('Autonomous discovery failed, falling back to verified components:', error);
    allCategoryComponents = [...allRealComponents[category]];
  }
  
  // Add verified real components if we don't have enough options
  if (allCategoryComponents.length < 8) {
    const existingNames = new Set(allCategoryComponents.map(c => c.name.toLowerCase()));
    const additionalComponents = allRealComponents[category].filter(
      rc => !existingNames.has(rc.name.toLowerCase())
    );
    allCategoryComponents = [...allCategoryComponents, ...additionalComponents];
  }

  // Try to get additional verified components from Reddit
  try {
    const redditComponents = await redditService.getLatestComponentsForType(category, region);
    
    if (redditComponents.length > 0) {
      // Filter Reddit components to only include real ones
      const verifiedRedditComponents = await retailVerificationService.filterRealComponents(redditComponents);
      
      // Merge with existing components, avoiding duplicates
      const existingNames = new Set(allCategoryComponents.map(c => c.name.toLowerCase()));
      const newVerifiedComponents = verifiedRedditComponents.filter(
        rc => !existingNames.has(rc.name.toLowerCase())
      );
      allCategoryComponents = [...allCategoryComponents, ...newVerifiedComponents];
    }
  } catch (error) {
    console.warn('Failed to fetch Reddit components:', error);
  }
  
  // Filter by availability first - we need in-stock components
  const available = allCategoryComponents.filter(
    component => component.availability === 'in-stock'
  );
  
  if (available.length === 0) return null;
  
  // Split into affordable and over-budget components
  const affordable = available.filter(component => component.price[region] <= budget);
  const overBudget = available.filter(component => component.price[region] > budget);
  
  // Sort function for prioritizing components
  const sortComponents = (a: Component, b: Component) => {
    // Prioritize autonomous discoveries (latest components)
    const aIsAutonomous = a.id.includes('auto') || a.id.includes('retailer') || a.id.includes('news');
    const bIsAutonomous = b.id.includes('auto') || b.id.includes('retailer') || b.id.includes('news');
    
    if (aIsAutonomous && !bIsAutonomous) return -1;
    if (!aIsAutonomous && bIsAutonomous) return 1;
    
    // Then prioritize real verified components
    const aIsReal = a.id.includes('real');
    const bIsReal = b.id.includes('real');
    
    if (aIsReal && !bIsReal) return -1;
    if (!aIsReal && bIsReal) return 1;
    
    // Finally sort by price descending (higher price = better performance assumption)
    return b.price[region] - a.price[region];
  };
  
  // If we have affordable options, return the best one within budget
  if (affordable.length > 0) {
    affordable.sort(sortComponents);
    const selectedComponent = affordable[0];
    
    // Validate and update ASIN for the selected component
    try {
      const amazonMatch = await amazonProductMatcher.findBestMatch(selectedComponent, region);
      if (amazonMatch && amazonMatch.asin !== selectedComponent.asin) {
        console.log(`Updated ASIN for ${selectedComponent.name}: ${selectedComponent.asin} → ${amazonMatch.asin}`);
        return {
          ...selectedComponent,
          asin: amazonMatch.asin,
          price: {
            ...selectedComponent.price,
            [region]: amazonMatch.price
          },
          availability: amazonMatch.availability
        };
      }
    } catch (error) {
      console.warn(`Failed to validate ASIN for ${selectedComponent.name}:`, error);
    }
    
    return selectedComponent;
  }
  
  // If no affordable options, return the cheapest available component
  // This ensures complete builds even when over budget
  overBudget.sort((a, b) => a.price[region] - b.price[region]); // Sort by price ascending for cheapest
  const selectedComponent = overBudget[0];
  
  // Validate ASIN for over-budget component too
  try {
    const amazonMatch = await amazonProductMatcher.findBestMatch(selectedComponent, region);
    if (amazonMatch && amazonMatch.asin !== selectedComponent.asin) {
      console.log(`Updated ASIN for over-budget ${selectedComponent.name}: ${selectedComponent.asin} → ${amazonMatch.asin}`);
      return {
        ...selectedComponent,
        asin: amazonMatch.asin,
        price: {
          ...selectedComponent.price,
          [region]: amazonMatch.price
        },
        availability: amazonMatch.availability
      };
    }
  } catch (error) {
    console.warn(`Failed to validate ASIN for ${selectedComponent.name}:`, error);
  }
  
  return selectedComponent;
}

export function checkCompatibility(build: BuildConfiguration): {
  isCompatible: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isCompatible = true;
  
  // Check CPU and Motherboard socket compatibility
  if (build.cpu && build.motherboard) {
    if (build.cpu.specs.socket !== build.motherboard.specs.socket) {
      warnings.push('CPU socket does not match motherboard socket');
      isCompatible = false;
    }
  }
  
  // Check RAM and Motherboard compatibility
  if (build.ram && build.motherboard) {
    if (build.ram.specs.memoryType !== build.motherboard.specs.memoryType) {
      warnings.push('RAM type does not match motherboard memory support');
      isCompatible = false;
    }
  }
  
  // Check power requirements
  if (build.cpu && build.gpu && build.psu) {
    const totalPower = (build.cpu.specs.powerDraw || 0) + (build.gpu.specs.powerDraw || 0) + 100; // +100 for other components
    const psuWattage = build.psu.specs.wattage || 0;
    
    if (totalPower > psuWattage * 0.8) { // 80% PSU utilization max
      warnings.push('Power supply may be insufficient for this configuration');
      isCompatible = false;
    }
  }
  
  // Check GPU clearance in case
  if (build.gpu && build.case) {
    const gpuLength = build.gpu.specs.dimensions?.length || 0;
    const caseGpuClearance = build.case.specs.clearance?.gpu || 0;
    
    if (gpuLength > caseGpuClearance) {
      warnings.push('Graphics card may not fit in selected case');
      isCompatible = false;
    }
  }
  
  // Check cooler clearance
  if (build.cooler && build.case) {
    const coolerHeight = build.cooler.specs.dimensions?.height || 0;
    const caseCoolerClearance = build.case.specs.clearance?.cooler || 0;
    
    if (coolerHeight > caseCoolerClearance) {
      warnings.push('CPU cooler may not fit in selected case');
      isCompatible = false;
    }
  }
  
  // Check cooler compatibility with CPU socket
  if (build.cooler && build.cpu) {
    const coolerCompatibility = build.cooler.specs.compatibility || [];
    const cpuSocket = build.cpu.specs.socket || '';
    
    if (!coolerCompatibility.includes(cpuSocket)) {
      warnings.push('CPU cooler is not compatible with selected CPU socket');
      isCompatible = false;
    }
  }
  
  return { isCompatible, warnings };
}

export async function generateRecommendedBuild(
  budget: number,
  region: Region
): Promise<BuildConfiguration> {
  // First try to get budget-specific recommendations from r/buildapcforme
  const budgetSpecificComponents: Component[] = [];
  
  try {
    const budgetMentions = await redditService.discoverComponentsForBudget(budget);
    console.log(`Found ${budgetMentions.length} budget-specific component mentions for $${budget}`);
    
    // Convert mentions to components for budget-specific matching
    for (const mention of budgetMentions.filter(m => m.confidence > 0.6)) {
      const component = await redditService.convertMentionToComponent(mention, region);
      if (component) {
        budgetSpecificComponents.push(component);
      }
    }
  } catch (error) {
    console.warn('Failed to get budget-specific components, using standard allocation:', error);
  }

  const allocation = calculateBudgetAllocation(budget);
  
  // Build components asynchronously, prioritizing budget-specific recommendations
  const [cpu, gpu, motherboard, ram, storage, cooler, psu, caseComponent] = await Promise.all([
    findBestComponentWithBudgetPreference('cpu', allocation.cpu, region, budgetSpecificComponents),
    findBestComponentWithBudgetPreference('gpu', allocation.gpu, region, budgetSpecificComponents),
    findBestComponentWithBudgetPreference('motherboard', allocation.motherboard, region, budgetSpecificComponents),
    findBestComponentWithBudgetPreference('ram', allocation.ram, region, budgetSpecificComponents),
    findBestComponentWithBudgetPreference('storage', allocation.storage, region, budgetSpecificComponents),
    findBestComponentWithBudgetPreference('cooler', allocation.cooler, region, budgetSpecificComponents),
    findBestComponentWithBudgetPreference('psu', allocation.psu, region, budgetSpecificComponents),
    findBestComponentWithBudgetPreference('case', allocation.case, region, budgetSpecificComponents)
  ]);
  
  const build: BuildConfiguration = {
    cpu,
    gpu,
    motherboard,
    ram,
    storage,
    cooler,
    psu,
    case: caseComponent
  };
  
  return build;
}

async function findBestComponentWithBudgetPreference(
  category: keyof typeof allComponents,
  budget: number,
  region: Region,
  budgetSpecificComponents: Component[],
  requirements?: any
): Promise<Component | null> {
  // First try to find from budget-specific recommendations
  const budgetSpecificAvailable = budgetSpecificComponents
    .filter(c => c.category === category && c.availability === 'in-stock');
  
  if (budgetSpecificAvailable.length > 0) {
    // Split into affordable and over-budget budget-specific components
    const budgetSpecificAffordable = budgetSpecificAvailable
      .filter(c => c.price[region] <= budget)
      .sort((a, b) => b.price[region] - a.price[region]); // Higher price = better performance
    
    if (budgetSpecificAffordable.length > 0) {
      console.log(`Using budget-specific ${category} recommendation: ${budgetSpecificAffordable[0].name}`);
      return budgetSpecificAffordable[0];
    }
    
    // If no affordable budget-specific options, use cheapest budget-specific component
    const cheapestBudgetSpecific = budgetSpecificAvailable
      .sort((a, b) => a.price[region] - b.price[region])[0]; // Cheapest first
    
    console.log(`Using cheapest budget-specific ${category} recommendation (over budget): ${cheapestBudgetSpecific.name}`);
    return cheapestBudgetSpecific;
  }
  
  // Fallback to standard component discovery (which now also allows over-budget)
  return findBestComponent(category, budget, region, requirements);
}

export function calculateTotalPrice(build: BuildConfiguration, region: Region): number {
  let total = 0;
  
  Object.values(build).forEach(component => {
    if (component) {
      total += component.price[region];
    }
  });
  
  return total;
}

export function generateAffiliateLink(asin: string, region: Region): string {
  // Check for invalid/placeholder ASINs first
  if (!asin || asin === 'placeholder' || asin.startsWith('B0DJKL') || asin === '') {
    console.warn(`Invalid ASIN detected: ${asin}, falling back to search`);
    // We need the component name for search, but this function only has ASIN
    // Return a generic search instead
    return generateGenericFallbackLink(region);
  }

  const affiliateTags = {
    US: 'pcbuilder-20',
    CA: 'pcbuilderCA-20',  // Fixed: Proper Canadian affiliate tag
    UK: 'pcbuilder-21',
    DE: 'pcbuilder-21', 
    AU: 'pcbuilderAU-20'   // Fixed: Proper Australian affiliate tag
  };
  
  const domains = {
    US: 'amazon.com',
    CA: 'amazon.ca',
    UK: 'amazon.co.uk',
    DE: 'amazon.de',
    AU: 'amazon.com.au'
  };
  
  // Generate the affiliate link
  const link = `https://${domains[region]}/dp/${asin}?tag=${affiliateTags[region]}`;
  
  console.log(`Generated Amazon link for ${region}: ${link}`);
  return link;
}

// Fallback for invalid ASINs - redirect to Amazon PC components search
function generateGenericFallbackLink(region: Region): string {
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

  // Generic PC components search
  const searchQuery = encodeURIComponent('pc components computer parts');
  
  const searchLink = `https://${domains[region]}/s?k=${searchQuery}&tag=${affiliateTags[region]}&ref=sr_st_relevancerank`;
  
  console.log(`Using generic fallback search for invalid ASIN on ${region}: ${searchLink}`);
  return searchLink;
}

// Enhanced version that takes component name for better search
export function generateSmartAffiliateLink(component: Component, region: Region): string {
  // Check for invalid/placeholder ASINs first
  if (!component.asin || component.asin === 'placeholder' || component.asin.startsWith('B0DJKL') || component.asin === '') {
    console.warn(`Invalid ASIN detected for ${component.name}: ${component.asin}, falling back to search`);
    return generateComponentSearchLink(component.name, region);
  }

  // Use the standard affiliate link generation
  return generateAffiliateLink(component.asin, region);
}

// Fallback search using component name
function generateComponentSearchLink(componentName: string, region: Region): string {
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

  // Clean and encode component name for search
  const searchQuery = encodeURIComponent(componentName.replace(/[^\w\s]/g, '').trim());
  
  const searchLink = `https://${domains[region]}/s?k=${searchQuery}&tag=${affiliateTags[region]}&ref=sr_st_relevancerank`;
  
  console.log(`Using component search for ${componentName} on ${region}: ${searchLink}`);
  return searchLink;
}
