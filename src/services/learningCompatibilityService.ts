// Learning Compatibility Service
// Uses real Reddit builds and user feedback to learn component compatibility

import { redditBuildLearner } from './redditBuildLearner';
import { Component } from '../utils/budgetAllocator';
import { componentDatabaseService } from './componentDatabaseService';

export interface LearnedCompatibilityResult {
  compatible: boolean;
  confidence: number;
  source: string;
  explanation: string;
  examples?: string[];
}

export interface CompatibilityFeedback {
  componentA: string;
  componentB: string;
  compatible: boolean;
  userConfirmed: boolean;
  buildId?: string;
  notes?: string;
}

class LearningCompatibilityService {
  private learningData: Map<string, any> = new Map();
  private initialized = false;

  /**
   * Initialize the learning system by analyzing Reddit builds
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🧠 Initializing learning compatibility system...');
    
    try {
      // Learn from Reddit builds
      await redditBuildLearner.learnFromRedditBuilds('buildapcforme', 50);
      await redditBuildLearner.learnFromRedditBuilds('buildapc', 30);
      
      this.initialized = true;
      console.log('✅ Learning compatibility system initialized');
      
    } catch (error) {
      console.error('Failed to initialize learning system:', error);
      this.initialized = false;
    }
  }

  /**
   * Check compatibility using learned patterns instead of hardcoded rules
   */
  async checkLearnedCompatibility(build: {
    cpu?: Component;
    motherboard?: Component;
    ram?: Component;
    gpu?: Component;
    psu?: Component;
    storage?: Component;
    case?: Component;
    cooler?: Component;
  }): Promise<LearnedCompatibilityResult[]> {
    const results: LearnedCompatibilityResult[] = [];

    // Ensure system is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    const components = Object.entries(build).filter(([_, comp]) => comp !== null && comp !== undefined);

    // Check each pair of components
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const [typeA, compA] = components[i];
        const [typeB, compB] = components[j];

        if (!compA || !compB) continue;

        const compatibility = await this.checkComponentPairCompatibility(
          compA as Component, 
          compB as Component, 
          typeA, 
          typeB
        );

        if (compatibility.confidence > 0.3) { // Only report meaningful results
          results.push(compatibility);
        }
      }
    }

    return results;
  }

  /**
   * Check compatibility between two specific components
   */
  private async checkComponentPairCompatibility(
    compA: Component, 
    compB: Component, 
    typeA: string, 
    typeB: string
  ): Promise<LearnedCompatibilityResult> {
    
    // Special handling for critical compatibility checks
    if (this.isCriticalPair(typeA, typeB)) {
      return await this.checkCriticalCompatibility(compA, compB, typeA, typeB);
    }

    // Use learned patterns for general compatibility
    const learned = redditBuildLearner.checkLearnedCompatibility(compA.name, compB.name);
    
    return {
      compatible: learned.compatible,
      confidence: learned.confidence,
      source: learned.source,
      explanation: this.generateExplanation(compA, compB, typeA, typeB, learned.compatible),
      examples: []
    };
  }

  /**
   * Check critical compatibility pairs (CPU-motherboard, RAM-motherboard, etc.)
   */
  private async checkCriticalCompatibility(
    compA: Component, 
    compB: Component, 
    typeA: string, 
    typeB: string
  ): Promise<LearnedCompatibilityResult> {
    
    // CPU-Motherboard compatibility
    if ((typeA === 'cpu' && typeB === 'motherboard') || (typeA === 'motherboard' && typeB === 'cpu')) {
      return this.checkCPUMotherboardLearned(compA, compB, typeA === 'cpu' ? compA : compB, typeA === 'motherboard' ? compA : compB);
    }

    // RAM-Motherboard compatibility  
    if ((typeA === 'ram' && typeB === 'motherboard') || (typeA === 'motherboard' && typeB === 'ram')) {
      return this.checkRAMMotherboardLearned(compA, compB, typeA === 'ram' ? compA : compB, typeA === 'motherboard' ? compA : compB);
    }

    // Cooler-CPU compatibility (this was the issue!)
    if ((typeA === 'cooler' && typeB === 'cpu') || (typeA === 'cpu' && typeB === 'cooler')) {
      return this.checkCoolerCPULearned(compA, compB, typeA === 'cooler' ? compA : compB, typeA === 'cpu' ? compA : compB);
    }

    // GPU-PSU power compatibility
    if ((typeA === 'gpu' && typeB === 'psu') || (typeA === 'psu' && typeB === 'gpu')) {
      return this.checkPowerCompatibilityLearned(compA, compB, typeA === 'gpu' ? compA : compB, typeA === 'psu' ? compA : compB);
    }

    // Default to learned pattern
    const learned = redditBuildLearner.checkLearnedCompatibility(compA.name, compB.name);
    return {
      compatible: learned.compatible,
      confidence: learned.confidence,
      source: learned.source,
      explanation: `General compatibility based on ${learned.source}`,
      examples: []
    };
  }

  /**
   * Check CPU-Motherboard compatibility using learned patterns
   */
  private async checkCPUMotherboardLearned(compA: Component, compB: Component, cpu: Component, motherboard: Component): Promise<LearnedCompatibilityResult> {
    // First check learned patterns
    const learned = redditBuildLearner.checkLearnedCompatibility(cpu.name, motherboard.name);
    
    if (learned.confidence > 0.6) {
      return {
        compatible: learned.compatible,
        confidence: learned.confidence,
        source: learned.source,
        explanation: learned.compatible 
          ? `${cpu.name} and ${motherboard.name} are compatible based on real builds`
          : `${cpu.name} and ${motherboard.name} have compatibility issues in real builds`,
        examples: []
      };
    }

    // Fallback to basic socket detection for unknown combinations
    const cpuSocket = this.extractSocketFromName(cpu.name);
    const motherboardSocket = this.extractSocketFromName(motherboard.name);

    if (cpuSocket && motherboardSocket) {
      const compatible = cpuSocket === motherboardSocket;
      return {
        compatible,
        confidence: 0.8,
        source: 'Socket detection',
        explanation: compatible 
          ? `Both components use ${cpuSocket} socket`
          : `Socket mismatch: CPU uses ${cpuSocket}, motherboard uses ${motherboardSocket}`,
        examples: []
      };
    }

    // Unknown - default to compatible with low confidence
    return {
      compatible: true,
      confidence: 0.3,
      source: 'Unknown compatibility',
      explanation: 'Could not determine compatibility - please verify manually',
      examples: []
    };
  }

  /**
   * Check RAM-Motherboard compatibility using learned patterns
   */
  private async checkRAMMotherboardLearned(compA: Component, compB: Component, ram: Component, motherboard: Component): Promise<LearnedCompatibilityResult> {
    const learned = redditBuildLearner.checkLearnedCompatibility(ram.name, motherboard.name);
    
    if (learned.confidence > 0.6) {
      return {
        compatible: learned.compatible,
        confidence: learned.confidence,
        source: learned.source,
        explanation: learned.compatible 
          ? `${ram.name} works with ${motherboard.name} based on real builds`
          : `${ram.name} may have issues with ${motherboard.name}`,
        examples: []
      };
    }

    // Basic DDR4/DDR5 detection
    const ramType = this.extractMemoryType(ram.name);
    const socketType = this.extractSocketFromName(motherboard.name);

    if (ramType && socketType) {
      let compatible = true;
      let explanation = '';

      if (socketType === 'AM5' && ramType === 'DDR4') {
        compatible = false;
        explanation = 'AM5 motherboards only support DDR5 memory';
      } else if (socketType === 'AM4' && ramType === 'DDR5') {
        compatible = false;
        explanation = 'AM4 motherboards only support DDR4 memory';
      } else {
        explanation = `${ramType} memory should work with ${socketType} platform`;
      }

      return {
        compatible,
        confidence: 0.7,
        source: 'Memory type detection',
        explanation,
        examples: []
      };
    }

    return {
      compatible: true,
      confidence: 0.4,
      source: 'Unknown memory compatibility',
      explanation: 'Could not determine memory compatibility - please verify DDR4/DDR5 support',
      examples: []
    };
  }

  /**
   * Check CPU cooler compatibility - THIS WAS THE MAIN ISSUE
   */
  private async checkCoolerCPULearned(compA: Component, compB: Component, cooler: Component, cpu: Component): Promise<LearnedCompatibilityResult> {
    // First check learned patterns from real builds
    const learned = redditBuildLearner.checkLearnedCompatibility(cooler.name, cpu.name);
    
    if (learned.confidence > 0.5) {
      return {
        compatible: learned.compatible,
        confidence: learned.confidence,
        source: learned.source,
        explanation: learned.compatible 
          ? `${cooler.name} works with ${cpu.name} - confirmed in real builds`
          : `${cooler.name} may have issues with ${cpu.name}`,
        examples: []
      };
    }

    // For popular coolers like Thermalright Peerless Assassin, default to compatible
    if (this.isPopularUniversalCooler(cooler.name)) {
      const cpuSocket = this.extractSocketFromName(cpu.name);
      return {
        compatible: true,
        confidence: 0.8,
        source: 'Popular universal cooler',
        explanation: `${cooler.name} is a popular universal cooler that supports most modern sockets including ${cpuSocket}`,
        examples: []
      };
    }

    // Check socket compatibility for coolers
    const cpuSocket = this.extractSocketFromName(cpu.name);
    const coolerSockets = this.getCoolerSocketSupport(cooler.name);

    if (cpuSocket && coolerSockets.length > 0) {
      const compatible = coolerSockets.includes(cpuSocket);
      return {
        compatible,
        confidence: 0.7,
        source: 'Socket compatibility check',
        explanation: compatible 
          ? `${cooler.name} supports ${cpuSocket} socket`
          : `${cooler.name} does not support ${cpuSocket} socket`,
        examples: []
      };
    }

    // Default to compatible for CPU coolers (most modern coolers are universal)
    return {
      compatible: true,
      confidence: 0.6,
      source: 'Default cooler compatibility',
      explanation: 'Most modern CPU coolers are compatible with current sockets - verify mounting kit availability',
      examples: []
    };
  }

  /**
   * Check power compatibility between GPU and PSU
   */
  private async checkPowerCompatibilityLearned(compA: Component, compB: Component, gpu: Component, psu: Component): Promise<LearnedCompatibilityResult> {
    const gpuPower = this.estimateGPUPower(gpu.name);
    const psuWattage = this.extractPSUWattage(psu.name);

    if (gpuPower && psuWattage) {
      const systemPower = gpuPower + 200; // Rough estimate for rest of system
      const compatible = psuWattage >= systemPower * 1.1; // 10% headroom minimum

      return {
        compatible,
        confidence: 0.8,
        source: 'Power calculation',
        explanation: compatible 
          ? `${psu.name} (${psuWattage}W) provides adequate power for ${gpu.name} (~${gpuPower}W)`
          : `${psu.name} (${psuWattage}W) may be insufficient for ${gpu.name} (~${gpuPower}W)`,
        examples: []
      };
    }

    return {
      compatible: true,
      confidence: 0.4,
      source: 'Unknown power requirements',
      explanation: 'Could not determine power requirements - please verify PSU wattage',
      examples: []
    };
  }

  // Helper methods for component detection
  private isCriticalPair(typeA: string, typeB: string): boolean {
    const criticalPairs = [
      ['cpu', 'motherboard'],
      ['ram', 'motherboard'],
      ['cooler', 'cpu'],
      ['gpu', 'psu']
    ];

    return criticalPairs.some(pair => 
      (pair[0] === typeA && pair[1] === typeB) || 
      (pair[0] === typeB && pair[1] === typeA)
    );
  }

  private extractSocketFromName(componentName: string): string | null {
    if (componentName.includes('AM5') || componentName.match(/Ryzen.*[789]\d{3}/)) return 'AM5';
    if (componentName.includes('AM4') || componentName.match(/Ryzen.*[1-6]\d{3}/)) return 'AM4';
    if (componentName.includes('LGA1700') || componentName.match(/Core.*i[3579]-1[234]\d{3}/)) return 'LGA1700';
    return null;
  }

  private extractMemoryType(ramName: string): string | null {
    if (ramName.includes('DDR5')) return 'DDR5';
    if (ramName.includes('DDR4')) return 'DDR4';
    return null;
  }

  private isPopularUniversalCooler(coolerName: string): boolean {
    const universalCoolers = [
      'thermalright peerless assassin',
      'noctua nh-d15',
      'be quiet! dark rock pro',
      'cooler master hyper 212',
      'arctic freezer',
      'scythe fuma'
    ];

    const lowerName = coolerName.toLowerCase();
    return universalCoolers.some(cooler => lowerName.includes(cooler));
  }

  private getCoolerSocketSupport(coolerName: string): string[] {
    // Most modern coolers support both AM4/AM5 and LGA1700
    const lowerName = coolerName.toLowerCase();
    
    if (lowerName.includes('thermalright') || lowerName.includes('peerless')) {
      return ['AM4', 'AM5', 'LGA1700', 'LGA1200']; // Thermalright coolers are very universal
    }
    
    if (lowerName.includes('noctua') || lowerName.includes('be quiet') || lowerName.includes('arctic')) {
      return ['AM4', 'AM5', 'LGA1700', 'LGA1200']; // Most premium coolers support all modern sockets
    }

    return ['AM4', 'LGA1700']; // Default assumption for modern coolers
  }

  private estimateGPUPower(gpuName: string): number | null {
    const powerData: { [key: string]: number } = {
      'rtx 4090': 450, 'rtx 4080': 320, 'rtx 4070': 200, 'rtx 4060': 115,
      'rx 7900 xtx': 355, 'rx 7800 xt': 263, 'rx 7600': 165,
      'rtx 3080': 320, 'rtx 3070': 220, 'rtx 3060': 170
    };

    const lowerName = gpuName.toLowerCase();
    for (const [gpu, power] of Object.entries(powerData)) {
      if (lowerName.includes(gpu)) return power;
    }

    return null;
  }

  private extractPSUWattage(psuName: string): number | null {
    const wattageMatch = psuName.match(/(\d{3,4})W/);
    return wattageMatch ? parseInt(wattageMatch[1]) : null;
  }

  private generateExplanation(compA: Component, compB: Component, typeA: string, typeB: string, compatible: boolean): string {
    if (compatible) {
      return `${compA.name} and ${compB.name} are compatible based on real PC builds`;
    } else {
      return `${compA.name} and ${compB.name} may have compatibility issues based on community feedback`;
    }
  }

  /**
   * Add user feedback to improve learning
   */
  async addCompatibilityFeedback(feedback: CompatibilityFeedback): Promise<void> {
    console.log(`📝 Recording compatibility feedback: ${feedback.componentA} + ${feedback.componentB} = ${feedback.compatible ? 'compatible' : 'incompatible'}`);
    
    // This would update the learning database in a real implementation
    // For now, just log the feedback
    await componentDatabaseService.logProcess(
      'compatibility_feedback',
      'completed',
      `User feedback: ${feedback.componentA} + ${feedback.componentB}`,
      feedback
    );
  }

  /**
   * Get compatibility examples for a component
   */
  async getCompatibilityExamples(componentName: string): Promise<string[]> {
    return await redditBuildLearner.getCompatibilityData('any', componentName);
  }
}

export const learningCompatibilityService = new LearningCompatibilityService();