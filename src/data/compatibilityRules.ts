// Real-world compatibility rules learned from r/buildapcforme and tech communities
// Updated 2025 with latest socket and chipset information

export interface SocketInfo {
  socket: string;
  supportedCPUs: string[];
  supportedChipsets: string[];
  memoryType: string[];
  maxMemorySpeed: number;
  generation: string;
  notes: string;
}

export interface CPUCompatibility {
  brand: string;
  series: string;
  socket: string;
  generation: string;
  supportedChipsets: string[];
  memoryType: string[];
  tdp: number;
  coolerRequirements: string[];
}

// Socket compatibility database - learned from Reddit buildapcforme recommendations
export const socketDatabase: SocketInfo[] = [
  // AMD Sockets
  {
    socket: 'AM4',
    supportedCPUs: ['Ryzen 1000', 'Ryzen 2000', 'Ryzen 3000', 'Ryzen 4000', 'Ryzen 5000'],
    supportedChipsets: ['A320', 'B350', 'B450', 'B550', 'X370', 'X470', 'X570'],
    memoryType: ['DDR4'],
    maxMemorySpeed: 3200,
    generation: 'Legacy',
    notes: 'Mature platform, great value for budget builds'
  },
  {
    socket: 'AM5',
    supportedCPUs: ['Ryzen 7000', 'Ryzen 8000', 'Ryzen 9000'],
    supportedChipsets: ['A620', 'B650', 'B650E', 'X670', 'X670E', 'X870', 'X870E'],
    memoryType: ['DDR5'],
    maxMemorySpeed: 6000,
    generation: 'Current',
    notes: 'Supported until 2027+, DDR5 only, PCIe 5.0 support'
  },
  
  // Intel Sockets
  {
    socket: 'LGA1700',
    supportedCPUs: ['Intel 12th Gen', 'Intel 13th Gen', 'Intel 14th Gen'],
    supportedChipsets: ['H610', 'B660', 'H670', 'Z690', 'B760', 'H770', 'Z790'],
    memoryType: ['DDR4', 'DDR5'],
    maxMemorySpeed: 5600,
    generation: 'Current',
    notes: 'Supports both DDR4 and DDR5, depending on motherboard'
  },
  {
    socket: 'LGA1851',
    supportedCPUs: ['Intel 15th Gen', 'Intel Core Ultra 200'],
    supportedChipsets: ['B860', 'H810', 'Z890'],
    memoryType: ['DDR5'],
    maxMemorySpeed: 6400,
    generation: 'Latest',
    notes: 'DDR5 only, PCIe 5.0, cooler compatible with LGA1700'
  }
];

// CPU-specific compatibility rules from Reddit recommendations
export const cpuCompatibilityRules: CPUCompatibility[] = [
  // AMD CPUs
  {
    brand: 'AMD',
    series: 'Ryzen 5000',
    socket: 'AM4',
    generation: '5000',
    supportedChipsets: ['B450', 'B550', 'X470', 'X570'],
    memoryType: ['DDR4'],
    tdp: 105,
    coolerRequirements: ['AM4']
  },
  {
    brand: 'AMD',
    series: 'Ryzen 7000',
    socket: 'AM5',
    generation: '7000',
    supportedChipsets: ['B650', 'B650E', 'X670', 'X670E'],
    memoryType: ['DDR5'],
    tdp: 170,
    coolerRequirements: ['AM5', 'AM4_with_bracket']
  },
  {
    brand: 'AMD',
    series: 'Ryzen 9000',
    socket: 'AM5',
    generation: '9000',
    supportedChipsets: ['B650', 'B650E', 'X670', 'X670E', 'X870', 'X870E'],
    memoryType: ['DDR5'],
    tdp: 170,
    coolerRequirements: ['AM5', 'AM4_with_bracket']
  },
  
  // Intel CPUs
  {
    brand: 'Intel',
    series: '12th Gen',
    socket: 'LGA1700',
    generation: '12',
    supportedChipsets: ['H610', 'B660', 'H670', 'Z690'],
    memoryType: ['DDR4', 'DDR5'],
    tdp: 125,
    coolerRequirements: ['LGA1700', 'LGA115x_with_bracket']
  },
  {
    brand: 'Intel',
    series: '13th Gen',
    socket: 'LGA1700',
    generation: '13',
    supportedChipsets: ['H610', 'B660', 'H670', 'Z690', 'B760', 'H770', 'Z790'],
    memoryType: ['DDR4', 'DDR5'],
    tdp: 125,
    coolerRequirements: ['LGA1700', 'LGA115x_with_bracket']
  },
  {
    brand: 'Intel',
    series: '14th Gen',
    socket: 'LGA1700',
    generation: '14',
    supportedChipsets: ['B760', 'H770', 'Z790'],
    memoryType: ['DDR4', 'DDR5'],
    tdp: 125,
    coolerRequirements: ['LGA1700', 'LGA115x_with_bracket']
  },
  {
    brand: 'Intel',
    series: '15th Gen',
    socket: 'LGA1851',
    generation: '15',
    supportedChipsets: ['B860', 'H810', 'Z890'],
    memoryType: ['DDR5'],
    tdp: 125,
    coolerRequirements: ['LGA1851', 'LGA1700_compatible']
  }
];

// Memory compatibility rules based on Reddit recommendations
export const memoryCompatibilityRules = {
  'AM4': {
    supportedTypes: ['DDR4'],
    recommendedSpeeds: [3200, 3600],
    maxSpeed: 3600,
    notes: 'DDR4-3200 is sweet spot for Ryzen, 3600 for high-end'
  },
  'AM5': {
    supportedTypes: ['DDR5'],
    recommendedSpeeds: [5600, 6000],
    maxSpeed: 6000,
    notes: 'DDR5-5600 is standard, 6000 for enthusiast builds'
  },
  'LGA1700': {
    supportedTypes: ['DDR4', 'DDR5'],
    recommendedSpeeds: [3200, 5600],
    maxSpeed: 5600,
    notes: 'Motherboard dependent - check chipset for DDR4/DDR5 support'
  },
  'LGA1851': {
    supportedTypes: ['DDR5'],
    recommendedSpeeds: [5600, 6400],
    maxSpeed: 6400,
    notes: 'DDR5 only, higher speeds supported than LGA1700'
  }
};

// Power supply requirements based on Reddit builds
export const powerRequirements = {
  'budget': {
    minWattage: 500,
    recommendedWattage: 600,
    efficiency: '80+ Bronze',
    notes: 'For basic gaming builds'
  },
  'midrange': {
    minWattage: 650,
    recommendedWattage: 750,
    efficiency: '80+ Gold',
    notes: 'For RTX 4060-4070 tier GPUs'
  },
  'highend': {
    minWattage: 850,
    recommendedWattage: 1000,
    efficiency: '80+ Gold',
    notes: 'For RTX 4080+ or high-end AMD GPUs'
  },
  'enthusiast': {
    minWattage: 1000,
    recommendedWattage: 1200,
    efficiency: '80+ Platinum',
    notes: 'For RTX 4090 or multi-GPU setups'
  }
};

// Cooler compatibility database
export const coolerCompatibility = {
  'AM4': ['AM4', 'AM3+', 'AM3', 'AM2+', 'AM2'],
  'AM5': ['AM5', 'AM4_with_bracket'],
  'LGA1700': ['LGA1700', 'LGA115x_with_bracket', 'LGA1200'],
  'LGA1851': ['LGA1851', 'LGA1700_compatible']
};

// GPU clearance recommendations from Reddit builds
export const gpuClearanceRules = {
  'Mini-ITX': {
    maxLength: 310,
    notes: 'Compact cases, check specific model compatibility'
  },
  'Micro-ATX': {
    maxLength: 350,
    notes: 'Most mid-range GPUs fit comfortably'
  },
  'ATX': {
    maxLength: 400,
    notes: 'Full-size cases accommodate any GPU'
  }
};

export function getSocketInfo(socket: string): SocketInfo | null {
  return socketDatabase.find(s => s.socket === socket) || null;
}

export function getCPUCompatibility(cpuName: string): CPUCompatibility | null {
  // Parse CPU name to determine series
  const lowerName = cpuName.toLowerCase();
  
  if (lowerName.includes('ryzen') && lowerName.includes('9000')) {
    return cpuCompatibilityRules.find(c => c.series === 'Ryzen 9000') || null;
  }
  if (lowerName.includes('ryzen') && lowerName.includes('7000')) {
    return cpuCompatibilityRules.find(c => c.series === 'Ryzen 7000') || null;
  }
  if (lowerName.includes('ryzen') && lowerName.includes('5000')) {
    return cpuCompatibilityRules.find(c => c.series === 'Ryzen 5000') || null;
  }
  if (lowerName.includes('intel') && (lowerName.includes('15th') || lowerName.includes('ultra 2'))) {
    return cpuCompatibilityRules.find(c => c.series === '15th Gen') || null;
  }
  if (lowerName.includes('intel') && lowerName.includes('14th')) {
    return cpuCompatibilityRules.find(c => c.series === '14th Gen') || null;
  }
  if (lowerName.includes('intel') && lowerName.includes('13th')) {
    return cpuCompatibilityRules.find(c => c.series === '13th Gen') || null;
  }
  if (lowerName.includes('intel') && lowerName.includes('12th')) {
    return cpuCompatibilityRules.find(c => c.series === '12th Gen') || null;
  }
  
  return null;
}

export function isMemoryCompatible(socket: string, memoryType: string): boolean {
  const memoryRules = memoryCompatibilityRules[socket as keyof typeof memoryCompatibilityRules];
  return memoryRules ? memoryRules.supportedTypes.includes(memoryType) : false;
}

export function isCoolerCompatible(socket: string, coolerSocket: string): boolean {
  const compatibleSockets = coolerCompatibility[socket as keyof typeof coolerCompatibility];
  return compatibleSockets ? compatibleSockets.includes(coolerSocket) : false;
}