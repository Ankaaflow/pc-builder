
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cpu, MonitorSpeaker, CircuitBoard, MemoryStick, HardDrive, Fan, Zap, Box } from 'lucide-react';
import ComponentCard from './ComponentCard';
import BuildSidebar from './BuildSidebar';
import { 
  BuildConfiguration, 
  Region, 
  generateRecommendedBuild, 
  calculateBudgetAllocation,
  allComponents,
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
  
  const [activeCategory, setActiveCategory] = useState<keyof BuildConfiguration>('cpu');
  const [isLoading, setIsLoading] = useState(true);
  const [currentCategoryComponents, setCurrentCategoryComponents] = useState<any[]>([]);

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
    // Generate initial recommended build
    const loadRecommendedBuild = async () => {
      try {
        const recommendedBuild = await generateRecommendedBuild(budget, region);
        setBuild(recommendedBuild);
        
        // Load components for the initial category
        const components = await getAlternativeComponents(activeCategory);
        setCurrentCategoryComponents(components);
      } catch (error) {
        console.error('Failed to generate recommended build:', error);
        // You could add error state handling here
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecommendedBuild();
  }, [budget, region]);

  // Load components when category changes
  useEffect(() => {
    const loadCategoryComponents = async () => {
      const components = await getAlternativeComponents(activeCategory);
      setCurrentCategoryComponents(components);
    };
    
    if (!isLoading) {
      loadCategoryComponents();
    }
  }, [activeCategory, budget, region, isLoading]);

  const handleComponentSelect = (category: keyof BuildConfiguration, component: any) => {
    setBuild(prev => ({
      ...prev,
      [category]: component
    }));
  };

  const handleComponentRemove = (category: keyof BuildConfiguration) => {
    setBuild(prev => ({
      ...prev,
      [category]: null
    }));
  };

  const getAlternativeComponents = async (category: keyof BuildConfiguration) => {
    const budget = budgetAllocation[category];
    
    // Start with the most current components from autonomous discovery
    let allCategoryComponents: any[] = [];
    
    try {
      // Get latest autonomous discoveries (includes RTX 50 series, new CPUs, etc.)
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
    if (allCategoryComponents.length < 12) {
      const existingNames = new Set(allCategoryComponents.map(c => c.name.toLowerCase()));
      const additionalComponents = allRealComponents[category].filter(
        rc => !existingNames.has(rc.name.toLowerCase())
      );
      allCategoryComponents = [...allCategoryComponents, ...additionalComponents];
    }
    
    try {
      // Try to get additional Reddit components and verify they exist
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
      console.warn('Failed to fetch Reddit components for alternatives:', error);
    }
    
    // Filter and sort components
    const filteredComponents = allCategoryComponents.filter(component => 
      component.price[region] <= budget * 1.5 && // Show components up to 150% of budget
      component.availability === 'in-stock'
    );
    
    // Sort by latest autonomous discoveries first, then by price
    return filteredComponents.sort((a, b) => {
      // Prioritize autonomous discoveries (latest components like RTX 50 series)
      const aIsAutonomous = a.id.includes('auto') || a.id.includes('retailer') || a.id.includes('news');
      const bIsAutonomous = b.id.includes('auto') || b.id.includes('retailer') || b.id.includes('news');
      
      if (aIsAutonomous && !bIsAutonomous) return -1;
      if (!aIsAutonomous && bIsAutonomous) return 1;
      
      // Then prioritize real verified components
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

  const selectedComponent = build[activeCategory];

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

        {/* Category Navigation */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryIcons).map(([category, IconComponent]) => {
              const isSelected = activeCategory === category;
              const hasComponent = build[category as keyof BuildConfiguration] !== null;
              
              return (
                <Button
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setActiveCategory(category as keyof BuildConfiguration)}
                  className={`flex items-center gap-2 ${hasComponent ? 'border-green-500' : ''}`}
                >
                  <IconComponent className="h-4 w-4" />
                  {categoryNames[category as keyof typeof categoryNames]}
                  {hasComponent && <span className="text-green-500">✓</span>}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Component Selection */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {categoryNames[activeCategory]}
            </h2>
            <p className="text-gray-600">
              Budget allocation: ${budgetAllocation[activeCategory].toLocaleString()}
            </p>
          </div>

          {selectedComponent && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Component</h3>
              <ComponentCard
                component={selectedComponent}
                region={region}
                isSelected={true}
                budgetAllocation={budgetAllocation[activeCategory]}
                showCompatibility={true}
                compatibilityStatus={getCompatibilityStatus(selectedComponent, activeCategory)}
              />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedComponent ? 'Alternative Options' : 'Available Components'}
            </h3>
            
            {currentCategoryComponents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No components available for this budget range.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {currentCategoryComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    region={region}
                    isSelected={selectedComponent?.id === component.id}
                    isRecommended={component.price[region] <= budgetAllocation[activeCategory] * 1.1}
                    budgetAllocation={budgetAllocation[activeCategory]}
                    onSelect={(comp) => handleComponentSelect(activeCategory, comp)}
                    showCompatibility={true}
                    compatibilityStatus={getCompatibilityStatus(component, activeCategory)}
                  />
                ))}
              </div>
            )}
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
