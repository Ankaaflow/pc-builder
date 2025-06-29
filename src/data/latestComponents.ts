import { Component } from './components';

// Latest components database (2024-2025) - Updated with current market components
// This database includes the latest RTX 50 series, AMD RX 8000, Intel 15th gen, etc.

export const latestCpuData: Component[] = [
  // Intel 15th Gen (Arrow Lake)
  {
    id: 'cpu-latest-1',
    name: 'Intel Core i9-15900K',
    brand: 'Intel',
    price: { US: 589, CA: 799, UK: 549, DE: 599, AU: 899 },
    specs: { socket: 'LGA1851', powerDraw: 125 },
    asin: 'B0DJKL123',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '24-core (8P+16E), 32-thread processor with 5.8GHz boost clock'
  },
  {
    id: 'cpu-latest-2',
    name: 'Intel Core i7-15700K',
    brand: 'Intel',
    price: { US: 419, CA: 569, UK: 389, DE: 429, AU: 639 },
    specs: { socket: 'LGA1851', powerDraw: 125 },
    asin: 'B0DJKL124',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '20-core (8P+12E), 28-thread processor with 5.6GHz boost clock'
  },
  {
    id: 'cpu-latest-3',
    name: 'Intel Core i5-15600K',
    brand: 'Intel',
    price: { US: 279, CA: 379, UK: 259, DE: 289, AU: 429 },
    specs: { socket: 'LGA1851', powerDraw: 125 },
    asin: 'B0DJKL125',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '14-core (6P+8E), 20-thread processor with 5.3GHz boost clock'
  },
  
  // AMD Ryzen 9000 Series (Zen 5)
  {
    id: 'cpu-latest-4',
    name: 'AMD Ryzen 9 9950X',
    brand: 'AMD',
    price: { US: 649, CA: 879, UK: 599, DE: 649, AU: 989 },
    specs: { socket: 'AM5', powerDraw: 170 },
    asin: 'B0DJKL126',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '16-core, 32-thread processor with 5.7GHz boost clock'
  },
  {
    id: 'cpu-latest-5',
    name: 'AMD Ryzen 9 9900X',
    brand: 'AMD',
    price: { US: 499, CA: 679, UK: 459, DE: 509, AU: 759 },
    specs: { socket: 'AM5', powerDraw: 120 },
    asin: 'B0DJKL127',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '12-core, 24-thread processor with 5.6GHz boost clock'
  },
  {
    id: 'cpu-latest-6',
    name: 'AMD Ryzen 7 9800X3D',
    brand: 'AMD',
    price: { US: 479, CA: 649, UK: 439, DE: 489, AU: 729 },
    specs: { socket: 'AM5', powerDraw: 120 },
    asin: 'B0DJKL128',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '8-core, 16-thread processor with 3D V-Cache and 5.2GHz boost'
  },
  {
    id: 'cpu-latest-7',
    name: 'AMD Ryzen 7 9700X',
    brand: 'AMD',
    price: { US: 359, CA: 489, UK: 329, DE: 369, AU: 549 },
    specs: { socket: 'AM5', powerDraw: 65 },
    asin: 'B0DJKL129',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '8-core, 16-thread processor with 5.5GHz boost clock'
  },
  {
    id: 'cpu-latest-8',
    name: 'AMD Ryzen 5 9600X',
    brand: 'AMD',
    price: { US: 279, CA: 379, UK: 259, DE: 289, AU: 429 },
    specs: { socket: 'AM5', powerDraw: 65 },
    asin: 'B0DJKL130',
    availability: 'in-stock',
    trend: 'up',
    category: 'cpu',
    description: '6-core, 12-thread processor with 5.4GHz boost clock'
  }
];

export const latestGpuData: Component[] = [
  // NVIDIA RTX 50 Series
  {
    id: 'gpu-latest-1',
    name: 'NVIDIA GeForce RTX 5090',
    brand: 'NVIDIA',
    price: { US: 1999, CA: 2699, UK: 1899, DE: 2099, AU: 3199 },
    specs: { powerDraw: 600 },
    asin: 'B0DJKL131',
    availability: 'limited',
    trend: 'up',
    category: 'gpu',
    description: '32GB GDDR7, 21,760 CUDA cores, ultimate 4K gaming performance'
  },
  {
    id: 'gpu-latest-2',
    name: 'NVIDIA GeForce RTX 5080',
    brand: 'NVIDIA',
    price: { US: 1199, CA: 1619, UK: 1099, DE: 1249, AU: 1899 },
    specs: { powerDraw: 400 },
    asin: 'B0DJKL132',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '16GB GDDR7, 10,752 CUDA cores, excellent 4K gaming'
  },
  {
    id: 'gpu-latest-3',
    name: 'NVIDIA GeForce RTX 5070 Ti',
    brand: 'NVIDIA',
    price: { US: 799, CA: 1079, UK: 749, DE: 829, AU: 1249 },
    specs: { powerDraw: 300 },
    asin: 'B0DJKL133',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '16GB GDDR7, 8,960 CUDA cores, great 1440p and 4K gaming'
  },
  {
    id: 'gpu-latest-4',
    name: 'NVIDIA GeForce RTX 5070',
    brand: 'NVIDIA',
    price: { US: 599, CA: 809, UK: 559, DE: 619, AU: 929 },
    specs: { powerDraw: 250 },
    asin: 'B0DJKL134',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '12GB GDDR7, 6,144 CUDA cores, perfect 1440p gaming'
  },
  
  // AMD RX 8000 Series (RDNA 4)
  {
    id: 'gpu-latest-5',
    name: 'AMD Radeon RX 8800 XT',
    brand: 'AMD',
    price: { US: 649, CA: 879, UK: 599, DE: 669, AU: 999 },
    specs: { powerDraw: 275 },
    asin: 'B0DJKL135',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '16GB GDDR6, 4,096 stream processors, excellent 1440p performance'
  },
  {
    id: 'gpu-latest-6',
    name: 'AMD Radeon RX 8700 XT',
    brand: 'AMD',
    price: { US: 449, CA: 609, UK: 419, DE: 469, AU: 699 },
    specs: { powerDraw: 225 },
    asin: 'B0DJKL136',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '12GB GDDR6, 3,584 stream processors, great 1440p gaming'
  },
  
  // Intel Arc Battlemage
  {
    id: 'gpu-latest-7',
    name: 'Intel Arc B580',
    brand: 'Intel',
    price: { US: 249, CA: 339, UK: 229, DE: 259, AU: 389 },
    specs: { powerDraw: 190 },
    asin: 'B0DJKL137',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '12GB GDDR6, excellent 1080p and 1440p gaming value'
  },
  {
    id: 'gpu-latest-8',
    name: 'Intel Arc B570',
    brand: 'Intel',
    price: { US: 199, CA: 269, UK: 179, DE: 209, AU: 309 },
    specs: { powerDraw: 150 },
    asin: 'B0DJKL138',
    availability: 'in-stock',
    trend: 'up',
    category: 'gpu',
    description: '10GB GDDR6, great budget 1080p gaming option'
  }
];

export const latestMotherboardData: Component[] = [
  // Intel Z890 Chipset (LGA1851)
  {
    id: 'mb-latest-1',
    name: 'ASUS ROG STRIX Z890-E GAMING',
    brand: 'ASUS',
    price: { US: 499, CA: 679, UK: 459, DE: 509, AU: 759 },
    specs: { socket: 'LGA1851', memoryType: 'DDR5' },
    asin: 'B0DJKL139',
    availability: 'in-stock',
    trend: 'up',
    category: 'motherboard',
    description: 'Z890 chipset, WiFi 7, PCIe 5.0, DDR5-8000+ support'
  },
  {
    id: 'mb-latest-2',
    name: 'MSI MAG Z890 TOMAHAWK',
    brand: 'MSI',
    price: { US: 329, CA: 449, UK: 309, DE: 339, AU: 509 },
    specs: { socket: 'LGA1851', memoryType: 'DDR5' },
    asin: 'B0DJKL140',
    availability: 'in-stock',
    trend: 'up',
    category: 'motherboard',
    description: 'Z890 chipset, excellent value, DDR5-7600+ support'
  },
  
  // AMD X870E Chipset (AM5)
  {
    id: 'mb-latest-3',
    name: 'ASUS ROG CROSSHAIR X870E HERO',
    brand: 'ASUS',
    price: { US: 699, CA: 949, UK: 649, DE: 719, AU: 1079 },
    specs: { socket: 'AM5', memoryType: 'DDR5' },
    asin: 'B0DJKL141',
    availability: 'in-stock',
    trend: 'up',
    category: 'motherboard',
    description: 'X870E chipset, WiFi 7, USB4, DDR5-8000+ support'
  },
  {
    id: 'mb-latest-4',
    name: 'MSI MAG X870 TOMAHAWK',
    brand: 'MSI',
    price: { US: 299, CA: 409, UK: 279, DE: 309, AU: 459 },
    specs: { socket: 'AM5', memoryType: 'DDR5' },
    asin: 'B0DJKL142',
    availability: 'in-stock',
    trend: 'up',
    category: 'motherboard',
    description: 'X870 chipset, great value for Ryzen 9000 series'
  }
];

export const latestRamData: Component[] = [
  // DDR5 High-Performance Kits
  {
    id: 'ram-latest-1',
    name: 'G.SKILL Trident Z5 RGB 32GB DDR5-7200',
    brand: 'G.SKILL',
    price: { US: 199, CA: 269, UK: 179, DE: 209, AU: 309 },
    specs: { capacity: '32GB', memoryType: 'DDR5' },
    asin: 'B0DJKL143',
    availability: 'in-stock',
    trend: 'stable',
    category: 'ram',
    description: '32GB (2x16GB) DDR5-7200 CL34, optimized for Intel and AMD'
  },
  {
    id: 'ram-latest-2',
    name: 'Corsair Dominator Platinum RGB 32GB DDR5-6400',
    brand: 'Corsair',
    price: { US: 229, CA: 309, UK: 209, DE: 239, AU: 359 },
    specs: { capacity: '32GB', memoryType: 'DDR5' },
    asin: 'B0DJKL144',
    availability: 'in-stock',
    trend: 'stable',
    category: 'ram',
    description: '32GB (2x16GB) DDR5-6400 CL32, premium performance'
  },
  {
    id: 'ram-latest-3',
    name: 'Kingston Fury Beast 32GB DDR5-5600',
    brand: 'Kingston',
    price: { US: 129, CA: 179, UK: 119, DE: 139, AU: 199 },
    specs: { capacity: '32GB', memoryType: 'DDR5' },
    asin: 'B0DJKL145',
    availability: 'in-stock',
    trend: 'stable',
    category: 'ram',
    description: '32GB (2x16GB) DDR5-5600 CL36, excellent value'
  }
];

export const latestStorageData: Component[] = [
  // Latest NVMe SSDs with PCIe 5.0
  {
    id: 'storage-latest-1',
    name: 'Samsung 990 EVO Plus 2TB',
    brand: 'Samsung',
    price: { US: 149, CA: 209, UK: 139, DE: 159, AU: 229 },
    specs: { capacity: '2TB', interface: 'NVMe PCIe 4.0' },
    asin: 'B0DJKL146',
    availability: 'in-stock',
    trend: 'down',
    category: 'storage',
    description: '2TB NVMe PCIe 4.0, 7,000 MB/s read, excellent value'
  },
  {
    id: 'storage-latest-2',
    name: 'WD Black SN850X 2TB',
    brand: 'Western Digital',
    price: { US: 179, CA: 249, UK: 169, DE: 189, AU: 279 },
    specs: { capacity: '2TB', interface: 'NVMe PCIe 4.0' },
    asin: 'B0DJKL147',
    availability: 'in-stock',
    trend: 'stable',
    category: 'storage',
    description: '2TB NVMe PCIe 4.0, 7,300 MB/s read, gaming optimized'
  },
  {
    id: 'storage-latest-3',
    name: 'Crucial T705 2TB PCIe 5.0',
    brand: 'Crucial',
    price: { US: 299, CA: 409, UK: 279, DE: 309, AU: 459 },
    specs: { capacity: '2TB', interface: 'NVMe PCIe 5.0' },
    asin: 'B0DJKL148',
    availability: 'in-stock',
    trend: 'up',
    category: 'storage',
    description: '2TB NVMe PCIe 5.0, 12,400 MB/s read, cutting-edge speed'
  }
];

export const latestPsuData: Component[] = [
  // 80+ Gold and Platinum PSUs for modern builds
  {
    id: 'psu-latest-1',
    name: 'Corsair RM1000e 1000W 80+ Gold',
    brand: 'Corsair',
    price: { US: 179, CA: 249, UK: 169, DE: 189, AU: 279 },
    specs: { wattage: 1000, efficiency: '80+ Gold' },
    asin: 'B0DJKL149',
    availability: 'in-stock',
    trend: 'stable',
    category: 'psu',
    description: '1000W 80+ Gold, fully modular, 10-year warranty'
  },
  {
    id: 'psu-latest-2',
    name: 'be quiet! Pure Power 12 M 850W',
    brand: 'be quiet!',
    price: { US: 129, CA: 179, UK: 119, DE: 139, AU: 199 },
    specs: { wattage: 850, efficiency: '80+ Gold' },
    asin: 'B0DJKL150',
    availability: 'in-stock',
    trend: 'stable',
    category: 'psu',
    description: '850W 80+ Gold, modular, whisper-quiet operation'
  },
  {
    id: 'psu-latest-3',
    name: 'Seasonic Focus GX-750 750W',
    brand: 'Seasonic',
    price: { US: 109, CA: 149, UK: 99, DE: 119, AU: 169 },
    specs: { wattage: 750, efficiency: '80+ Gold' },
    asin: 'B0DJKL151',
    availability: 'in-stock',
    trend: 'stable',
    category: 'psu',
    description: '750W 80+ Gold, fully modular, 10-year warranty'
  }
];

export const latestCoolerData: Component[] = [
  // Latest CPU coolers for modern processors
  {
    id: 'cooler-latest-1',
    name: 'Noctua NH-D15 G2',
    brand: 'Noctua',
    price: { US: 149, CA: 209, UK: 139, DE: 159, AU: 229 },
    specs: { 
      coolerType: 'Air', 
      compatibility: ['LGA1851', 'AM5', 'LGA1700', 'AM4'],
      dimensions: { height: 165, width: 150, length: 161 }
    },
    asin: 'B0DJKL152',
    availability: 'in-stock',
    trend: 'up',
    category: 'cooler',
    description: 'Dual-tower air cooler, exceptional performance, ultra-quiet'
  },
  {
    id: 'cooler-latest-2',
    name: 'Arctic Liquid Freezer III 280',
    brand: 'Arctic',
    price: { US: 89, CA: 129, UK: 79, DE: 95, AU: 139 },
    specs: { 
      coolerType: 'Liquid', 
      compatibility: ['LGA1851', 'AM5', 'LGA1700', 'AM4']
    },
    asin: 'B0DJKL153',
    availability: 'in-stock',
    trend: 'up',
    category: 'cooler',
    description: '280mm AIO, excellent value, VRM fan included'
  },
  {
    id: 'cooler-latest-3',
    name: 'Thermalright Peerless Assassin 120 SE',
    brand: 'Thermalright',
    price: { US: 35, CA: 49, UK: 32, DE: 39, AU: 55 },
    specs: { 
      coolerType: 'Air', 
      compatibility: ['LGA1851', 'AM5', 'LGA1700', 'AM4'],
      dimensions: { height: 155, width: 127, length: 158 }
    },
    asin: 'B0DJKL154',
    availability: 'in-stock',
    trend: 'up',
    category: 'cooler',
    description: 'Dual-tower air cooler, incredible value, great performance'
  }
];

export const latestCaseData: Component[] = [
  // Modern cases with excellent airflow and features
  {
    id: 'case-latest-1',
    name: 'Fractal Design North',
    brand: 'Fractal Design',
    price: { US: 129, CA: 179, UK: 119, DE: 139, AU: 199 },
    specs: { 
      clearance: { gpu: 413, cooler: 188 }
    },
    asin: 'B0DJKL155',
    availability: 'in-stock',
    trend: 'up',
    category: 'case',
    description: 'Mid-tower, wood/metal design, excellent airflow'
  },
  {
    id: 'case-latest-2',
    name: 'Lian Li O11 Vision',
    brand: 'Lian Li',
    price: { US: 199, CA: 269, UK: 179, DE: 209, AU: 309 },
    specs: { 
      clearance: { gpu: 435, cooler: 170 }
    },
    asin: 'B0DJKL156',
    availability: 'in-stock',
    trend: 'up',
    category: 'case',
    description: 'Mid-tower, tempered glass, premium build quality'
  },
  {
    id: 'case-latest-3',
    name: 'Cooler Master MasterBox NR400',
    brand: 'Cooler Master',
    price: { US: 69, CA: 95, UK: 59, DE: 75, AU: 109 },
    specs: { 
      clearance: { gpu: 330, cooler: 165 }
    },
    asin: 'B0DJKL157',
    availability: 'in-stock',
    trend: 'stable',
    category: 'case',
    description: 'mATX case, compact design, excellent value'
  }
];

export const allLatestComponents = {
  cpu: latestCpuData,
  gpu: latestGpuData,
  motherboard: latestMotherboardData,
  ram: latestRamData,
  storage: latestStorageData,
  psu: latestPsuData,
  cooler: latestCoolerData,
  case: latestCaseData
};