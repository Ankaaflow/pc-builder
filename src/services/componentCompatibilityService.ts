// Component Compatibility Service
// Deep compatibility checking based on real-world build data and technical specifications

import { Component } from '../utils/budgetAllocator';

export interface CompatibilityRule {
  type: 'socket' | 'memory' | 'power' | 'physical' | 'chipset' | 'bios';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityRule[];
  warnings: CompatibilityRule[];
  powerDraw: number;
  estimatedWattage: number;
}

class ComponentCompatibilityService {

  // Socket compatibility mapping based on current Intel/AMD platforms
  private socketCompatibility = {
    // Intel LGA1700 - 12th, 13th, 14th gen
    'LGA1700': {
      cpus: [
        // 12th Gen
        'Core i3-12100', 'Core i3-12300', 'Core i5-12400', 'Core i5-12500', 
        'Core i5-12600', 'Core i5-12600K', 'Core i7-12700', 'Core i7-12700K',
        'Core i9-12900', 'Core i9-12900K', 'Core i9-12900KS',
        // 13th Gen  
        'Core i3-13100', 'Core i5-13400', 'Core i5-13500', 'Core i5-13600',
        'Core i5-13600K', 'Core i7-13700', 'Core i7-13700K', 'Core i9-13900',
        'Core i9-13900K', 'Core i9-13900KS',
        // 14th Gen
        'Core i3-14100', 'Core i5-14400', 'Core i5-14500', 'Core i5-14600',
        'Core i5-14600K', 'Core i7-14700', 'Core i7-14700K', 'Core i9-14900',
        'Core i9-14900K', 'Core i9-14900KS'
      ],
      chipsets: ['H610', 'B660', 'H670', 'Z690', 'H770', 'B760', 'Z790'],
      memoryTypes: ['DDR4', 'DDR5'], // Depends on motherboard
      maxMemorySpeed: { DDR4: 3200, DDR5: 5600 },
      pcieLanes: 20
    },

    // AMD AM5 - Ryzen 7000/8000/9000 series
    'AM5': {
      cpus: [
        // Ryzen 7000 series
        'Ryzen 5 7600', 'Ryzen 5 7600X', 'Ryzen 7 7700', 'Ryzen 7 7700X',
        'Ryzen 7 7800X3D', 'Ryzen 9 7900', 'Ryzen 9 7900X', 'Ryzen 9 7950X',
        // Ryzen 8000 series
        'Ryzen 5 8600G', 'Ryzen 7 8700G',
        // Ryzen 9000 series
        'Ryzen 5 9600X', 'Ryzen 7 9700X', 'Ryzen 9 9900X', 'Ryzen 9 9950X'
      ],
      chipsets: ['A620', 'B650', 'B650E', 'X670', 'X670E', 'X870', 'X870E'],
      memoryTypes: ['DDR5'], // AM5 only supports DDR5
      maxMemorySpeed: { DDR5: 5600 },
      pcieLanes: 24
    },

    // AMD AM4 - Ryzen 1000-5000 series (legacy)
    'AM4': {
      cpus: [
        // Ryzen 5000 series (most relevant)
        'Ryzen 5 5600', 'Ryzen 5 5600X', 'Ryzen 7 5700X', 'Ryzen 7 5800X',
        'Ryzen 7 5800X3D', 'Ryzen 9 5900X', 'Ryzen 9 5950X',
        // Older generations still supported
        'Ryzen 5 3600', 'Ryzen 7 3700X', 'Ryzen 9 3900X'
      ],
      chipsets: ['A320', 'B350', 'B450', 'B550', 'X370', 'X470', 'X570'],
      memoryTypes: ['DDR4'],
      maxMemorySpeed: { DDR4: 3200 },
      pcieLanes: 20
    }
  };

  // Memory compatibility based on chipset capabilities
  private memoryCompatibility = {
    // Intel chipsets
    'Z790': { supports: ['DDR4', 'DDR5'], maxSpeed: { DDR4: 5600, DDR5: 7800 }, maxCapacity: 128 },
    'B760': { supports: ['DDR4', 'DDR5'], maxSpeed: { DDR4: 5000, DDR5: 6400 }, maxCapacity: 128 },
    'H770': { supports: ['DDR4', 'DDR5'], maxSpeed: { DDR4: 4800, DDR5: 5600 }, maxCapacity: 128 },
    'H610': { supports: ['DDR4', 'DDR5'], maxSpeed: { DDR4: 4800, DDR5: 4800 }, maxCapacity: 64 },

    // AMD chipsets  
    'X670E': { supports: ['DDR5'], maxSpeed: { DDR5: 6400 }, maxCapacity: 128 },
    'X670': { supports: ['DDR5'], maxSpeed: { DDR5: 5200 }, maxCapacity: 128 },
    'B650E': { supports: ['DDR5'], maxSpeed: { DDR5: 5200 }, maxCapacity: 128 },
    'B650': { supports: ['DDR5'], maxSpeed: { DDR5: 5200 }, maxCapacity: 128 },
    'A620': { supports: ['DDR5'], maxSpeed: { DDR5: 5200 }, maxCapacity: 64 },

    // AM4 chipsets
    'X570': { supports: ['DDR4'], maxSpeed: { DDR4: 4733 }, maxCapacity: 128 },
    'B550': { supports: ['DDR4'], maxSpeed: { DDR4: 4733 }, maxCapacity: 128 },
    'B450': { supports: ['DDR4'], maxSpeed: { DDR4: 3466 }, maxCapacity: 64 }
  };

  // Component power consumption database
  private powerConsumption = {
    cpu: {
      // Intel 
      'Core i9-14900K': 125, 'Core i9-13900K': 125, 'Core i7-14700K': 125,
      'Core i7-13700K': 125, 'Core i5-14600K': 125, 'Core i5-13600K': 125,
      'Core i5-13400': 65, 'Core i3-13100': 65,
      
      // AMD
      'Ryzen 9 7950X': 170, 'Ryzen 9 7900X': 170, 'Ryzen 7 7800X3D': 120,
      'Ryzen 7 7700X': 105, 'Ryzen 5 7600X': 105, 'Ryzen 5 7600': 65,
      'Ryzen 9 5950X': 105, 'Ryzen 9 5900X': 105, 'Ryzen 7 5800X3D': 105,
      'Ryzen 7 5700X': 65, 'Ryzen 5 5600X': 65
    },
    gpu: {
      // NVIDIA RTX 40 series
      'RTX 4090': 450, 'RTX 4080 Super': 320, 'RTX 4080': 320, 'RTX 4070 Ti Super': 285,
      'RTX 4070 Ti': 285, 'RTX 4070 Super': 220, 'RTX 4070': 200, 'RTX 4060 Ti': 165,
      'RTX 4060': 115,
      
      // AMD RX 7000 series
      'RX 7900 XTX': 355, 'RX 7900 XT': 315, 'RX 7800 XT': 263, 'RX 7700 XT': 245,
      'RX 7600': 165,
      
      // Legacy but still relevant
      'RTX 3080': 320, 'RTX 3070': 220, 'RTX 3060 Ti': 200, 'RTX 3060': 170
    },
    ram: {
      'DDR4_16GB': 6, 'DDR4_32GB': 12, 'DDR5_16GB': 8, 'DDR5_32GB': 16
    },
    storage: {
      'SSD_NVMe': 3, 'SSD_SATA': 2, 'HDD_7200': 8, 'HDD_5400': 6
    },
    motherboard: 50, // Average motherboard power draw
    fans: 15 // Case fans and CPU cooler
  };

  /**
   * Check complete build compatibility
   */
  checkBuildCompatibility(build: {
    cpu?: Component;
    motherboard?: Component;
    ram?: Component;
    gpu?: Component;
    psu?: Component;
    storage?: Component;
    case?: Component;
    cooler?: Component;
  }): CompatibilityResult {
    const issues: CompatibilityRule[] = [];
    const warnings: CompatibilityRule[] = [];
    let totalPowerDraw = 0;

    // Check CPU-Motherboard compatibility
    if (build.cpu && build.motherboard) {
      const cpuSocketCheck = this.checkCPUMotherboardSocket(build.cpu, build.motherboard);
      issues.push(...cpuSocketCheck.filter(rule => rule.severity === 'critical'));
      warnings.push(...cpuSocketCheck.filter(rule => rule.severity === 'warning'));
    }

    // Check RAM compatibility
    if (build.ram && build.motherboard) {
      const ramCheck = this.checkRAMCompatibility(build.ram, build.motherboard);
      issues.push(...ramCheck.filter(rule => rule.severity === 'critical'));
      warnings.push(...ramCheck.filter(rule => rule.severity === 'warning'));
    }

    // Calculate power requirements
    totalPowerDraw = this.calculateTotalPowerDraw(build);
    
    // Check PSU compatibility
    if (build.psu) {
      const psuCheck = this.checkPSUCompatibility(build.psu, totalPowerDraw);
      issues.push(...psuCheck.filter(rule => rule.severity === 'critical'));
      warnings.push(...psuCheck.filter(rule => rule.severity === 'warning'));
    }

    // Check GPU compatibility
    if (build.gpu && build.motherboard) {
      const gpuCheck = this.checkGPUCompatibility(build.gpu, build.motherboard);
      warnings.push(...gpuCheck.filter(rule => rule.severity === 'warning'));
    }

    // Check case compatibility
    if (build.case && build.gpu) {
      const caseCheck = this.checkCaseCompatibility(build.case, build.gpu);
      warnings.push(...caseCheck.filter(rule => rule.severity === 'warning'));
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings,
      powerDraw: totalPowerDraw,
      estimatedWattage: Math.ceil(totalPowerDraw * 1.2) // 20% headroom
    };
  }

  /**
   * Check CPU and motherboard socket compatibility
   */
  private checkCPUMotherboardSocket(cpu: Component, motherboard: Component): CompatibilityRule[] {
    const rules: CompatibilityRule[] = [];
    
    // Extract socket from CPU name and motherboard specs
    const cpuSocket = this.extractCPUSocket(cpu.name);
    const motherboardSocket = this.extractMotherboardSocket(motherboard.name, motherboard.specs);
    const motherboardChipset = this.extractChipset(motherboard.name, motherboard.specs);

    if (!cpuSocket || !motherboardSocket) {
      rules.push({
        type: 'socket',
        severity: 'warning',
        message: 'Could not determine socket compatibility',
        details: `CPU: ${cpu.name}, Motherboard: ${motherboard.name}`
      });
      return rules;
    }

    // Check socket match
    if (cpuSocket !== motherboardSocket) {
      rules.push({
        type: 'socket',
        severity: 'critical',
        message: `Socket mismatch: CPU requires ${cpuSocket}, motherboard has ${motherboardSocket}`,
        details: 'CPU and motherboard must have matching sockets'
      });
      return rules;
    }

    // Check if CPU is supported by the socket
    const socketInfo = this.socketCompatibility[cpuSocket as keyof typeof this.socketCompatibility];
    if (socketInfo) {
      const cpuSupported = socketInfo.cpus.some(supportedCpu => 
        cpu.name.includes(supportedCpu) || supportedCpu.includes(cpu.name.split(' ').slice(-2).join(' '))
      );

      if (!cpuSupported) {
        rules.push({
          type: 'socket',
          severity: 'warning',
          message: `CPU may not be supported by ${cpuSocket} socket`,
          details: 'BIOS update may be required for compatibility'
        });
      }

      // Check chipset compatibility for advanced features
      if (motherboardChipset && !socketInfo.chipsets.includes(motherboardChipset)) {
        rules.push({
          type: 'chipset',
          severity: 'warning',
          message: `Chipset ${motherboardChipset} may have limited CPU features`,
          details: 'Some CPU features may be disabled'
        });
      }
    }

    return rules;
  }

  /**
   * Check RAM compatibility with motherboard
   */
  private checkRAMCompatibility(ram: Component, motherboard: Component): CompatibilityRule[] {
    const rules: CompatibilityRule[] = [];
    
    const ramType = this.extractRAMType(ram.name, ram.specs);
    const ramSpeed = this.extractRAMSpeed(ram.name, ram.specs);
    const ramCapacity = this.extractRAMCapacity(ram.name, ram.specs);
    const motherboardChipset = this.extractChipset(motherboard.name, motherboard.specs);
    const motherboardSocket = this.extractMotherboardSocket(motherboard.name, motherboard.specs);

    if (!ramType || !motherboardChipset) {
      rules.push({
        type: 'memory',
        severity: 'warning',
        message: 'Could not determine RAM compatibility',
        details: `RAM: ${ram.name}, Motherboard: ${motherboard.name}`
      });
      return rules;
    }

    // Check DDR4/DDR5 compatibility
    const socketInfo = motherboardSocket ? this.socketCompatibility[motherboardSocket as keyof typeof this.socketCompatibility] : null;
    const chipsetInfo = this.memoryCompatibility[motherboardChipset as keyof typeof this.memoryCompatibility];

    if (chipsetInfo && !chipsetInfo.supports.includes(ramType)) {
      rules.push({
        type: 'memory',
        severity: 'critical',
        message: `Memory type mismatch: RAM is ${ramType}, motherboard supports ${chipsetInfo.supports.join('/')}`,
        details: 'RAM and motherboard must support the same memory type'
      });
      return rules;
    }

    // Check RAM speed support
    if (chipsetInfo && ramSpeed && chipsetInfo.maxSpeed[ramType as keyof typeof chipsetInfo.maxSpeed]) {
      const maxSpeed = chipsetInfo.maxSpeed[ramType as keyof typeof chipsetInfo.maxSpeed];
      if (ramSpeed > maxSpeed) {
        rules.push({
          type: 'memory',
          severity: 'warning',
          message: `RAM speed ${ramSpeed}MHz exceeds motherboard maximum ${maxSpeed}MHz`,
          details: 'RAM will run at motherboard maximum speed'
        });
      }
    }

    // Check capacity limits
    if (chipsetInfo && ramCapacity && ramCapacity > chipsetInfo.maxCapacity) {
      rules.push({
        type: 'memory',
        severity: 'critical',
        message: `RAM capacity ${ramCapacity}GB exceeds motherboard maximum ${chipsetInfo.maxCapacity}GB`,
        details: 'Motherboard cannot support this amount of RAM'
      });
    }

    return rules;
  }

  /**
   * Check PSU compatibility with total system power draw
   */
  private checkPSUCompatibility(psu: Component, totalPowerDraw: number): CompatibilityRule[] {
    const rules: CompatibilityRule[] = [];
    
    const psuWattage = this.extractPSUWattage(psu.name, psu.specs);
    
    if (!psuWattage) {
      rules.push({
        type: 'power',
        severity: 'warning',
        message: 'Could not determine PSU wattage',
        details: `PSU: ${psu.name}`
      });
      return rules;
    }

    const recommendedWattage = Math.ceil(totalPowerDraw * 1.2); // 20% headroom
    const minimumWattage = Math.ceil(totalPowerDraw * 1.1); // 10% minimum headroom

    if (psuWattage < minimumWattage) {
      rules.push({
        type: 'power',
        severity: 'critical',
        message: `PSU insufficient: ${psuWattage}W PSU for ${totalPowerDraw}W system`,
        details: `Minimum recommended: ${minimumWattage}W, ideal: ${recommendedWattage}W`
      });
    } else if (psuWattage < recommendedWattage) {
      rules.push({
        type: 'power',
        severity: 'warning',
        message: `PSU marginal: ${psuWattage}W PSU for ${totalPowerDraw}W system`,
        details: `Recommended: ${recommendedWattage}W for optimal headroom`
      });
    }

    return rules;
  }

  /**
   * Check GPU compatibility (PCIe slot, power connectors)
   */
  private checkGPUCompatibility(gpu: Component, motherboard: Component): CompatibilityRule[] {
    const rules: CompatibilityRule[] = [];
    
    // Most modern motherboards have PCIe x16 slots, but check for basic compatibility
    const gpuPowerDraw = this.getComponentPowerDraw('gpu', gpu.name);
    
    if (gpuPowerDraw > 300) {
      rules.push({
        type: 'power',
        severity: 'warning',
        message: `High-power GPU (${gpuPowerDraw}W) requires adequate PSU and cooling`,
        details: 'Ensure PSU has required PCIe power connectors'
      });
    }

    return rules;
  }

  /**
   * Check case compatibility (GPU clearance, motherboard form factor)
   */
  private checkCaseCompatibility(caseComponent: Component, gpu?: Component): CompatibilityRule[] {
    const rules: CompatibilityRule[] = [];
    
    // Extract case size and GPU length (simplified checks)
    const caseSize = this.extractCaseSize(caseComponent.name);
    
    if (gpu && caseSize === 'Mini-ITX' && this.isLargeGPU(gpu.name)) {
      rules.push({
        type: 'physical',
        severity: 'warning',
        message: 'Large GPU may not fit in compact case',
        details: 'Verify GPU length compatibility with case specifications'
      });
    }

    return rules;
  }

  /**
   * Calculate total system power draw
   */
  private calculateTotalPowerDraw(build: any): number {
    let total = 0;
    
    // Add component power draws
    if (build.cpu) total += this.getComponentPowerDraw('cpu', build.cpu.name);
    if (build.gpu) total += this.getComponentPowerDraw('gpu', build.gpu.name);
    if (build.ram) total += this.getRAMPowerDraw(build.ram);
    if (build.storage) total += this.getComponentPowerDraw('storage', build.storage.name);
    
    // Add fixed components
    total += this.powerConsumption.motherboard;
    total += this.powerConsumption.fans;

    return total;
  }

  // Helper methods for extracting component specifications
  private extractCPUSocket(cpuName: string): string | null {
    if (cpuName.includes('Core i') || cpuName.includes('Intel')) {
      // Intel 12th-14th gen use LGA1700
      if (cpuName.match(/1[234]\d{3}/)) return 'LGA1700';
    }
    
    if (cpuName.includes('Ryzen')) {
      // Ryzen 7000+ use AM5, older use AM4
      if (cpuName.match(/[789]\d{3}/)) return 'AM5';
      if (cpuName.match(/[1-6]\d{3}/)) return 'AM4';
    }
    
    return null;
  }

  private extractMotherboardSocket(motherboardName: string, specs: any): string | null {
    if (specs?.socket) return specs.socket;
    
    // Extract from name
    if (motherboardName.includes('LGA1700')) return 'LGA1700';
    if (motherboardName.includes('AM5')) return 'AM5';
    if (motherboardName.includes('AM4')) return 'AM4';
    
    // Infer from chipset
    const chipset = this.extractChipset(motherboardName, specs);
    if (['Z790', 'B760', 'H770', 'H610'].includes(chipset || '')) return 'LGA1700';
    if (['X670', 'B650', 'A620'].includes(chipset || '')) return 'AM5';
    if (['X570', 'B550', 'B450'].includes(chipset || '')) return 'AM4';
    
    return null;
  }

  private extractChipset(componentName: string, specs: any): string | null {
    if (specs?.chipset) return specs.chipset;
    
    const chipsets = ['Z790', 'B760', 'H770', 'H610', 'X670E', 'X670', 'B650E', 'B650', 'A620', 'X570', 'B550', 'B450'];
    
    for (const chipset of chipsets) {
      if (componentName.includes(chipset)) return chipset;
    }
    
    return null;
  }

  private extractRAMType(ramName: string, specs: any): string | null {
    if (specs?.memoryType) return specs.memoryType;
    if (ramName.includes('DDR5')) return 'DDR5';
    if (ramName.includes('DDR4')) return 'DDR4';
    return null;
  }

  private extractRAMSpeed(ramName: string, specs: any): number | null {
    if (specs?.speed) return specs.speed;
    
    const speedMatch = ramName.match(/(\d{4,5})/);
    return speedMatch ? parseInt(speedMatch[1]) : null;
  }

  private extractRAMCapacity(ramName: string, specs: any): number | null {
    if (specs?.capacity) return parseInt(specs.capacity);
    
    const capacityMatch = ramName.match(/(\d+)GB/);
    return capacityMatch ? parseInt(capacityMatch[1]) : null;
  }

  private extractPSUWattage(psuName: string, specs: any): number | null {
    if (specs?.wattage) return specs.wattage;
    
    const wattageMatch = psuName.match(/(\d{3,4})W/);
    return wattageMatch ? parseInt(wattageMatch[1]) : null;
  }

  private getComponentPowerDraw(category: string, componentName: string): number {
    const powerDb = this.powerConsumption[category as keyof typeof this.powerConsumption] as any;
    if (!powerDb) return 0;

    // Find exact or partial match
    for (const [name, power] of Object.entries(powerDb)) {
      if (componentName.includes(name) || name.includes(componentName)) {
        return power as number;
      }
    }

    // Default estimates by category
    const defaults = { cpu: 65, gpu: 200, storage: 5 };
    return defaults[category as keyof typeof defaults] || 0;
  }

  private getRAMPowerDraw(ram: Component): number {
    const capacity = this.extractRAMCapacity(ram.name, ram.specs);
    const type = this.extractRAMType(ram.name, ram.specs);
    
    if (type === 'DDR5') {
      return capacity === 32 ? 16 : 8;
    } else {
      return capacity === 32 ? 12 : 6;
    }
  }

  private extractCaseSize(caseName: string): string {
    if (caseName.toLowerCase().includes('mini') || caseName.toLowerCase().includes('itx')) return 'Mini-ITX';
    if (caseName.toLowerCase().includes('micro') || caseName.toLowerCase().includes('matx')) return 'Micro-ATX';
    return 'ATX';
  }

  private isLargeGPU(gpuName: string): boolean {
    const largeGPUs = ['RTX 4090', 'RTX 4080', 'RTX 3080', 'RTX 3090', 'RX 7900'];
    return largeGPUs.some(gpu => gpuName.includes(gpu));
  }
}

export const componentCompatibilityService = new ComponentCompatibilityService();