
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { Component, Region } from '../utils/budgetAllocator';
import { generateSmartAffiliateLink } from '../utils/budgetAllocator';
import RedditTooltip from './RedditTooltip';

interface ComponentCardProps {
  component: Component;
  region: Region;
  isSelected?: boolean;
  isRecommended?: boolean;
  budgetAllocation?: number;
  onSelect?: (component: Component) => void;
  showCompatibility?: boolean;
  compatibilityStatus?: 'compatible' | 'warning' | 'incompatible';
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  region,
  isSelected = false,
  isRecommended = false,
  budgetAllocation,
  onSelect,
  showCompatibility = false,
  compatibilityStatus = 'compatible'
}) => {
  const currencySymbols = {
    US: '$',
    CA: 'CA$',
    UK: '£',
    DE: '€',
    AU: 'AU$'
  };

  const price = component.price[region];
  const budgetDifference = budgetAllocation ? price - budgetAllocation : 0;

  const getTrendIcon = () => {
    switch (component.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCompatibilityIcon = () => {
    switch (compatibilityStatus) {
      case 'compatible':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'incompatible':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const handleAmazonClick = () => {
    window.open(generateSmartAffiliateLink(component, region), '_blank');
  };

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    } ${isRecommended ? 'border-blue-500' : ''}`}
    onClick={() => onSelect?.(component)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <RedditTooltip componentName={component.name}>
                <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {component.name}
                </h3>
              </RedditTooltip>
              {showCompatibility && getCompatibilityIcon()}
            </div>
            <p className="text-sm text-gray-600 mb-2">{component.description}</p>
            <p className="text-xs text-gray-500">{component.brand}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-lg font-bold text-gray-900">
                {currencySymbols[region]}{price.toLocaleString()}
              </span>
              {getTrendIcon()}
            </div>
            {budgetAllocation && (
              <p className={`text-xs ${
                budgetDifference > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {budgetDifference > 0 ? '+' : ''}{currencySymbols[region]}{Math.abs(budgetDifference)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {isRecommended && (
            <Badge variant="default" className="bg-blue-500">
              Recommended for your budget
            </Badge>
          )}
          {isSelected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Selected
            </Badge>
          )}
          <Badge variant="outline" className={
            component.availability === 'in-stock' ? 'border-green-500 text-green-700' :
            component.availability === 'limited' ? 'border-yellow-500 text-yellow-700' :
            'border-red-500 text-red-700'
          }>
            {component.availability === 'in-stock' ? 'In Stock' :
             component.availability === 'limited' ? 'Limited Stock' :
             'Out of Stock'}
          </Badge>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {component.category === 'cpu' && component.specs.socket && (
              <span>Socket: {component.specs.socket}</span>
            )}
            {component.category === 'gpu' && component.specs.powerDraw && (
              <span>Power: {component.specs.powerDraw}W</span>
            )}
            {component.category === 'ram' && component.specs.capacity && (
              <span>{component.specs.capacity} {component.specs.memoryType}</span>
            )}
            {component.category === 'storage' && component.specs.capacity && (
              <span>{component.specs.capacity} {component.specs.interface}</span>
            )}
            {component.category === 'psu' && component.specs.wattage && (
              <span>{component.specs.wattage}W {component.specs.efficiency}</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAmazonClick();
            }}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Buy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComponentCard;
