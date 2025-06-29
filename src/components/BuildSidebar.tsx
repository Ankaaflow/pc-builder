
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { BuildConfiguration, Region, calculateTotalPrice, checkCompatibility, generateAffiliateLink } from '../utils/budgetAllocator';

interface BuildSidebarProps {
  build: BuildConfiguration;
  budget: number;
  region: Region;
  onComponentRemove?: (category: keyof BuildConfiguration) => void;
}

const BuildSidebar: React.FC<BuildSidebarProps> = ({
  build,
  budget,
  region,
  onComponentRemove
}) => {
  const currencySymbols = {
    US: '$',
    CA: 'CA$',
    UK: '£',
    DE: '€',
    AU: 'AU$'
  };

  const totalPrice = calculateTotalPrice(build, region);
  const remainingBudget = budget - totalPrice;
  const budgetUsedPercentage = (totalPrice / budget) * 100;
  const compatibility = checkCompatibility(build);

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

  const selectedComponents = Object.entries(build).filter(([_, component]) => component !== null);
  const completedComponents = selectedComponents.length;
  const totalComponents = Object.keys(build).length;

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-screen overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Build Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Build</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">
                {completedComponents}/{totalComponents} components
              </span>
            </div>
            <Progress value={(completedComponents / totalComponents) * 100} className="w-full" />
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Budget</span>
                <span className="font-medium">{currencySymbols[region]}{budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Total</span>
                <span className="font-medium">{currencySymbols[region]}{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className={`font-medium ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {currencySymbols[region]}{Math.abs(remainingBudget).toLocaleString()}
                </span>
              </div>
            </div>
            <Progress 
              value={Math.min(budgetUsedPercentage, 100)} 
              className={`w-full ${budgetUsedPercentage > 100 ? 'text-red-500' : ''}`}
            />
            {remainingBudget < 0 && (
              <Badge variant="destructive" className="w-full justify-center">
                Over Budget by {currencySymbols[region]}{Math.abs(remainingBudget).toLocaleString()}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Compatibility Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Compatibility
              {compatibility.isCompatible ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compatibility.isCompatible ? (
              <p className="text-sm text-green-600">All components are compatible!</p>
            ) : (
              <div className="space-y-2">
                {compatibility.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{warning}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Components */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(build).map(([category, component]) => (
              <div key={category} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h4>
                    {component ? (
                      <>
                        <p className="text-xs text-gray-600 truncate">{component.name}</p>
                        <p className="text-xs font-medium text-gray-900">
                          {currencySymbols[region]}{component.price[region].toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">Not selected</p>
                    )}
                  </div>
                  {component && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(generateAffiliateLink(component.asin, region), '_blank')}
                        className="h-6 w-6 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      {onComponentRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onComponentRemove(category as keyof BuildConfiguration)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Save Build
          </Button>
          <Button variant="outline" className="w-full">
            Share Build
          </Button>
          <Button variant="outline" className="w-full">
            Export to Amazon Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuildSidebar;
