// Mock Reddit insights for components while Reddit integration is being fixed
// This provides immediate functionality while the CORS proxy stabilizes

interface ComponentInsight {
  component: string;
  insights: string[];
  pros: string[];
  cons: string[];
  redditScore: number;
}

const componentInsights: Record<string, ComponentInsight> = {
  // CPUs
  'intel core i9-15900k': {
    component: 'Intel Core i9-15900K',
    insights: ['Flagship gaming and productivity processor with 24 cores'],
    pros: ['Excellent gaming performance', 'Great for streaming and content creation'],
    cons: ['High power consumption', 'Expensive'],
    redditScore: 142
  },
  'amd ryzen 9 9950x': {
    component: 'AMD Ryzen 9 9950X',
    insights: ['16-core powerhouse with Zen 5 architecture'],
    pros: ['Outstanding productivity performance', 'Great value for content creators'],
    cons: ['Gaming performance trails Intel at times'],
    redditScore: 98
  },
  'amd ryzen 7 9800x3d': {
    component: 'AMD Ryzen 7 9800X3D',
    insights: ['Gaming-focused CPU with 3D V-Cache technology'],
    pros: ['Best gaming performance available', 'Efficient power consumption'],
    cons: ['Limited to 8 cores', 'Premium pricing'],
    redditScore: 215
  },
  
  // GPUs
  'nvidia geforce rtx 5090': {
    component: 'NVIDIA GeForce RTX 5090',
    insights: ['Ultimate 4K gaming GPU with 32GB GDDR7'],
    pros: ['Unmatched 4K performance', 'Excellent for AI workloads'],
    cons: ['Extremely expensive', 'Requires high-end PSU'],
    redditScore: 89
  },
  'nvidia geforce rtx 5080': {
    component: 'NVIDIA GeForce RTX 5080',
    insights: ['High-end 4K gaming with good value proposition'],
    pros: ['Great 4K gaming performance', 'More reasonable pricing'],
    cons: ['Still expensive for most users'],
    redditScore: 156
  },
  'nvidia geforce rtx 5070': {
    component: 'NVIDIA GeForce RTX 5070',
    insights: ['Perfect 1440p gaming GPU with ray tracing'],
    pros: ['Excellent 1440p performance', 'Good ray tracing support'],
    cons: ['Overkill for 1080p', '12GB might be limiting in future'],
    redditScore: 203
  },
  'amd radeon rx 8800 xt': {
    component: 'AMD Radeon RX 8800 XT',
    insights: ['Strong 1440p competitor with excellent value'],
    pros: ['Great price-to-performance', 'Good rasterization performance'],
    cons: ['Ray tracing behind NVIDIA', 'Limited AI features'],
    redditScore: 134
  },
  'intel arc b580': {
    component: 'Intel Arc B580',
    insights: ['Impressive budget option with 12GB VRAM'],
    pros: ['Amazing value for money', 'Generous VRAM allocation'],
    cons: ['Driver issues with older games', 'Limited ray tracing'],
    redditScore: 267
  },
  
  // Motherboards
  'asus rog strix z890-e gaming': {
    component: 'ASUS ROG STRIX Z890-E GAMING',
    insights: ['Premium Z890 motherboard with WiFi 7'],
    pros: ['Excellent build quality', 'Latest connectivity options'],
    cons: ['Expensive', 'Overkill for basic builds'],
    redditScore: 78
  },
  'msi mag x870 tomahawk': {
    component: 'MSI MAG X870 TOMAHAWK',
    insights: ['Great value X870 board for Ryzen 9000'],
    pros: ['Excellent price-to-feature ratio', 'Solid VRM design'],
    cons: ['Basic aesthetics', 'Limited RGB'],
    redditScore: 145
  },
  
  // RAM
  'g.skill trident z5 rgb 32gb ddr5-7200': {
    component: 'G.SKILL Trident Z5 RGB 32GB DDR5-7200',
    insights: ['High-speed DDR5 kit optimized for Intel and AMD'],
    pros: ['Excellent performance', 'Beautiful RGB lighting'],
    cons: ['Expensive', 'May need manual tuning'],
    redditScore: 92
  },
  'kingston fury beast 32gb ddr5-5600': {
    component: 'Kingston Fury Beast 32GB DDR5-5600',
    insights: ['Reliable budget DDR5 option'],
    pros: ['Great value', 'Reliable performance'],
    cons: ['No RGB', 'Lower speeds than premium kits'],
    redditScore: 167
  },
  
  // Storage
  'samsung 990 evo plus 2tb': {
    component: 'Samsung 990 EVO Plus 2TB',
    insights: ['Excellent value NVMe SSD with great performance'],
    pros: ['Great price per GB', 'Reliable Samsung quality'],
    cons: ['Not the fastest available', 'QLC NAND in larger capacities'],
    redditScore: 189
  },
  'crucial t705 2tb pcie 5.0': {
    component: 'Crucial T705 2TB PCIe 5.0',
    insights: ['Cutting-edge PCIe 5.0 SSD with extreme speeds'],
    pros: ['Fastest storage available', 'Future-proof'],
    cons: ['Very expensive', 'Requires PCIe 5.0 slot'],
    redditScore: 76
  },
  
  // PSUs
  'corsair rm1000e 1000w 80+ gold': {
    component: 'Corsair RM1000e 1000W 80+ Gold',
    insights: ['Reliable high-wattage PSU for demanding builds'],
    pros: ['Fully modular', 'Excellent build quality'],
    cons: ['Overkill for most builds', 'Premium pricing'],
    redditScore: 112
  },
  'seasonic focus gx-750 750w': {
    component: 'Seasonic Focus GX-750 750W',
    insights: ['Outstanding value 750W PSU from trusted brand'],
    pros: ['Excellent efficiency', 'Great warranty'],
    cons: ['Fan can be audible under load'],
    redditScore: 198
  },
  
  // Coolers
  'noctua nh-d15 g2': {
    component: 'Noctua NH-D15 G2',
    insights: ['Premium air cooler with exceptional performance'],
    pros: ['Extremely quiet', 'Excellent cooling performance'],
    cons: ['Very expensive', 'Large size may cause clearance issues'],
    redditScore: 156
  },
  'thermalright peerless assassin 120 se': {
    component: 'Thermalright Peerless Assassin 120 SE',
    insights: ['Incredible value air cooler with near-premium performance'],
    pros: ['Amazing price-to-performance', 'Quiet operation'],
    cons: ['Basic aesthetics', 'No RGB'],
    redditScore: 234
  },
  'arctic liquid freezer iii 280': {
    component: 'Arctic Liquid Freezer III 280',
    insights: ['Excellent value AIO with VRM cooling'],
    pros: ['Great cooling performance', 'Includes VRM fan'],
    cons: ['Thick radiator', 'Basic aesthetics'],
    redditScore: 187
  },
  
  // Cases
  'fractal design north': {
    component: 'Fractal Design North',
    insights: ['Unique wood-panel design with excellent airflow'],
    pros: ['Beautiful aesthetics', 'Great airflow'],
    cons: ['Limited tempered glass', 'Premium pricing'],
    redditScore: 143
  },
  'lian li o11 vision': {
    component: 'Lian Li O11 Vision',
    insights: ['Premium showcase case with excellent build quality'],
    pros: ['Stunning aesthetics', 'Great for custom loops'],
    cons: ['Expensive', 'Requires many fans'],
    redditScore: 98
  }
};

export class ComponentInsightsService {
  async getComponentTooltip(componentName: string): Promise<{
    insights: string[];
    pros: string[];
    cons: string[];
    redditScore: number;
  } | null> {
    // Normalize component name for lookup
    const normalizedName = componentName.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const insight = componentInsights[normalizedName];
    
    if (insight) {
      return {
        insights: insight.insights,
        pros: insight.pros,
        cons: insight.cons,
        redditScore: insight.redditScore
      };
    }
    
    // Generate generic insight based on component type and name
    return this.generateGenericInsight(componentName);
  }
  
  private generateGenericInsight(componentName: string): {
    insights: string[];
    pros: string[];
    cons: string[];
    redditScore: number;
  } {
    const name = componentName.toLowerCase();
    let insights: string[] = [];
    let pros: string[] = [];
    let cons: string[] = [];
    
    // Generate insights based on component patterns
    if (name.includes('rtx') || name.includes('geforce')) {
      insights.push('NVIDIA graphics card with ray tracing support');
      pros.push('Good ray tracing performance', 'DLSS support');
      cons.push('Premium pricing');
    } else if (name.includes('radeon') || name.includes('rx')) {
      insights.push('AMD graphics card with competitive performance');
      pros.push('Good value for money', 'Strong rasterization');
      cons.push('Ray tracing behind NVIDIA');
    } else if (name.includes('intel') && name.includes('core')) {
      insights.push('Intel processor with strong gaming performance');
      pros.push('Excellent gaming performance');
      cons.push('Higher power consumption');
    } else if (name.includes('ryzen') || name.includes('amd')) {
      insights.push('AMD processor with good multi-threading');
      pros.push('Great productivity performance', 'Good value');
      cons.push('May trail in gaming vs Intel');
    } else if (name.includes('ddr5')) {
      insights.push('Latest DDR5 memory technology');
      pros.push('Future-proof', 'High bandwidth');
      cons.push('More expensive than DDR4');
    } else {
      insights.push('Quality component from reputable manufacturer');
      pros.push('Reliable performance');
      cons.push('Check compatibility with your build');
    }
    
    return {
      insights,
      pros,
      cons,
      redditScore: Math.floor(Math.random() * 200) + 50 // Random score between 50-250
    };
  }
}

export const componentInsightsService = new ComponentInsightsService();