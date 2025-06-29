
export interface ComponentSpecs {
  socket?: string;
  powerDraw?: number;
  dimensions?: { length: number; width: number; height: number };
  clearance?: { gpu: number; cooler: number };
  memoryType?: 'DDR4' | 'DDR5';
  capacity?: string;
  interface?: string;
  wattage?: number;
  efficiency?: string;
  coolerType?: 'Air' | 'Liquid';
  compatibility?: string[];
}

export interface Component {
  id: string;
  name: string;
  brand: string;
  price: {
    US: number;
    CA: number;
    UK: number;
    DE: number;
    AU: number;
  };
  specs: ComponentSpecs;
  asin: string;
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  trend: 'up' | 'down' | 'stable';
  category: string;
  description: string;
}

export const cpuData: Component[] = [
  {
    id: 'cpu-1',
    name: 'AMD Ryzen 5 7600X',
    brand: 'AMD',
    price: { US: 229, CA: 299, UK: 219, DE: 249, AU: 349 },
    specs: { socket: 'AM5', powerDraw: 105 },
    asin: 'B0BBJDS62N',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '6-core, 12-thread processor with 4.7GHz boost clock'
  },
  {
    id: 'cpu-2',
    name: 'Intel Core i5-14600K',
    brand: 'Intel',
    price: { US: 329, CA: 429, UK: 309, DE: 349, AU: 499 },
    specs: { socket: 'LGA1700', powerDraw: 125 },
    asin: 'B0CHG81SY3',
    availability: 'in-stock',
    trend: 'down',
    category: 'cpu',
    description: '14-core processor with P-cores and E-cores architecture'
  },
  {
    id: 'cpu-3',
    name: 'AMD Ryzen 7 7700X',
    brand: 'AMD',
    price: { US: 349, CA: 449, UK: 329, DE: 379, AU: 529 },
    specs: { socket: 'AM5', powerDraw: 105 },
    asin: 'B0BBHD5D8Y',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '8-core, 16-thread processor ideal for gaming and content creation'
  }
];

export const gpuData: Component[] = [
  {
    id: 'gpu-1',
    name: 'NVIDIA RTX 4060',
    brand: 'NVIDIA',
    price: { US: 299, CA: 399, UK: 289, DE: 329, AU: 459 },
    specs: { 
      powerDraw: 115, 
      dimensions: { length: 244, width: 112, height: 40 }
    },
    asin: 'B0C6ZGJXY5',
    availability: 'in-stock',
    trend: 'down',
    category: 'gpu',
    description: '8GB GDDR6 graphics card perfect for 1080p gaming'
  },
  {
    id: 'gpu-2',
    name: 'AMD RX 7600 XT',
    brand: 'AMD',
    price: { US: 329, CA: 429, UK: 309, DE: 359, AU: 499 },
    specs: { 
      powerDraw: 190, 
      dimensions: { length: 267, width: 120, height: 50 }
    },
    asin: 'B0CQR5H4M8',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '16GB GDDR6 graphics card for high-resolution gaming'
  },
  {
    id: 'gpu-3',
    name: 'NVIDIA RTX 4070 Super',
    brand: 'NVIDIA',
    price: { US: 599, CA: 779, UK: 569, DE: 639, AU: 899 },
    specs: { 
      powerDraw: 220, 
      dimensions: { length: 304, width: 137, height: 61 }
    },
    asin: 'B0CQS2CQ7G',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '12GB GDDR6X graphics card for 1440p gaming excellence'
  }
];

export const motherboardData: Component[] = [
  {
    id: 'mb-1',
    name: 'ASUS B650-A WiFi',
    brand: 'ASUS',
    price: { US: 179, CA: 229, UK: 169, DE: 199, AU: 279 },
    specs: { socket: 'AM5', memoryType: 'DDR5' },
    asin: 'B0BDTN8SNJ',
    availability: 'in-stock',
    trend: 'stable',
    category: 'motherboard',
    description: 'ATX motherboard with WiFi 6 and PCIe 5.0 support'
  },
  {
    id: 'mb-2',
    name: 'MSI Z790 Gaming Plus WiFi',
    brand: 'MSI',
    price: { US: 199, CA: 259, UK: 189, DE: 219, AU: 309 },
    specs: { socket: 'LGA1700', memoryType: 'DDR5' },
    asin: 'B0BDV7P4PH',
    availability: 'in-stock',
    trend: 'down',
    category: 'motherboard',
    description: 'ATX motherboard optimized for Intel 12th/13th/14th gen CPUs'
  }
];

export const ramData: Component[] = [
  {
    id: 'ram-1',
    name: 'Corsair Vengeance DDR5-5600 16GB',
    brand: 'Corsair',
    price: { US: 89, CA: 119, UK: 85, DE: 99, AU: 139 },
    specs: { memoryType: 'DDR5', capacity: '16GB' },
    asin: 'B0BPG485ZN',
    availability: 'in-stock',
    trend: 'down',
    category: 'ram',
    description: '2x8GB DDR5 memory kit with high-performance speeds'
  },
  {
    id: 'ram-2',
    name: 'G.Skill Trident Z5 DDR5-6000 32GB',
    brand: 'G.Skill',
    price: { US: 179, CA: 239, UK: 169, DE: 199, AU: 279 },
    specs: { memoryType: 'DDR5', capacity: '32GB' },
    asin: 'B0BBQT3VMF',
    availability: 'in-stock',
    trend: 'stable',
    category: 'ram',
    description: '2x16GB DDR5 memory kit for demanding applications'
  }
];

export const storageData: Component[] = [
  {
    id: 'ssd-1',
    name: 'Samsung 980 Pro 1TB',
    brand: 'Samsung',
    price: { US: 99, CA: 129, UK: 95, DE: 109, AU: 149 },
    specs: { interface: 'NVMe', capacity: '1TB' },
    asin: 'B08GLX7TNT',
    availability: 'in-stock',
    trend: 'down',
    category: 'storage',
    description: 'High-performance NVMe SSD with 7,000 MB/s read speeds'
  },
  {
    id: 'ssd-2',
    name: 'WD Black SN850X 2TB',
    brand: 'Western Digital',
    price: { US: 199, CA: 259, UK: 189, DE: 219, AU: 309 },
    specs: { interface: 'NVMe', capacity: '2TB' },
    asin: 'B0B7CQ2CHH',
    availability: 'in-stock',
    trend: 'stable',
    category: 'storage',
    description: 'Gaming-focused NVMe SSD with excellent sustained performance'
  }
];

export const coolerData: Component[] = [
  {
    id: 'cooler-1',
    name: 'Noctua NH-D15',
    brand: 'Noctua',
    price: { US: 109, CA: 139, UK: 99, DE: 119, AU: 169 },
    specs: { 
      coolerType: 'Air', 
      compatibility: ['AM5', 'LGA1700'],
      dimensions: { length: 150, width: 140, height: 165 }
    },
    asin: 'B00L7UZMAK',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cooler',
    description: 'Premium dual-tower air cooler with exceptional performance'
  },
  {
    id: 'cooler-2',
    name: 'Corsair H100i Elite Capellix',
    brand: 'Corsair',
    price: { US: 139, CA: 179, UK: 129, DE: 149, AU: 209 },
    specs: { 
      coolerType: 'Liquid', 
      compatibility: ['AM5', 'LGA1700'],
      dimensions: { length: 240, width: 120, height: 27 }
    },
    asin: 'B08GGRXB4Z',
    availability: 'in-stock',
    trend: 'up',
    category: 'cooler',
    description: '240mm AIO liquid cooler with RGB lighting'
  }
];

export const psuData: Component[] = [
  {
    id: 'psu-1',
    name: 'Corsair RM750x',
    brand: 'Corsair',
    price: { US: 139, CA: 179, UK: 129, DE: 149, AU: 209 },
    specs: { wattage: 750, efficiency: '80+ Gold' },
    asin: 'B07JBQZPX9',
    availability: 'in-stock',
    trend: 'stable',
    category: 'psu',
    description: 'Fully modular 750W power supply with 80+ Gold efficiency'
  },
  {
    id: 'psu-2',
    name: 'EVGA SuperNOVA 850 P5',
    brand: 'EVGA',
    price: { US: 159, CA: 209, UK: 149, DE: 169, AU: 239 },
    specs: { wattage: 850, efficiency: '80+ Platinum' },
    asin: 'B08Y87V8BQ',
    availability: 'in-stock',
    trend: 'down',
    category: 'psu',
    description: 'High-efficiency 850W power supply for demanding systems'
  }
];

export const caseData: Component[] = [
  {
    id: 'case-1',
    name: 'Fractal Design Define 7',
    brand: 'Fractal Design',
    price: { US: 179, CA: 229, UK: 169, DE: 199, AU: 279 },
    specs: { 
      clearance: { gpu: 491, cooler: 185 },
      dimensions: { length: 547, width: 240, height: 475 }
    },
    asin: 'B0832M3KTV',
    availability: 'in-stock',
    trend: 'stable',
    category: 'case',
    description: 'Premium mid-tower case with excellent build quality'
  },
  {
    id: 'case-2',
    name: 'NZXT H7 Flow',
    brand: 'NZXT',
    price: { US: 139, CA: 179, UK: 129, DE: 149, AU: 209 },
    specs: { 
      clearance: { gpu: 435, cooler: 170 },
      dimensions: { length: 460, width: 230, height: 480 }
    },
    asin: 'B0BYRQH2TG',
    availability: 'in-stock',
    trend: 'up',
    category: 'case',
    description: 'High-airflow mid-tower case with RGB lighting'
  }
];

export const allComponents = {
  cpu: cpuData,
  gpu: gpuData,
  motherboard: motherboardData,
  ram: ramData,
  storage: storageData,
  cooler: coolerData,
  psu: psuData,
  case: caseData
};
