import { Component, allComponents } from '../data/components';

export type Region = 'US' | 'CA' | 'UK' | 'DE' | 'AU';

// Re-export Component and allComponents so they can be imported from this module
export { Component, allComponents };

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

export function findBestComponent(
  category: keyof typeof allComponents,
  budget: number,
  region: Region,
  requirements?: any
): Component | null {
  const components = allComponents[category];
  
  // Filter by budget and availability
  const affordable = components.filter(
    component => component.price[region] <= budget && component.availability === 'in-stock'
  );
  
  if (affordable.length === 0) return null;
  
  // Sort by value (performance per dollar - simplified as price descending for now)
  affordable.sort((a, b) => b.price[region] - a.price[region]);
  
  return affordable[0];
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

export function generateRecommendedBuild(
  budget: number,
  region: Region
): BuildConfiguration {
  const allocation = calculateBudgetAllocation(budget);
  
  const build: BuildConfiguration = {
    cpu: findBestComponent('cpu', allocation.cpu, region),
    gpu: findBestComponent('gpu', allocation.gpu, region),
    motherboard: findBestComponent('motherboard', allocation.motherboard, region),
    ram: findBestComponent('ram', allocation.ram, region),
    storage: findBestComponent('storage', allocation.storage, region),
    cooler: findBestComponent('cooler', allocation.cooler, region),
    psu: findBestComponent('psu', allocation.psu, region),
    case: findBestComponent('case', allocation.case, region)
  };
  
  return build;
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
  const affiliateTags = {
    US: 'pcbuilder-20',
    CA: 'pcbuilder-20',
    UK: 'pcbuilder-21',
    DE: 'pcbuilder-21',
    AU: 'pcbuilder-20'
  };
  
  const domains = {
    US: 'amazon.com',
    CA: 'amazon.ca',
    UK: 'amazon.co.uk',
    DE: 'amazon.de',
    AU: 'amazon.com.au'
  };
  
  return `https://${domains[region]}/dp/${asin}?tag=${affiliateTags[region]}`;
}
