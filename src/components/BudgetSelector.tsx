
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Region } from '../utils/budgetAllocator';

interface BudgetSelectorProps {
  onBudgetSet: (budget: number, region: Region) => void;
}

const currencySymbols = {
  US: '$',
  CA: 'CA$',
  UK: '£',
  DE: '€',
  AU: 'AU$'
};

const budgetPresets = [
  { name: 'Entry Level', amount: 600 },
  { name: 'Budget Gaming', amount: 800 },
  { name: 'Mid-Range', amount: 1200 },
  { name: 'High-End', amount: 1800 },
  { name: 'Enthusiast', amount: 2500 },
  { name: 'No Compromise', amount: 3500 }
];

const BudgetSelector: React.FC<BudgetSelectorProps> = ({ onBudgetSet }) => {
  const [budget, setBudget] = useState<number>(1200);
  const [region, setRegion] = useState<Region>('US');
  const [customBudget, setCustomBudget] = useState<string>('');

  const handleBudgetChange = (value: number[]) => {
    setBudget(value[0]);
    setCustomBudget('');
  };

  const handleCustomBudgetChange = (value: string) => {
    setCustomBudget(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setBudget(numValue);
    }
  };

  const handlePresetClick = (amount: number) => {
    setBudget(amount);
    setCustomBudget('');
  };

  const handleContinue = () => {
    onBudgetSet(budget, region);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Build Your Perfect PC
          </h1>
          <p className="text-xl text-gray-600">
            Let's start with your budget and location
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Budget & Region</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Region Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Select Your Region
              </label>
              <Select value={region} onValueChange={(value: Region) => setRegion(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">🇺🇸 United States</SelectItem>
                  <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                  <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                  <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget Presets */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Quick Budget Selection
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {budgetPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={budget === preset.amount ? "default" : "outline"}
                    onClick={() => handlePresetClick(preset.amount)}
                    className="p-4 h-auto flex flex-col"
                  >
                    <span className="text-sm font-medium">{preset.name}</span>
                    <span className="text-lg font-bold">
                      {currencySymbols[region]}{preset.amount.toLocaleString()}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Budget Slider */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Adjust Budget: {currencySymbols[region]}{budget.toLocaleString()}
              </label>
              <Slider
                value={[budget]}
                onValueChange={handleBudgetChange}
                max={5000}
                min={400}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{currencySymbols[region]}400</span>
                <span>{currencySymbols[region]}5,000</span>
              </div>
            </div>

            {/* Custom Budget Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Or Enter Custom Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currencySymbols[region]}
                </span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customBudget}
                  onChange={(e) => handleCustomBudgetChange(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Continue Button */}
            <Button 
              onClick={handleContinue}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              Start Building →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetSelector;
