import { Component } from './components';

// REAL components database - only includes components that actually exist in retail
// Updated December 2024 with verified current market availability

export const realCpuData: Component[] = [
  // Intel 14th Gen (actually available)
  {
    id: 'cpu-real-1',
    name: 'Intel Core i9-14900K',
    brand: 'Intel',
    price: { US: 589, CA: 799, UK: 549, DE: 599, AU: 899 },
    specs: { socket: 'LGA1700', powerDraw: 125 },
    asin: 'B0CHX7TPCX',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '24-core (8P+16E), 32-thread processor with 6.0GHz boost clock'
  },
  {
    id: 'cpu-real-2',
    name: 'Intel Core i7-14700K',
    brand: 'Intel',
    price: { US: 409, CA: 549, UK: 379, DE: 419, AU: 629 },
    specs: { socket: 'LGA1700', powerDraw: 125 },
    asin: 'B0CHX5DPXR',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '20-core (8P+12E), 28-thread processor with 5.6GHz boost clock'
  },
  {
    id: 'cpu-real-3',
    name: 'Intel Core i5-14600K',
    brand: 'Intel',
    price: { US: 319, CA: 429, UK: 299, DE: 329, AU: 489 },
    specs: { socket: 'LGA1700', powerDraw: 125 },
    asin: 'B0CHX4VZ5Q',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '14-core (6P+8E), 20-thread processor with 5.3GHz boost clock'
  },
  {
    id: 'cpu-real-4',
    name: 'Intel Core i5-14400F',
    brand: 'Intel',
    price: { US: 199, CA: 269, UK: 179, DE: 209, AU: 309 },
    specs: { socket: 'LGA1700', powerDraw: 65 },
    asin: 'B0CHX3B77M',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '10-core (6P+4E), 16-thread processor, great value option'
  },
  
  // AMD Ryzen 7000 Series (actually available)
  {
    id: 'cpu-real-5',
    name: 'AMD Ryzen 9 7950X',
    brand: 'AMD',
    price: { US: 699, CA: 949, UK: 649, DE: 719, AU: 1079 },
    specs: { socket: 'AM5', powerDraw: 170 },
    asin: 'B0BBHHT8LY',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '16-core, 32-thread processor with 5.7GHz boost clock'
  },
  {
    id: 'cpu-real-6',
    name: 'AMD Ryzen 9 7900X',
    brand: 'AMD',
    price: { US: 549, CA: 749, UK: 509, DE: 569, AU: 849 },
    specs: { socket: 'AM5', powerDraw: 170 },
    asin: 'B0BBHT9YLS',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '12-core, 24-thread processor with 5.6GHz boost clock'
  },
  {
    id: 'cpu-real-7',
    name: 'AMD Ryzen 7 7800X3D',
    brand: 'AMD',
    price: { US: 449, CA: 609, UK: 419, DE: 469, AU: 699 },
    specs: { socket: 'AM5', powerDraw: 120 },
    asin: 'B0BTZB7F88',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '8-core, 16-thread gaming CPU with 3D V-Cache technology'
  },
  {
    id: 'cpu-real-8',
    name: 'AMD Ryzen 7 7700X',
    brand: 'AMD',
    price: { US: 349, CA: 479, UK: 329, DE: 369, AU: 549 },
    specs: { socket: 'AM5', powerDraw: 105 },
    asin: 'B0BBHGTQJN',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '8-core, 16-thread processor with 5.4GHz boost clock'
  },
  {
    id: 'cpu-real-9',
    name: 'AMD Ryzen 5 7600X',
    brand: 'AMD',
    price: { US: 299, CA: 409, UK: 279, DE: 309, AU: 459 },
    specs: { socket: 'AM5', powerDraw: 105 },
    asin: 'B0BBHG5TNM',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cpu',
    description: '6-core, 12-thread processor with 5.3GHz boost clock'
  }
];

export const realGpuData: Component[] = [
  // NVIDIA RTX 40 Series (actually available)
  {
    id: 'gpu-real-1',
    name: 'NVIDIA GeForce RTX 4090',
    brand: 'NVIDIA',
    price: { US: 1599, CA: 2199, UK: 1599, DE: 1799, AU: 2799 },
    specs: { powerDraw: 450 },
    asin: 'B0BG7Q8QQZ',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '24GB GDDR6X, flagship gaming GPU for 4K and beyond'
  },
  {
    id: 'gpu-real-2',
    name: 'NVIDIA GeForce RTX 4080 Super',
    brand: 'NVIDIA',
    price: { US: 999, CA: 1349, UK: 999, DE: 1099, AU: 1699 },
    specs: { powerDraw: 320 },
    asin: 'B0CS4KPPZ9',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '16GB GDDR6X, excellent 4K gaming performance'
  },
  {
    id: 'gpu-real-3',
    name: 'NVIDIA GeForce RTX 4070 Ti Super',
    brand: 'NVIDIA',
    price: { US: 799, CA: 1079, UK: 799, DE: 879, AU: 1349 },
    specs: { powerDraw: 285 },
    asin: 'B0CS4NH7MJ',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '16GB GDDR6X, great for 1440p and 4K gaming'
  },
  {
    id: 'gpu-real-4',
    name: 'NVIDIA GeForce RTX 4070 Super',
    brand: 'NVIDIA',
    price: { US: 599, CA: 819, UK: 579, DE: 649, AU: 999 },
    specs: { powerDraw: 220 },
    asin: 'B0CQSKWFNQ',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '12GB GDDR6X, perfect for 1440p gaming'
  },
  {
    id: 'gpu-real-5',
    name: 'NVIDIA GeForce RTX 4070',
    brand: 'NVIDIA',
    price: { US: 549, CA: 749, UK: 529, DE: 589, AU: 899 },
    specs: { powerDraw: 200 },
    asin: 'B0BTS3JLVL',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '12GB GDDR6X, solid 1440p gaming performance'
  },
  {
    id: 'gpu-real-6',
    name: 'NVIDIA GeForce RTX 4060 Ti',
    brand: 'NVIDIA',
    price: { US: 399, CA: 549, UK: 389, DE: 429, AU: 659 },
    specs: { powerDraw: 165 },
    asin: 'B0BX7D31BP',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '16GB GDDR6, great for 1440p gaming'
  },
  {
    id: 'gpu-real-7',
    name: 'NVIDIA GeForce RTX 4060',
    brand: 'NVIDIA',
    price: { US: 299, CA: 409, UK: 289, DE: 319, AU: 489 },
    specs: { powerDraw: 115 },
    asin: 'B0BYM8KJ6N',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '8GB GDDR6, efficient 1080p and 1440p gaming'
  },
  
  // AMD RX 7000 Series (actually available)
  {
    id: 'gpu-real-8',
    name: 'AMD Radeon RX 7900 XTX',
    brand: 'AMD',
    price: { US: 899, CA: 1219, UK: 849, DE: 949, AU: 1449 },
    specs: { powerDraw: 355 },
    asin: 'B0BN97GGQZ',
    availability: 'in-stock',
    trend: 'down',
    category: 'gpu',
    description: '24GB GDDR6, flagship AMD GPU for 4K gaming'
  },
  {
    id: 'gpu-real-9',
    name: 'AMD Radeon RX 7900 XT',
    brand: 'AMD',
    price: { US: 749, CA: 1019, UK: 699, DE: 789, AU: 1199 },
    specs: { powerDraw: 315 },
    asin: 'B0BN9P5TQL',
    availability: 'in-stock',
    trend: 'down',
    category: 'gpu',
    description: '20GB GDDR6, high-end gaming with excellent value'
  },
  {
    id: 'gpu-real-10',
    name: 'AMD Radeon RX 7800 XT',
    brand: 'AMD',
    price: { US: 499, CA: 679, UK: 469, DE: 519, AU: 789 },
    specs: { powerDraw: 263 },
    asin: 'B0CCZY6L28',
    availability: 'in-stock',
    trend: 'down',
    category: 'gpu',
    description: '16GB GDDR6, excellent 1440p gaming performance'
  },
  {
    id: 'gpu-real-11',
    name: 'AMD Radeon RX 7700 XT',
    brand: 'AMD',
    price: { US: 449, CA: 609, UK: 419, DE: 469, AU: 699 },
    specs: { powerDraw: 245 },
    asin: 'B0CCZY9LDT',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '12GB GDDR6, great 1440p gaming value'
  },
  {
    id: 'gpu-real-12',
    name: 'AMD Radeon RX 7600',
    brand: 'AMD',
    price: { US: 269, CA: 369, UK: 249, DE: 279, AU: 419 },
    specs: { powerDraw: 165 },
    asin: 'B0C3QLQFJ6',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '8GB GDDR6, solid 1080p gaming performance'
  },
  
  // Intel Arc (actually available)
  {
    id: 'gpu-real-13',
    name: 'Intel Arc A770',
    brand: 'Intel',
    price: { US: 329, CA: 449, UK: 309, DE: 349, AU: 529 },
    specs: { powerDraw: 225 },
    asin: 'B0B7K5P1FB',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '16GB GDDR6, competitive 1440p gaming with great value'
  },
  {
    id: 'gpu-real-14',
    name: 'Intel Arc A750',
    brand: 'Intel',
    price: { US: 249, CA: 339, UK: 229, DE: 259, AU: 389 },
    specs: { powerDraw: 225 },
    asin: 'B0B7K4MNP6',
    availability: 'in-stock',
    trend: 'stable',
    category: 'gpu',
    description: '8GB GDDR6, good 1080p and entry 1440p gaming'
  }
];

export const realMotherboardData: Component[] = [
  // Intel Z790 Chipset (LGA1700) - actually available
  {
    id: 'mb-real-1',
    name: 'ASUS ROG STRIX Z790-E GAMING',
    brand: 'ASUS',
    price: { US: 449, CA: 609, UK: 419, DE: 469, AU: 699 },
    specs: { socket: 'LGA1700', memoryType: 'DDR5' },
    asin: 'B0BG69T7Z4',
    availability: 'in-stock',
    trend: 'stable',
    category: 'motherboard',
    description: 'Z790 chipset, WiFi 6E, PCIe 5.0, DDR5-7600+ support'
  },
  {
    id: 'mb-real-2',
    name: 'MSI MAG Z790 TOMAHAWK',
    brand: 'MSI',
    price: { US: 279, CA: 379, UK: 259, DE: 289, AU: 429 },
    specs: { socket: 'LGA1700', memoryType: 'DDR5' },
    asin: 'B0BG6PV19Q',
    availability: 'in-stock',
    trend: 'stable',
    category: 'motherboard',
    description: 'Z790 chipset, excellent value, DDR5 support'
  },
  
  // AMD X670E Chipset (AM5) - actually available
  {
    id: 'mb-real-3',
    name: 'ASUS ROG CROSSHAIR X670E HERO',
    brand: 'ASUS',
    price: { US: 629, CA: 849, UK: 589, DE: 649, AU: 979 },
    specs: { socket: 'AM5', memoryType: 'DDR5' },
    asin: 'B0BDTS4QC7',
    availability: 'in-stock',
    trend: 'stable',
    category: 'motherboard',
    description: 'X670E chipset, premium features, WiFi 6E'
  },
  {
    id: 'mb-real-4',
    name: 'MSI MAG X670E TOMAHAWK',
    brand: 'MSI',
    price: { US: 269, CA: 369, UK: 249, DE: 279, AU: 419 },
    specs: { socket: 'AM5', memoryType: 'DDR5' },
    asin: 'B0BDTSD7Q9',
    availability: 'in-stock',
    trend: 'stable',
    category: 'motherboard',
    description: 'X670E chipset, great value for Ryzen 7000 series'
  }
];

export const realRamData: Component[] = [
  // DDR5 Kits (actually available)
  {
    id: 'ram-real-1',
    name: 'G.SKILL Trident Z5 RGB 32GB DDR5-6000',
    brand: 'G.SKILL',
    price: { US: 179, CA: 249, UK: 169, DE: 189, AU: 279 },
    specs: { capacity: '32GB', memoryType: 'DDR5' },
    asin: 'B09VP85JJL',
    availability: 'in-stock',
    trend: 'stable',
    category: 'ram',
    description: '32GB (2x16GB) DDR5-6000 CL30, optimized for Intel and AMD'
  },
  {
    id: 'ram-real-2',
    name: 'Corsair Dominator Platinum RGB 32GB DDR5-5600',
    brand: 'Corsair',
    price: { US: 199, CA: 279, UK: 189, DE: 209, AU: 309 },
    specs: { capacity: '32GB', memoryType: 'DDR5' },
    asin: 'B09NVJZ7Y9',
    availability: 'in-stock',
    trend: 'stable',
    category: 'ram',
    description: '32GB (2x16GB) DDR5-5600 CL36, premium performance'
  },
  {
    id: 'ram-real-3',
    name: 'Kingston Fury Beast 32GB DDR5-5200',
    brand: 'Kingston',
    price: { US: 119, CA: 169, UK: 109, DE: 129, AU: 189 },
    specs: { capacity: '32GB', memoryType: 'DDR5' },
    asin: 'B097HZZC1R',
    availability: 'in-stock',
    trend: 'down',
    category: 'ram',
    description: '32GB (2x16GB) DDR5-5200 CL40, excellent value'
  }
];

export const realStorageData: Component[] = [
  // Current NVMe SSDs (actually available)
  {
    id: 'storage-real-1',
    name: 'Samsung 980 PRO 2TB',
    brand: 'Samsung',
    price: { US: 149, CA: 209, UK: 139, DE: 159, AU: 229 },
    specs: { capacity: '2TB', interface: 'NVMe PCIe 4.0' },
    asin: 'B08RK2SR23',
    availability: 'in-stock',
    trend: 'down',
    category: 'storage',
    description: '2TB NVMe PCIe 4.0, 7,000 MB/s read, reliable performance'
  },
  {
    id: 'storage-real-2',
    name: 'WD Black SN850X 2TB',
    brand: 'Western Digital',
    price: { US: 179, CA: 249, UK: 169, DE: 189, AU: 279 },
    specs: { capacity: '2TB', interface: 'NVMe PCIe 4.0' },
    asin: 'B0B7CQPP5T',
    availability: 'in-stock',
    trend: 'stable',
    category: 'storage',
    description: '2TB NVMe PCIe 4.0, 7,300 MB/s read, gaming optimized'
  },
  {
    id: 'storage-real-3',
    name: 'Crucial P3 Plus 2TB',
    brand: 'Crucial',
    price: { US: 99, CA: 139, UK: 89, DE: 109, AU: 159 },
    specs: { capacity: '2TB', interface: 'NVMe PCIe 4.0' },
    asin: 'B0B25LZGGW',
    availability: 'in-stock',
    trend: 'down',
    category: 'storage',
    description: '2TB NVMe PCIe 4.0, 5,000 MB/s read, great value'
  }
];

export const realPsuData: Component[] = [
  // Current PSUs (actually available)
  {
    id: 'psu-real-1',
    name: 'Corsair RM850x 850W 80+ Gold',
    brand: 'Corsair',
    price: { US: 149, CA: 209, UK: 139, DE: 159, AU: 229 },
    specs: { wattage: 850, efficiency: '80+ Gold' },
    asin: 'B079H6111J',
    availability: 'in-stock',
    trend: 'stable',
    category: 'psu',
    description: '850W 80+ Gold, fully modular, 10-year warranty'
  },
  {
    id: 'psu-real-2',
    name: 'Seasonic Focus GX-750 750W',
    brand: 'Seasonic',
    price: { US: 109, CA: 149, UK: 99, DE: 119, AU: 169 },
    specs: { wattage: 750, efficiency: '80+ Gold' },
    asin: 'B077J7QZPX',
    availability: 'in-stock',
    trend: 'stable',
    category: 'psu',
    description: '750W 80+ Gold, fully modular, 10-year warranty'
  },
  {
    id: 'psu-real-3',
    name: 'EVGA SuperNOVA 650 G6 650W',
    brand: 'EVGA',
    price: { US: 89, CA: 129, UK: 79, DE: 95, AU: 139 },
    specs: { wattage: 650, efficiency: '80+ Gold' },
    asin: 'B08XR37SJ8',
    availability: 'in-stock',
    trend: 'stable',
    category: 'psu',
    description: '650W 80+ Gold, fully modular, compact design'
  }
];

export const realCoolerData: Component[] = [
  // Current CPU coolers (actually available)
  {
    id: 'cooler-real-1',
    name: 'Noctua NH-D15',
    brand: 'Noctua',
    price: { US: 109, CA: 149, UK: 99, DE: 119, AU: 169 },
    specs: { 
      coolerType: 'Air', 
      compatibility: ['LGA1700', 'AM5', 'AM4'],
      dimensions: { height: 165, width: 150, length: 161 }
    },
    asin: 'B00L7UZMAK',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cooler',
    description: 'Dual-tower air cooler, exceptional performance, ultra-quiet'
  },
  {
    id: 'cooler-real-2',
    name: 'Arctic Liquid Freezer II 280',
    brand: 'Arctic',
    price: { US: 79, CA: 109, UK: 69, DE: 85, AU: 129 },
    specs: { 
      coolerType: 'Liquid', 
      compatibility: ['LGA1700', 'AM5', 'AM4']
    },
    asin: 'B07WNJFMC9',
    availability: 'in-stock',
    trend: 'stable',
    category: 'cooler',
    description: '280mm AIO, excellent value, VRM fan included'
  },
  {
    id: 'cooler-real-3',
    name: 'Thermalright Peerless Assassin 120 SE',
    brand: 'Thermalright',
    price: { US: 35, CA: 49, UK: 32, DE: 39, AU: 55 },
    specs: { 
      coolerType: 'Air', 
      compatibility: ['LGA1700', 'AM5', 'AM4'],
      dimensions: { height: 155, width: 127, length: 158 }
    },
    asin: 'B0982VQTQT',
    availability: 'in-stock',
    trend: 'up',
    category: 'cooler',
    description: 'Dual-tower air cooler, incredible value, great performance'
  }
];

export const realCaseData: Component[] = [
  // Current cases (actually available)
  {
    id: 'case-real-1',
    name: 'Fractal Design Define 7',
    brand: 'Fractal Design',
    price: { US: 179, CA: 249, UK: 169, DE: 189, AU: 279 },
    specs: { 
      clearance: { gpu: 491, cooler: 185 }
    },
    asin: 'B08C7BGV3D',
    availability: 'in-stock',
    trend: 'stable',
    category: 'case',
    description: 'Full-tower, excellent build quality, sound dampening'
  },
  {
    id: 'case-real-2',
    name: 'Lian Li Lancool 215',
    brand: 'Lian Li',
    price: { US: 89, CA: 129, UK: 79, DE: 95, AU: 139 },
    specs: { 
      clearance: { gpu: 384, cooler: 176 }
    },
    asin: 'B093FQWB3W',
    availability: 'in-stock',
    trend: 'stable',
    category: 'case',
    description: 'Mid-tower, excellent airflow, great value'
  },
  {
    id: 'case-real-3',
    name: 'Cooler Master MasterBox TD500 Mesh',
    brand: 'Cooler Master',
    price: { US: 99, CA: 139, UK: 89, DE: 109, AU: 159 },
    specs: { 
      clearance: { gpu: 410, cooler: 165 }
    },
    asin: 'B083BVQZPD',
    availability: 'in-stock',
    trend: 'stable',
    category: 'case',
    description: 'Mid-tower, mesh front panel, RGB lighting'
  }
];

export const allRealComponents = {
  cpu: realCpuData,
  gpu: realGpuData,
  motherboard: realMotherboardData,
  ram: realRamData,
  storage: realStorageData,
  psu: realPsuData,
  cooler: realCoolerData,
  case: realCaseData
};