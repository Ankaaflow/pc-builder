
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
    const recommendedBuild = generateRecommendedBuild(budget, region);
    setBuild(recommendedBuild);
    setIsLoading(false);
  }, [budget, region]);

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

  const getAlternativeComponents = (category: keyof BuildConfiguration) => {
    const categoryData = allComponents[category] || [];
    const budget = budgetAllocation[category];
    
    return categoryData.filter(component => 
      component.price[region] <= budget * 1.5 && // Show components up to 150% of budget
      component.availability === 'in-stock'
    ).sort((a, b) => a.price[region] - b.price[region]);
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

  const currentCategoryComponents = getAlternativeComponents(activeCategory);
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
