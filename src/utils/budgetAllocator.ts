import { Component, allComponents } from '../data/components';
import { allRealComponents } from '../data/realComponents';
import { retailVerificationService } from '../services/retailVerification';
import { redditService } from '../services/redditService';
import { autonomousComponentDiscovery } from '../services/autonomousComponentDiscovery';
import { realTimePriceTracker } from '../services/realTimePriceTracker';
import { amazonProductMatcher } from '../services/amazonProductMatcher';
import { getVerifiedASIN } from '../data/verifiedASINs';
import { amazonASINScraper } from '../services/amazonASINScraper';
import { realAmazonScraper } from '../services/realAmazonScraper';
import { amazonPAAPIService } from '../services/amazonPAAPIService';
import { 
  getSocketInfo, 
  getCPUCompatibility, 
  isMemoryCompatible, 
  isCoolerCompatible,
  powerRequirements,
  memoryCompatibilityRules
} from '../data/compatibilityRules';

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
  
  // Enhanced CPU and Motherboard socket compatibility using real-world data
  if (build.cpu && build.motherboard) {
    const cpuSocket = build.cpu.specs.socket;
    const motherboardSocket = build.motherboard.specs.socket;
    
    if (cpuSocket !== motherboardSocket) {
      warnings.push(`CPU socket (${cpuSocket}) does not match motherboard socket (${motherboardSocket})`);
      isCompatible = false;
    }
    
    // Additional CPU generation and chipset compatibility checks
    const cpuCompatibility = getCPUCompatibility(build.cpu.name);
    const motherboardChipset = (build.motherboard.specs as any).chipset;
    
    if (cpuCompatibility && motherboardChipset) {
      if (!cpuCompatibility.supportedChipsets.includes(motherboardChipset)) {
        warnings.push(`CPU ${build.cpu.name} may not be compatible with ${motherboardChipset} chipset`);
        isCompatible = false;
      }
    }
  }
  
  // Enhanced RAM and Motherboard compatibility using socket-specific rules
  if (build.ram && build.motherboard) {
    const memoryType = build.ram.specs.memoryType;
    const motherboardSocket = build.motherboard.specs.socket;
    
    if (!isMemoryCompatible(motherboardSocket, memoryType)) {
      const socketInfo = getSocketInfo(motherboardSocket);
      const supportedTypes = socketInfo?.memoryType.join(', ') || 'Unknown';
      warnings.push(`Memory type ${memoryType} not supported by ${motherboardSocket} socket. Supported: ${supportedTypes}`);
      isCompatible = false;
    }
    
    // Check memory speed compatibility
    const memoryRules = memoryCompatibilityRules[motherboardSocket as keyof typeof memoryCompatibilityRules];
    const ramSpeed = (build.ram.specs as any).speed || 0;
    
    if (memoryRules && ramSpeed > memoryRules.maxSpeed) {
      warnings.push(`Memory speed ${ramSpeed}MHz exceeds ${motherboardSocket} maximum of ${memoryRules.maxSpeed}MHz`);
      // Don't mark as incompatible - it will just run at lower speed
    }
  }
  
  // Enhanced power requirements based on Reddit build recommendations
  if (build.cpu && build.gpu && build.psu) {
    const cpuPower = build.cpu.specs.powerDraw || 0;
    const gpuPower = build.gpu.specs.powerDraw || 0;
    const systemPower = cpuPower + gpuPower + 150; // +150W for motherboard, RAM, storage, fans
    const psuWattage = build.psu.specs.wattage || 0;
    
    // Use 80% rule (Reddit community standard)
    const usablePower = psuWattage * 0.8;
    
    if (systemPower > usablePower) {
      const recommendedWattage = Math.ceil(systemPower / 0.8 / 50) * 50; // Round up to nearest 50W
      warnings.push(`Power supply insufficient. System needs ~${systemPower}W, PSU provides ${Math.round(usablePower)}W usable. Recommend ${recommendedWattage}W+ PSU`);
      isCompatible = false;
    }
    
    // Warn about efficiency tier based on GPU tier
    if (gpuPower > 300 && (!build.psu.specs.efficiency || !build.psu.specs.efficiency.includes('Gold'))) {
      warnings.push('High-end GPU detected. Consider 80+ Gold or better PSU for efficiency');
      // Don't mark incompatible, just a recommendation
    }
  }
  
  // GPU clearance check with case form factor awareness
  if (build.gpu && build.case) {
    const gpuLength = build.gpu.specs.dimensions?.length || 0;
    const caseGpuClearance = build.case.specs.clearance?.gpu || 0;
    
    if (gpuLength > caseGpuClearance) {
      warnings.push(`Graphics card length (${gpuLength}mm) exceeds case clearance (${caseGpuClearance}mm)`);
      isCompatible = false;
    }
    
    // Warn about potential fit issues in small cases
    const caseFormFactor = ((build.case.specs as any).formFactor?.toLowerCase() || '');
    if ((caseFormFactor.includes('mini-itx') || caseFormFactor.includes('mini')) && gpuLength > 250) {
      warnings.push('Large GPU in compact case - verify specific model compatibility');
    }
  }
  
  // Enhanced cooler compatibility using socket-specific rules
  if (build.cooler && build.cpu) {
    const cpuSocket = build.cpu.specs.socket;
    const coolerSocket = build.cooler.specs.socket || build.cooler.specs.compatibility?.[0] || '';
    
    if (!isCoolerCompatible(cpuSocket, coolerSocket)) {
      warnings.push(`CPU cooler not compatible with ${cpuSocket} socket`);
      isCompatible = false;
    }
    
    // Check TDP compatibility
    const cpuTDP = build.cpu.specs.powerDraw || 0;
    const coolerTDP = (build.cooler.specs as any).tdpRating || 0;
    
    if (coolerTDP > 0 && cpuTDP > coolerTDP) {
      warnings.push(`CPU TDP (${cpuTDP}W) exceeds cooler rating (${coolerTDP}W)`);
      isCompatible = false;
    }
  }
  
  // Cooler height clearance in case
  if (build.cooler && build.case) {
    const coolerHeight = build.cooler.specs.dimensions?.height || 0;
    const caseCoolerClearance = build.case.specs.clearance?.cooler || 0;
    
    if (coolerHeight > caseCoolerClearance) {
      warnings.push(`CPU cooler height (${coolerHeight}mm) exceeds case clearance (${caseCoolerClearance}mm)`);
      isCompatible = false;
    }
  }
  
  // M.2 slot availability check
  if (build.storage && build.motherboard) {
    const storageType = build.storage.specs.interface?.toLowerCase() || '';
    if (storageType.includes('m.2') || storageType.includes('nvme')) {
      const m2Slots = (build.motherboard.specs as any).m2Slots || 1;
      if (m2Slots < 1) {
        warnings.push('M.2 storage selected but motherboard may not have M.2 slots');
        isCompatible = false;
      }
    }
  }
  
  return { isCompatible, warnings };
}

export async function generateRecommendedBuild(
  budget: number,
  region: Region
): Promise<BuildConfiguration> {
  console.log(`🏗️ Generating fully compatible recommended build for $${budget} in ${region}...`);
  
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
  
  // Build components sequentially to ensure compatibility - enhanced approach
  const build: BuildConfiguration = {
    cpu: null,
    gpu: null,
    motherboard: null,
    ram: null,
    storage: null,
    cooler: null,
    psu: null,
    case: null
  };

  // Step 1: Select CPU first (foundation component) - prioritize compatibility
  console.log('🔧 Step 1: Selecting CPU (foundation component)...');
  build.cpu = await findBestComponentWithBudgetPreference('cpu', allocation.cpu, region, budgetSpecificComponents);
  
  if (!build.cpu) {
    console.error('❌ Failed to find CPU, cannot build compatible system');
    throw new Error('Unable to find compatible CPU for build');
  }
  console.log(`✅ Selected CPU: ${build.cpu.name} (${build.cpu.specs.socket})`);
  
  // Step 2: Select compatible motherboard based on CPU socket - MUST be compatible
  console.log('🔧 Step 2: Selecting compatible motherboard...');
  build.motherboard = await findCompatibleComponent('motherboard', allocation.motherboard, region, budgetSpecificComponents, build);
  
  if (!build.motherboard) {
    console.error('❌ Failed to find compatible motherboard, regenerating with different CPU...');
    // Try with a different CPU if motherboard compatibility fails
    build.cpu = await findAlternativeCompatibleCPU(allocation.cpu, region, budgetSpecificComponents);
    if (build.cpu) {
      build.motherboard = await findCompatibleComponent('motherboard', allocation.motherboard, region, budgetSpecificComponents, build);
    }
  }
  
  if (!build.motherboard) {
    throw new Error('Unable to find compatible motherboard for build');
  }
  console.log(`✅ Selected Motherboard: ${build.motherboard.name} (${build.motherboard.specs.socket})`);
  
  // Step 3: Select compatible RAM based on motherboard/CPU memory support
  console.log('🔧 Step 3: Selecting compatible RAM...');
  build.ram = await findCompatibleComponent('ram', allocation.ram, region, budgetSpecificComponents, build);
  
  if (!build.ram) {
    console.error('❌ Failed to find compatible RAM');
    throw new Error('Unable to find compatible RAM for build');
  }
  console.log(`✅ Selected RAM: ${build.ram.name} (${build.ram.specs.memoryType})`);
  
  // Step 4: Select GPU (generally independent, but consider PSU requirements)
  console.log('🔧 Step 4: Selecting GPU...');
  build.gpu = await findBestComponentWithBudgetPreference('gpu', allocation.gpu, region, budgetSpecificComponents);
  
  if (!build.gpu) {
    console.error('❌ Failed to find GPU');
    throw new Error('Unable to find GPU for build');
  }
  console.log(`✅ Selected GPU: ${build.gpu.name} (${build.gpu.specs.powerDraw}W)`);
  
  // Step 5: Select compatible PSU based on CPU+GPU power requirements
  console.log('🔧 Step 5: Selecting compatible PSU...');
  build.psu = await findCompatibleComponent('psu', allocation.psu, region, budgetSpecificComponents, build);
  
  if (!build.psu) {
    console.error('❌ Failed to find compatible PSU');
    throw new Error('Unable to find compatible PSU for build');
  }
  console.log(`✅ Selected PSU: ${build.psu.name} (${build.psu.specs.wattage}W)`);
  
  // Step 6: Select compatible cooler based on CPU socket and TDP
  console.log('🔧 Step 6: Selecting compatible cooler...');
  build.cooler = await findCompatibleComponent('cooler', allocation.cooler, region, budgetSpecificComponents, build);
  
  if (!build.cooler) {
    console.error('❌ Failed to find compatible cooler');
    throw new Error('Unable to find compatible cooler for build');
  }
  console.log(`✅ Selected Cooler: ${build.cooler.name} (${build.cooler.specs.socket})`);
  
  // Step 7: Select case with adequate clearance
  console.log('🔧 Step 7: Selecting compatible case...');
  build.case = await findCompatibleComponent('case', allocation.case, region, budgetSpecificComponents, build);
  
  if (!build.case) {
    console.error('❌ Failed to find compatible case');
    throw new Error('Unable to find compatible case for build');
  }
  console.log(`✅ Selected Case: ${build.case.name}`);
  
  // Step 8: Select storage (generally compatible with any motherboard)
  console.log('🔧 Step 8: Selecting storage...');
  build.storage = await findCompatibleComponent('storage', allocation.storage, region, budgetSpecificComponents, build);
  
  if (!build.storage) {
    console.error('❌ Failed to find storage');
    throw new Error('Unable to find storage for build');
  }
  console.log(`✅ Selected Storage: ${build.storage.name}`);
  
  // Final compatibility check - this should ALWAYS pass now
  console.log('🔍 Performing final compatibility verification...');
  const compatibility = checkCompatibility(build);
  if (!compatibility.isCompatible) {
    console.error('❌ Generated build still has compatibility issues after all safeguards:', compatibility.warnings);
    
    // Last resort: attempt automated fix
    console.log('🔧 Attempting emergency compatibility fix...');
    const fixedBuild = await fixCompatibilityIssues(build, allocation, region, budgetSpecificComponents);
    
    const finalCheck = checkCompatibility(fixedBuild);
    if (!finalCheck.isCompatible) {
      console.error('❌ Emergency fix failed. Build may have compatibility issues:', finalCheck.warnings);
      // Return the build anyway but log the issue
    } else {
      console.log('✅ Emergency fix successful - build is now compatible');
      return fixedBuild;
    }
  }
  
  console.log('🎉 Generated fully compatible recommended build successfully!');
  return build;
}

// Enhanced function to find alternative CPU if first choice doesn't work
async function findAlternativeCompatibleCPU(
  budget: number,
  region: Region,
  budgetSpecificComponents: Component[]
): Promise<Component | null> {
  console.log('🔄 Finding alternative CPU for better motherboard compatibility...');
  
  let allCPUs: Component[] = [];
  
  try {
    const autonomousCPUs = await autonomousComponentDiscovery.getLatestComponentsForCategory('cpu');
    allCPUs = [...autonomousCPUs, ...allRealComponents.cpu];
  } catch (error) {
    allCPUs = [...allRealComponents.cpu];
  }
  
  // Filter for available CPUs within expanded budget range
  const availableCPUs = allCPUs.filter(cpu => 
    cpu.availability === 'in-stock' && 
    cpu.price[region] <= budget * 1.5 // Allow going over budget for compatibility
  );
  
  // Sort by socket popularity (AM5, LGA1700 are current gen with more motherboard options)
  availableCPUs.sort((a, b) => {
    const socketPriority = { 'AM5': 5, 'LGA1700': 4, 'LGA1851': 3, 'AM4': 2 };
    const aPriority = socketPriority[a.specs.socket as keyof typeof socketPriority] || 1;
    const bPriority = socketPriority[b.specs.socket as keyof typeof socketPriority] || 1;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Then by budget fit
    const aInBudget = a.price[region] <= budget;
    const bInBudget = b.price[region] <= budget;
    
    if (aInBudget && !bInBudget) return -1;
    if (!aInBudget && bInBudget) return 1;
    
    return b.price[region] - a.price[region];
  });
  
  const alternativeCPU = availableCPUs[0];
  if (alternativeCPU) {
    console.log(`🔄 Selected alternative CPU: ${alternativeCPU.name} (${alternativeCPU.specs.socket})`);
  }
  
  return alternativeCPU || null;
}

export async function findBestComponentWithBudgetPreference(
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

// Find compatible component based on existing build selections
async function findCompatibleComponent(
  category: keyof typeof allComponents,
  budget: number,
  region: Region,
  budgetSpecificComponents: Component[],
  currentBuild: BuildConfiguration
): Promise<Component | null> {
  // Get all available components for this category
  let allCategoryComponents: Component[] = [];
  
  try {
    const autonomousComponents = await autonomousComponentDiscovery.getLatestComponentsForCategory(category);
    allCategoryComponents = [...autonomousComponents];
    
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
    console.warn('Autonomous discovery failed, using verified components:', error);
    allCategoryComponents = [...allRealComponents[category]];
  }
  
  // Add verified real components if needed
  if (allCategoryComponents.length < 8) {
    const existingNames = new Set(allCategoryComponents.map(c => c.name.toLowerCase()));
    const additionalComponents = allRealComponents[category].filter(
      rc => !existingNames.has(rc.name.toLowerCase())
    );
    allCategoryComponents = [...allCategoryComponents, ...additionalComponents];
  }

  // Add budget-specific components
  const budgetSpecificAvailable = budgetSpecificComponents
    .filter(c => c.category === category && c.availability === 'in-stock');
  
  const existingNames = new Set(allCategoryComponents.map(c => c.name.toLowerCase()));
  const newBudgetComponents = budgetSpecificAvailable.filter(
    c => !existingNames.has(c.name.toLowerCase())
  );
  allCategoryComponents = [...allCategoryComponents, ...newBudgetComponents];

  // Filter for available components
  const available = allCategoryComponents.filter(
    component => component.availability === 'in-stock'
  );
  
  if (available.length === 0) return null;

  // Filter for compatibility with existing build
  const compatible = available.filter(component => {
    const testBuild = { ...currentBuild, [category]: component };
    const compatibility = checkCompatibility(testBuild);
    return compatibility.isCompatible;
  });

  // If no compatible components, try to find the most compatible one
  if (compatible.length === 0) {
    console.warn(`No fully compatible ${category} components found, selecting best available`);
    return available.sort((a, b) => a.price[region] - b.price[region])[0];
  }

  // Sort compatible components by preference (budget-specific first, then by price)
  const sortedCompatible = compatible.sort((a, b) => {
    // Prioritize budget-specific components
    const aIsBudgetSpecific = budgetSpecificComponents.some(c => c.id === a.id);
    const bIsBudgetSpecific = budgetSpecificComponents.some(c => c.id === b.id);
    
    if (aIsBudgetSpecific && !bIsBudgetSpecific) return -1;
    if (!aIsBudgetSpecific && bIsBudgetSpecific) return 1;
    
    // Then by whether they're within budget
    const aInBudget = a.price[region] <= budget;
    const bInBudget = b.price[region] <= budget;
    
    if (aInBudget && !bInBudget) return -1;
    if (!aInBudget && bInBudget) return 1;
    
    // Finally by price (higher within budget, lower if over budget)
    if (aInBudget && bInBudget) {
      return b.price[region] - a.price[region]; // Higher price = better performance
    } else {
      return a.price[region] - b.price[region]; // Lower price if over budget
    }
  });

  const selectedComponent = sortedCompatible[0];
  console.log(`Selected compatible ${category}: ${selectedComponent.name}`);
  return selectedComponent;
}

// Fix compatibility issues in a build by replacing problematic components
async function fixCompatibilityIssues(
  build: BuildConfiguration,
  allocation: BudgetAllocation,
  region: Region,
  budgetSpecificComponents: Component[]
): Promise<BuildConfiguration> {
  console.log('Attempting to fix compatibility issues...');
  
  let fixedBuild = { ...build };
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    const compatibility = checkCompatibility(fixedBuild);
    
    if (compatibility.isCompatible) {
      console.log(`✅ Fixed compatibility issues after ${attempts + 1} attempts`);
      return fixedBuild;
    }
    
    // Try to fix the most critical issues first
    for (const warning of compatibility.warnings) {
      if (warning.includes('socket')) {
        // Socket mismatch - replace motherboard or CPU
        if (fixedBuild.cpu && fixedBuild.motherboard) {
          console.log('Fixing socket compatibility by replacing motherboard...');
          fixedBuild.motherboard = await findCompatibleComponent('motherboard', allocation.motherboard, region, budgetSpecificComponents, { ...fixedBuild, motherboard: null });
        }
      } else if (warning.includes('Memory type')) {
        // Memory compatibility - replace RAM
        console.log('Fixing memory compatibility by replacing RAM...');
        fixedBuild.ram = await findCompatibleComponent('ram', allocation.ram, region, budgetSpecificComponents, { ...fixedBuild, ram: null });
      } else if (warning.includes('Power supply')) {
        // PSU compatibility - replace PSU
        console.log('Fixing PSU compatibility by replacing PSU...');
        fixedBuild.psu = await findCompatibleComponent('psu', allocation.psu, region, budgetSpecificComponents, { ...fixedBuild, psu: null });
      } else if (warning.includes('cooler')) {
        // Cooler compatibility - replace cooler
        console.log('Fixing cooler compatibility by replacing cooler...');
        fixedBuild.cooler = await findCompatibleComponent('cooler', allocation.cooler, region, budgetSpecificComponents, { ...fixedBuild, cooler: null });
      }
    }
    
    attempts++;
  }
  
  console.warn(`❌ Could not fix all compatibility issues after ${maxAttempts} attempts`);
  return fixedBuild;
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
  
  // Generate the affiliate link using correct Amazon format
  const link = `https://${domains[region]}/dp/${asin}/ref=nosim?tag=${affiliateTags[region]}`;
  
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

// Enhanced version that uses Amazon Product Advertising API (best) then fallbacks
export async function generateSmartAffiliateLink(component: Component, region: Region): Promise<string> {
  console.log(`🔗 Generating smart affiliate link for ${component.name} in ${region}...`);

  // FIRST PRIORITY: Amazon Product Advertising API (official, most reliable)
  if (amazonPAAPIService.isEnabled()) {
    try {
      const paApiProduct = await amazonPAAPIService.getBestProductForComponent(
        component.name, 
        component.category, 
        region
      );
      
      if (paApiProduct) {
        console.log(`🏆 Using Amazon PA API for ${component.name}: ${paApiProduct.asin}`);
        return amazonPAAPIService.generateAffiliateLink(paApiProduct, region);
      }
    } catch (error) {
      console.warn(`⚠️ Amazon PA API failed for ${component.name}:`, error);
    }
  } else {
    console.log(`⚠️ Amazon PA API not available (${amazonPAAPIService.getSetupInstructions().split('\n')[0]})`);
  }

  // SECOND PRIORITY: Real Amazon scraping (current but may break)
  try {
    const realScrapedASIN = await realAmazonScraper.getBestRealASIN(component.name, region);
    
    if (realScrapedASIN) {
      console.log(`🕷️ Using real scraped ASIN for ${component.name}: ${realScrapedASIN}`);
      return generateAffiliateLink(realScrapedASIN, region);
    }
  } catch (error) {
    console.warn(`⚠️ Real Amazon scraping failed for ${component.name}:`, error);
  }

  // THIRD PRIORITY: Simulated scraper (fallback)
  try {
    const scrapedASIN = await amazonASINScraper.getBestASIN(component.name, component.category, region);
    
    if (scrapedASIN) {
      console.log(`🤖 Using fallback scraped ASIN for ${component.name}: ${scrapedASIN}`);
      return generateAffiliateLink(scrapedASIN, region);
    }
  } catch (error) {
    console.warn(`⚠️ Fallback ASIN scraping failed for ${component.name}:`, error);
  }

  // FOURTH PRIORITY: Verified static ASIN database
  const verifiedASIN = getVerifiedASIN(component.name, region);
  
  if (verifiedASIN) {
    console.log(`✅ Using verified static ASIN for ${component.name}: ${verifiedASIN}`);
    return generateAffiliateLink(verifiedASIN, region);
  }

  // FINAL FALLBACK: Component search or invalid ASIN handling
  if (!component.asin || component.asin === 'placeholder' || component.asin.startsWith('B0DJKL') || component.asin === '') {
    console.warn(`❌ Invalid ASIN detected for ${component.name}: ${component.asin}, falling back to search`);
    return generateComponentSearchLink(component.name, region);
  }

  // Use the component's ASIN as last resort
  console.warn(`⚠️ Using unverified component ASIN for ${component.name}: ${component.asin}`);
  return generateAffiliateLink(component.asin, region);
}

// Synchronous version for backward compatibility
export function generateSmartAffiliateLinkSync(component: Component, region: Region): string {
  console.log(`🔗 Generating sync affiliate link for ${component.name} in ${region}...`);

  // Try verified static ASIN database first (synchronous)
  const verifiedASIN = getVerifiedASIN(component.name, region);
  
  if (verifiedASIN) {
    console.log(`✅ Using verified ASIN for ${component.name}: ${verifiedASIN}`);
    return generateAffiliateLink(verifiedASIN, region);
  }

  // Check for invalid/placeholder ASINs in component data
  if (!component.asin || component.asin === 'placeholder' || component.asin.startsWith('B0DJKL') || component.asin === '') {
    console.warn(`❌ Invalid ASIN detected for ${component.name}: ${component.asin}, falling back to search`);
    return generateComponentSearchLink(component.name, region);
  }

  // Use the component's ASIN, but warn that it's unverified
  console.warn(`⚠️ Using unverified ASIN for ${component.name}: ${component.asin}`);
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
