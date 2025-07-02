import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cpu, MonitorSpeaker, CircuitBoard, MemoryStick, HardDrive, Fan, Zap, Box, ChevronDown, ChevronUp } from 'lucide-react';
import ComponentCard from './ComponentCard';
import BuildSidebar from './BuildSidebar';
import { 
  BuildConfiguration, 
  Region, 
  generateRecommendedBuild, 
  calculateBudgetAllocation,
  checkCompatibility
} from '../utils/budgetAllocator';
import { allRealComponents } from '../data/realComponents';
import { retailVerificationService } from '../services/retailVerification';
import { redditService } from '../services/redditService';
import { autonomousComponentDiscovery } from '../services/autonomousComponentDiscovery';
import { realTimePriceTracker } from '../services/realTimePriceTracker';

interface ComponentSelectorProps {
  budget: number;
  region: Region;
  onBack: () => void;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  budget,
  region,
  onBack
}) => {
  const [build, setBuild] = useState<BuildConfiguration>({
    cpu: null,
    gpu: null,
    motherboard: null,
    ram: null,
    storage: null,
    cooler: null,
    psu: null,
    case: null
  });
  
  const [expandedCategory, setExpandedCategory] = useState<keyof BuildConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryAlternatives, setCategoryAlternatives] = useState<Record<keyof BuildConfiguration, any[]>>({
    cpu: [],
    gpu: [],
    motherboard: [],
    ram: [],
    storage: [],
    cooler: [],
    psu: [],
    case: []
  });

  const budgetAllocation = calculateBudgetAllocation(budget);

  const categoryIcons = {
    cpu: Cpu,
    gpu: MonitorSpeaker,
    motherboard: CircuitBoard,
    ram: MemoryStick,
    storage: HardDrive,
    cooler: Fan,
    psu: Zap,
    case: Box
  };

  const categoryNames = {
    cpu: 'Processor',
    gpu: 'Graphics Card',
    motherboard: 'Motherboard',
    ram: 'Memory',
    storage: 'Storage',
    cooler: 'CPU Cooler',
    psu: 'Power Supply',
    case: 'Case'
  };

  useEffect(() => {
    const loadRecommendedBuild = async () => {
      try {
        const recommendedBuild = await generateRecommendedBuild(budget, region);
        setBuild(recommendedBuild);
      } catch (error) {
        console.error('Failed to generate recommended build:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecommendedBuild();
  }, [budget, region]);

  const handleComponentSelect = (category: keyof BuildConfiguration, component: any) => {
    setBuild(prev => ({
      ...prev,
      [category]: component
    }));
    setExpandedCategory(null); // Close alternatives after selection
  };

  const handleComponentRemove = (category: keyof BuildConfiguration) => {
    setBuild(prev => ({
      ...prev,
      [category]: null
    }));
  };

  const toggleAlternatives = async (category: keyof BuildConfiguration) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      return;
    }

    setExpandedCategory(category);
    
    // Load alternatives if not already loaded
    if (categoryAlternatives[category].length === 0) {
      const alternatives = await getAlternativeComponents(category);
      setCategoryAlternatives(prev => ({
        ...prev,
        [category]: alternatives
      }));
    }
  };

  const getAlternativeComponents = async (category: keyof BuildConfiguration) => {
    const categoryBudget = budgetAllocation[category];
    
    let allCategoryComponents: any[] = [];
    
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
      console.warn('Autonomous discovery failed, falling back to verified components:', error);
      allCategoryComponents = [...allRealComponents[category]];
    }
    
    if (allCategoryComponents.length < 12) {
      const existingNames = new Set(allCategoryComponents.map(c => c.name.toLowerCase()));
      const additionalComponents = allRealComponents[category].filter(
        rc => !existingNames.has(rc.name.toLowerCase())
      );
      allCategoryComponents = [...allCategoryComponents, ...additionalComponents];
    }
    
    try {
      const redditComponents = await redditService.getLatestComponentsForType(category, region);
      
      if (redditComponents.length > 0) {
        const verifiedRedditComponents = await retailVerificationService.filterRealComponents(redditComponents);
        const existingNames = new Set(allCategoryComponents.map(c => c.name.toLowerCase()));
        const newVerifiedComponents = verifiedRedditComponents.filter(
          rc => !existingNames.has(rc.name.toLowerCase())
        );
        allCategoryComponents = [...allCategoryComponents, ...newVerifiedComponents];
      }
    } catch (error) {
      console.warn('Failed to fetch Reddit components for alternatives:', error);
    }
    
    const filteredComponents = allCategoryComponents.filter(component => 
      component.price[region] <= categoryBudget * 1.5 &&
      component.availability === 'in-stock'
    );
    
    return filteredComponents.sort((a, b) => {
      const aIsAutonomous = a.id.includes('auto') || a.id.includes('retailer') || a.id.includes('news');
      const bIsAutonomous = b.id.includes('auto') || b.id.includes('retailer') || b.id.includes('news');
      
      if (aIsAutonomous && !bIsAutonomous) return -1;
      if (!aIsAutonomous && bIsAutonomous) return 1;
      
      const aIsReal = a.id.includes('real');
      const bIsReal = b.id.includes('real');
      
      if (aIsReal && !bIsReal) return -1;
      if (!aIsReal && bIsReal) return 1;
      
      return a.price[region] - b.price[region];
    });
  };

  const getCompatibilityStatus = (component: any, category: keyof BuildConfiguration) => {
    const testBuild = { ...build, [category]: component };
    const compatibility = checkCompatibility(testBuild);
    
    if (compatibility.isCompatible) return 'compatible';
    if (compatibility.warnings.length > 0) return 'warning';
    return 'incompatible';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Generating your recommended build...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Budget
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PC Builder</h1>
                <p className="text-gray-600">Select components for your build</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Budget: ${budget.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Component Cards Grid - Wealthsimple Style */}
        <div className="p-6">
          <div className="grid gap-6 max-w-4xl">
            {Object.entries(categoryIcons).map(([category, IconComponent]) => {
              const selectedComponent = build[category as keyof BuildConfiguration];
              const isExpanded = expandedCategory === category;
              const alternatives = categoryAlternatives[category as keyof BuildConfiguration];
              
              return (
                <Card key={category} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <span>{categoryNames[category as keyof typeof categoryNames]}</span>
                        <Badge variant="outline" className="text-xs">
                          ${budgetAllocation[category as keyof BuildConfiguration].toLocaleString()}
                        </Badge>
                      </div>
                      {selectedComponent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlternatives(category as keyof BuildConfiguration)}
                          className="flex items-center gap-1"
                        >
                          Alternatives
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {selectedComponent ? (
                      <div className="space-y-4">
                        <ComponentCard
                          component={selectedComponent}
                          region={region}
                          isSelected={true}
                          budgetAllocation={budgetAllocation[category as keyof BuildConfiguration]}
                          showCompatibility={true}
                          compatibilityStatus={getCompatibilityStatus(selectedComponent, category as keyof BuildConfiguration)}
                        />
                        
                        {isExpanded && (
                          <div className="space-y-3 pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-700">Alternative Options</h4>
                            {alternatives.length === 0 ? (
                              <p className="text-sm text-gray-500">Loading alternatives...</p>
                            ) : (
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {alternatives.slice(0, 5).map((component) => (
                                  <ComponentCard
                                    key={component.id}
                                    component={component}
                                    region={region}
                                    isSelected={false}
                                    isRecommended={component.price[region] <= budgetAllocation[category as keyof BuildConfiguration] * 1.1}
                                    budgetAllocation={budgetAllocation[category as keyof BuildConfiguration]}
                                    onSelect={(comp) => handleComponentSelect(category as keyof BuildConfiguration, comp)}
                                    showCompatibility={true}
                                    compatibilityStatus={getCompatibilityStatus(component, category as keyof BuildConfiguration)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <IconComponent className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-3">No component selected</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAlternatives(category as keyof BuildConfiguration)}
                        >
                          Browse {categoryNames[category as keyof typeof categoryNames]}
                        </Button>
                        
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            {alternatives.length === 0 ? (
                              <p className="text-sm text-gray-500">Loading components...</p>
                            ) : (
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {alternatives.slice(0, 8).map((component) => (
                                  <ComponentCard
                                    key={component.id}
                                    component={component}
                                    region={region}
                                    isSelected={false}
                                    isRecommended={component.price[region] <= budgetAllocation[category as keyof BuildConfiguration] * 1.1}
                                    budgetAllocation={budgetAllocation[category as keyof BuildConfiguration]}
                                    onSelect={(comp) => handleComponentSelect(category as keyof BuildConfiguration, comp)}
                                    showCompatibility={true}
                                    compatibilityStatus={getCompatibilityStatus(component, category as keyof BuildConfiguration)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <BuildSidebar
        build={build}
        budget={budget}
        region={region}
        onComponentRemove={handleComponentRemove}
      />
    </div>
  );
};

export default ComponentSelector;